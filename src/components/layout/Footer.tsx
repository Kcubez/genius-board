'use client';

import React from 'react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-6 mt-auto">
      <div className="container">
        <p className="text-sm text-muted-foreground/70 text-center">
          © {currentYear} Genius Board. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
