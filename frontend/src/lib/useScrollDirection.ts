"use client";

import { useState, useEffect, useRef } from "react";

export function useScrollDirection() {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const threshold = 10;

    function onScroll() {
      if (ticking.current) return;
      ticking.current = true;

      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const diff = currentY - lastScrollY.current;

        const isMobile = window.innerWidth < 1024;
        if (diff > threshold && currentY > 60 && isMobile) {
          setHidden(true); // scrolling down
        } else if (diff < -threshold) {
          setHidden(false); // scrolling up
        }

        lastScrollY.current = currentY;
        ticking.current = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return hidden;
}
