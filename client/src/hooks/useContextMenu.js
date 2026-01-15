import { useState, useCallback } from "react";

/**
 * Custom hook for managing context menu state
 * @returns {Object} Context menu state and handlers
 */
export const useContextMenu = () => {
  const [menu, setMenu] = useState({
    isOpen: false,
    x: 0,
    y: 0,
    anchorEl: null,
    position: 'bottom-right', // Default position
    maxX: null, // Optional max X boundary
  });

  /**
   * Handle right-click context menu
   * @param {MouseEvent} e - The mouse event
   */
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    setMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
    });
  }, []);

  /**
   * Handle three dots button click
   * @param {MouseEvent} e - The click event
   * @param {number} menuWidth - Width of the menu (default: 280)
   * @param {number} offset - Offset below the button (default: 8)
   */
  const handleThreeDotsClick = useCallback((e, menuWidth = 280, offset = 8) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();

    let x = rect.right - menuWidth;
    let y = rect.bottom + offset;

    if (x < 0) {
      x = rect.left;
    }

    if (y + 400 > window.innerHeight) {
      y = rect.top - 400;
    }

    setMenu({
      isOpen: true,
      x,
      y,
    });
  }, []);

  /**
   * Handle long press for mobile
   * @param {TouchEvent} e - The touch event
   * @param {number} duration - Duration for long press in ms (default: 500)
   */
  const handleLongPress = useCallback((e, duration = 500) => {
    const touchStartTime = Date.now();

    const handleTouchEnd = () => {
      const touchEndTime = Date.now();
      if (touchEndTime - touchStartTime >= duration) {
        const touch = e.changedTouches?.[0];
        if (touch) {
          setMenu({
            isOpen: true,
            x: touch.clientX,
            y: touch.clientY,
          });
        }
      }
      document.removeEventListener("touchend", handleTouchEnd);
    };

    document.addEventListener("touchend", handleTouchEnd);
  }, []);

  const closeMenu = useCallback(() => {
    setMenu({ isOpen: false, x: 0, y: 0, anchorEl: null, position: 'bottom-right', maxX: null });
  }, []);

  /**
   * Close menu and execute callback
   * @param {Function} callback - Function to execute before closing
   */
  const closeMenuWithCallback = useCallback(
    (callback) => {
      if (callback) callback();
      closeMenu();
    },
    [closeMenu]
  );

  /**
   * Update menu position
   * @param {number} x - New X position
   * @param {number} y - New Y position
   */
  const updateMenuPosition = useCallback((x, y) => {
    setMenu((prevMenu) => ({
      ...prevMenu,
      x,
      y,
    }));
  }, []);

  return {
    // State
    menu,
    isOpen: menu.isOpen,
    x: menu.x,
    y: menu.y,
    anchorEl: menu.anchorEl,
    position: menu.position,
    maxX: menu.maxX,

    // Handlers
    handleContextMenu,
    handleThreeDotsClick,
    handleLongPress,
    closeMenu,
    closeMenuWithCallback,
    updateMenuPosition,
    setMenu,
  };
};

export default useContextMenu;
