import { useState, useEffect } from "react";

const BREAKPOINT = 900;

// Detect if running as an installed PWA (standalone display-mode)
const isStandalonePWA = () => {
  if (typeof window === "undefined") return false;
  return (
    ("matchMedia" in window && window.matchMedia("(display-mode: standalone)").matches) ||
    // iOS Safari
    (typeof navigator !== "undefined" && (navigator.standalone === true))
  );
};

// Detect phone (exclude iPad/tablets so they can still use wide layout)
const isPhoneUA = () => {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPod/i.test(navigator.userAgent || "");
};

export const useResponsive = () => {
  const computeIsWide = () => {
    if (typeof window === "undefined") return false;

    const widthIsWide = window.innerWidth >= BREAKPOINT;
    const standalone = isStandalonePWA();
    const isPhone = isPhoneUA();

    // On installed PWA on phones, prefer mobile layout regardless of minor width glitches
    if (standalone && isPhone) return false;

    return widthIsWide;
  };

  const [isWideScreen, setIsWideScreen] = useState(computeIsWide);

  useEffect(() => {
    const handleResize = () => {
      setIsWideScreen(computeIsWide());
    };

    window.addEventListener("resize", handleResize);

    // Some browsers report incorrect width on first load in standalone;
    // re-evaluate after a short delay.
    const t = setTimeout(handleResize, 150);

    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return isWideScreen;
};

export default useResponsive;
