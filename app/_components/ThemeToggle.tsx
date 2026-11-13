"use client";

import Icon from "./Icon";

/** Light/dark switch. The saved choice is applied before paint by the script in layout.tsx; icons swap via CSS. */
export default function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    // The fade class exists only during the switch so normal hovers and page loads are untouched.
    root.classList.add("theme-fade");
    root.dataset.theme = next;
    try {
      localStorage.setItem("fmc-theme", next);
    } catch {
      // Storage can be blocked; the choice just won't be remembered.
    }
    window.setTimeout(() => root.classList.remove("theme-fade"), 450);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle light and dark mode"
      title="Toggle light / dark"
      className="flex h-9 w-9 items-center justify-center bg-surface-2 hover:bg-red hover:text-white"
    >
      <Icon name="moon" className="theme-moon" />
      <Icon name="sun" className="theme-sun" />
    </button>
  );
}
