"use client";

import { useEffect } from "react";
import { usePathname } from 'next/navigation';

const ScrollToTop = () => {
  const pathname = usePathname();
  const hash = typeof window !== 'undefined' ? window.location.hash : '';

  useEffect(() => {
    if (hash) {
      // Wait for the page to render, then scroll to the element
      setTimeout(() => {
        const element = document.getElementById(hash.slice(1));
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
