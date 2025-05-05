import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-400 py-6 mt-12 shadow-inner">
      <div className="container mx-auto px-4 text-center text-sm">
        <p>&copy; {currentYear} QuickNote Transcriber. All Rights Reserved.</p>
        <p className="mt-1">Made with code and coffee</p>
      </div>
    </footer>
  );
};

export default Footer;