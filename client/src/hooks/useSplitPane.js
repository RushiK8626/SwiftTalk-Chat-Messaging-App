import { useEffect, useRef, useState } from "react";
const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

export default function useSplitPane(initialWidth = 360, options = {}) {
  const { minWidth = 300, maxWidth = 560, edge = "right" } = options;
  const [paneWidth, setPaneWidth] = useState(initialWidth);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);

  const startDragging = () => {
    isDraggingRef.current = true;
    setIsDragging(true);
    document.body.style.cursor = "col-resize";  
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (!isDraggingRef.current) return;

      const nextWidth = edge === "left" ? event.clientX : window.innerWidth - event.clientX;
      setPaneWidth(clamp(nextWidth, minWidth, maxWidth));
    };

    const stopDragging = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
      document.body.style.cursor = "";  
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopDragging);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopDragging);
    };
  }, [edge, minWidth, maxWidth]);

  return {
    paneWidth,
    startDragging,
    isDragging,
  };
}