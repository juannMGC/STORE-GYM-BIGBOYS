"use client";

import { useState, useEffect, useRef } from "react";

export function useTypewriter(texts: string[], speed = 80, pause = 2000) {
  const [displayed, setDisplayed] = useState("");
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const textsRef = useRef(texts);
  textsRef.current = texts;

  useEffect(() => {
    const current = textsRef.current[textIndex];
    if (!current) return;

    if (!deleting && charIndex < current.length) {
      const timeout = setTimeout(() => {
        setDisplayed(current.slice(0, charIndex + 1));
        setCharIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    }

    if (!deleting && charIndex === current.length) {
      const timeout = setTimeout(() => setDeleting(true), pause);
      return () => clearTimeout(timeout);
    }

    if (deleting && charIndex > 0) {
      const timeout = setTimeout(() => {
        setDisplayed(current.slice(0, charIndex - 1));
        setCharIndex((prev) => prev - 1);
      }, speed / 2);
      return () => clearTimeout(timeout);
    }

    if (deleting && charIndex === 0) {
      const t = setTimeout(() => {
        setDeleting(false);
        setTextIndex((prev) => (prev + 1) % textsRef.current.length);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [charIndex, deleting, textIndex, speed, pause]);

  return displayed;
}
