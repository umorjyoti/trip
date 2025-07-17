import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-300">
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Flex Row for all sections */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start border-b border-gray-700 pb-6 gap-8">
          {/* Address and Social Media */}
                     <div className="flex-1 mb-6 md:mb-0 min-w-[220px]">
             <div className="font-semibold text-lg mb-1">TREKTALES EXPLORERS (OPC) PRIVATE LIMITED</div>
             <div className="text-sm">
               277/B, G-1, 5th D Cross Rd, Hal, HAL 3rd Stage, Indiranagar,<br />
               New Tippasandra, Bengaluru, Karnataka 560075
             </div>
             <div className="text-sm mt-2">Email: support@bengalurutrekkers.in</div>
             <div className="text-sm">Phone: +91- 94494 93112</div>
            <div className="flex space-x-4 mt-4">
              <a href="#" aria-label="Instagram" className="hover:text-white"><svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5zm4.25 2.25a5.25 5.25 0 1 1 0 10.5 5.25 5.25 0 0 1 0-10.5zm0 1.5a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5zm5.25.75a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/></svg></a>
              <a href="#" aria-label="Facebook" className="hover:text-white"><svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg></a>
              <a href="#" aria-label="Twitter" className="hover:text-white"><svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/></svg></a>
              <a href="#" aria-label="YouTube" className="hover:text-white"><svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M21.8 8.001s-.2-1.4-.8-2c-.7-.8-1.5-.8-1.9-.9C16.1 5 12 5 12 5h-.1s-4.1 0-7.1.1c-.4.1-1.2.1-1.9.9-.6.6-.8 2-.8 2S2 9.6 2 11.2v1.6c0 1.6.2 3.2.2 3.2s.2 1.4.8 2c.7.8 1.7.8 2.1.9 1.5.1 6.9.1 6.9.1s4.1 0 7.1-.1c.4-.1 1.2-.1 1.9-.9.6-.6.8-2 .8-2s.2-1.6.2-3.2v-1.6c0-1.6-.2-3.2-.2-3.2zM9.8 15.3V8.7l6.4 3.3-6.4 3.3z"/></svg></a>
              <a href="#" aria-label="LinkedIn" className="hover:text-white"><svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-9h3v9zm-1.5-10.3c-.97 0-1.75-.79-1.75-1.75s.78-1.75 1.75-1.75 1.75.79 1.75 1.75-.78 1.75-1.75 1.75zm13.5 10.3h-3v-4.5c0-1.08-.02-2.47-1.5-2.47-1.5 0-1.73 1.17-1.73 2.38v4.59h-3v-9h2.89v1.23h.04c.4-.75 1.38-1.54 2.84-1.54 3.04 0 3.6 2 3.6 4.59v4.72z"/></svg></a>
            </div>
          </div>
          {/* Company/Career Links */}
          <div className="flex-1 mb-6 md:mb-0 min-w-[220px]">
            <div className="font-semibold mb-2">Company</div>
            <ul className="space-y-1">
              <li><Link to="/about" className="hover:text-white">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-white">Contact Us</Link></li>
              <li><Link to="/career" className="hover:text-white">Careers</Link></li>
              <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white">Terms & Conditions</Link></li>
            </ul>
          </div>
          {/* Custom Trek Link and Other Section */}
          <div className="flex-1 flex flex-col items-start md:items-end justify-between min-w-[220px]">
            <Link to="/custom-trek" className="text-base hover:text-white underline mb-4 md:mb-6">Custom Trek</Link>
            <div>
              <div className="font-semibold mb-2 md:text-right">Other</div>
              <ul className="space-y-1 md:text-right">
                <li><Link to="/blogs" className="hover:text-white">Our Blogs</Link></li>
                <li><Link to="/newsletter" className="hover:text-white">Newsletter</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <p className="mt-8 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} TREKTALES EXPLORERS (OPC) PRIVATE LIMITED. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer; 