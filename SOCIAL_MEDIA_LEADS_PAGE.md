# Social Media Leads Page

## Overview
A dedicated page for capturing leads from social media campaigns. This page is designed to be accessible via direct links and provides a full-page lead capture experience with mobile-first design.

## Features

### Design & UX
- **Mobile-first responsive design** - Optimized for all screen sizes
- **Aesthetic gradient backgrounds** - Modern visual appeal with emerald/teal color scheme
- **Social media branding** - Icons for Instagram, Facebook, Twitter, and LinkedIn
- **Trust indicators** - Visual elements that build confidence
- **Smooth animations** - Hover effects and transitions for better UX

### Form Fields
- **Name** - Optional text input
- **Email** - Required email input with validation
- **Phone** - Optional phone number input
- **Questions/Comments** - Large textarea for detailed inquiries
- **Request Call Back** - Checkbox option

### Functionality
- **Lead source tracking** - Automatically sets source as "Social Media"
- **Form validation** - Email required, proper input validation
- **Success feedback** - Toast notifications for user feedback
- **Form reset** - Clears form after successful submission
- **Error handling** - Graceful error handling with user-friendly messages

## Technical Implementation

### File Structure
```
frontend/src/pages/SocialMediaLeads.js
```

### Route
```
/social-media-leads
```

### API Integration
- Uses existing `createLead` API function
- Sends lead data with source: "Social Media"
- Integrates with existing lead management system

### Dependencies
- React hooks for state management
- React Icons for social media icons
- React Toastify for notifications
- Tailwind CSS for styling

## Usage

### Direct Access
Users can access the page directly via:
```
https://yourdomain.com/social-media-leads
```

### Social Media Integration
- Share this URL on social media platforms
- Use in social media ad campaigns
- Include in bio links on social profiles
- Use in social media stories and posts

### Lead Management
- All leads are captured in the existing lead management system
- Admins can view and manage leads from the admin panel
- Leads are tagged with "Social Media" source for tracking

## Design Highlights

### Hero Section
- Large, attention-grabbing headline
- Social media platform icons
- Trust indicators (free consultation, expert guidance, special offers)
- Gradient background with subtle pattern

### Form Section
- Clean, card-based design
- Gradient header with call-to-action
- Responsive grid layout
- Icon-enhanced input fields
- Clear visual hierarchy

### Trust Building
- Trust indicators section
- Privacy policy links
- Professional design elements
- Clear value propositions

## Mobile Optimization

### Responsive Features
- Stacked layout on mobile devices
- Touch-friendly input sizes
- Optimized spacing for mobile screens
- Readable typography at all sizes
- Fast loading with minimal dependencies

### Mobile-First Approach
- Designed for mobile screens first
- Progressive enhancement for larger screens
- Optimized touch targets
- Minimal scrolling required

## Future Enhancements

### Potential Additions
- A/B testing capabilities
- Advanced form validation
- Integration with CRM systems
- Analytics tracking
- Custom branding options
- Multi-language support

### Analytics Integration
- Track page views and conversions
- Monitor social media traffic sources
- Measure form completion rates
- Analyze user behavior patterns

## Maintenance

### Regular Tasks
- Monitor form submission success rates
- Check for any API integration issues
- Update social media icons if needed
- Review and update copy as needed
- Test on different devices and browsers

### Performance Monitoring
- Page load times
- Form submission success rates
- Mobile vs desktop conversion rates
- Social media traffic patterns 