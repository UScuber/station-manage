import { PaletteMode } from "@mui/material";
import { createContext, useContext, useState } from "react";

export type ThemeMode = {
  mode: PaletteMode;
  changeDarkMode: (mode: PaletteMode) => void;
};

const DarkModeContext = createContext<ThemeMode>({
  mode: "light",
  changeDarkMode: (_) => {},
});

export const getDarkMode = (): ThemeMode => {
  const [mode, setMode] = useState<PaletteMode>(
    (localStorage.getItem("theme-mode") as PaletteMode) ?? "light"
  );

  const changeDarkMode = (newMode: PaletteMode) => {
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
