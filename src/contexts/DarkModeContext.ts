import { createContext, useContext, useState } from "react";

export type DarkLight = "light" | "dark";
export type ThemeMode = {
  mode: DarkLight;
  changeDarkMode: (mode: DarkLight) => void;
};

const DarkModeContext = createContext<ThemeMode>({
  mode: "light",
  changeDarkMode: (_) => {},
});

export const getDarkMode = (): ThemeMode => {
  const [mode, setMode] = useState<DarkLight>(
    (localStorage.getItem("theme-mode") as DarkLight) ?? "light"
  );

  const changeDarkMode = (newMode: DarkLight) => {
    localStorage.setItem("theme-mode", newMode);
    setMode(newMode);
  };

  return {
    mode: mode,
    changeDarkMode: changeDarkMode,
  };
};

export const DarkModeProvider = DarkModeContext.Provider;

export const useDarkMode = () => useContext(DarkModeContext);
