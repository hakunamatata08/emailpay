"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sun, Moon } from "phosphor-react";

export default function ThemeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize theme based on user's preference
  useEffect(() => {
    // Check for system theme preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const storedTheme = localStorage.getItem("theme");

    if (storedTheme === "dark" || (!storedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setIsDarkMode(!isDarkMode);
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
      aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div className="relative w-6 h-6">
        {/* Sun icon */}
        <motion.div
          animate={{
            opacity: isDarkMode ? 0 : 1,
            scale: isDarkMode ? 0.5 : 1,
            rotate: isDarkMode ? 90 : 0,
          }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Sun weight="fill" className="w-5 h-5 text-neon-yellow" />
        </motion.div>

        {/* Moon icon */}
        <motion.div
          animate={{
            opacity: isDarkMode ? 1 : 0,
            scale: isDarkMode ? 1 : 0.5,
            rotate: isDarkMode ? 0 : -90,
          }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Moon weight="fill" className="w-5 h-5 text-neon-purple" />
        </motion.div>
      </div>
    </button>
  );
}
