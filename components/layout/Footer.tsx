import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-700 py-4">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          © {currentYear} HodHod. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
