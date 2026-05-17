// Re-export useDarkMode from the context module.
// This keeps all existing imports working while ensuring a single
// shared instance via DarkModeContext rather than isolated hook state.
export { useDarkMode } from '../context/DarkModeContext'
