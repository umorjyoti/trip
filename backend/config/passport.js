const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

console.log('Configuring Google OAuth with:', {
  hasClientId: !!process.env.GOOGLE_CLIENT_ID,
  hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_OAUTH_REDIRECT_URL || '/api/auth/google/callback'
});

// Helper function to generate a unique username
async function generateUniqueUsername(baseUsername) {
  let username = baseUsername;
  let counter = 1;
  
  while (true) {
    // Check if username exists
    const existingUser = await User.findOne({ username });
    if (!existingUser) {
      return username;
    }
    // If username exists, add counter to it
    username = `${baseUsername}${counter}`;
    counter++;
  }
}

// Only configure Google Strategy if credentials are available
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_OAUTH_REDIRECT_URL || '/api/auth/google/callback',
        scope: ['profile', 'email']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log('Google profile received:', {
            id: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName
          });

          // First check if user exists by email OR googleId
          let user = await User.findOne({
            $or: [
              { email: profile.emails[0].value },
              { googleId: profile.id }
            ]
          });

          if (user) {
            // If user exists but doesn't have googleId, update it
            if (!user.googleId) {
              user.googleId = profile.id;
              await user.save();
            }
            console.log('Existing user found:', user._id);
            return done(null, user);
          }

          // If user doesn't exist, create a new user
          const baseUsername = profile.emails[0].value.split('@')[0];
          const username = await generateUniqueUsername(baseUsername);
          console.log('Creating new user with username:', username);

          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            username: username,
            // Set a random password since we're using Google auth
            password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
          });

          console.log('New user created:', user._id);
          return done(null, user);
        } catch (error) {
          console.error('Google strategy error:', error);
          return done(error, null);
        }
      }
    )
  );
} else {
  console.warn('Google OAuth credentials not found in environment variables. Google authentication will not be available.');
}

passport.serializeUser((user, done) => {
  console.log('Serializing user:', user._id);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    console.log('Deserialized user:', user ? user._id : 'not found');
    done(null, user);
  } catch (error) {
    console.error('Deserialize error:', error);
    done(error, null);
  }
});

module.exports = passport;