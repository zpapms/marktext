export interface ThemeDescriptor {
  name: string
}

// Only popular Typora community themes are exposed in the UI — the previous
// MarkText/gogh themes (dracula, nord, gruvbox, catppuccin, tokyo-night, ayu,
// solarized, …) have been removed from the selectable list per user request.
export const themes: ReadonlyArray<ThemeDescriptor> = [
  // Typora themes — Light (alphabetical)
  { name: 'lapis' },
  { name: 'ursine' },
  { name: 'vue' },
  // Typora themes — Dark (alphabetical)
  { name: 'blackout' },
  { name: 'cobalt' },
  { name: 'github-night' }
]

// getAutoSwitchThemeOptions removed - no longer needed
// We now use a boolean toggle for followSystemTheme instead of a dropdown
