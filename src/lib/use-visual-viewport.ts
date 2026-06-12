"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface VisualViewportState {
  height: number;
  width: number;
  offsetTop: number;
  offsetLeft: number;
  keyboardHeight: number;
  isKeyboardOpen: boolean;
}

const KEYBOARD_THRESHOLD = 150;

export function useVisualViewport(): VisualViewportState {
  const [state, setState] = useState<VisualViewportState>({
    height: 0,
    width: 0,
    offsetTop: 0,
    offsetLeft: 0,
    keyboardHeight: 0,
    isKeyboardOpen: false,
  });

  const handleViewportChange = useCallback(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const layoutHeight = window.innerHeight;
    const kbHeight = Math.max(0, layoutHeight - vv.height);
    setState({
      height: vv.height,
      width: vv.width,
      offsetTop: vv.offsetTop,
      offsetLeft: vv.offsetLeft,
      keyboardHeight: kbHeight,
      isKeyboardOpen: kbHeight > KEYBOARD_THRESHOLD,
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    handleViewportChange();
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", handleViewportChange);
      vv.addEventListener("scroll", handleViewportChange);
    }
    return () => {
      if (vv) {
        vv.removeEventListener("resize", handleViewportChange);
        vv.removeEventListener("scroll", handleViewportChange);
      }
    };
  }, [handleViewportChange]);

  return state;
}

export function useKeyboardAwareScroll(isKeyboardOpen: boolean, scrollToBottom: () => void) {
  const prevKeyboardOpen = useRef(false);

  useEffect(() => {
    if (isKeyboardOpen && !prevKeyboardOpen.current) {
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
    prevKeyboardOpen.current = isKeyboardOpen;
  }, [isKeyboardOpen, scrollToBottom]);
}
