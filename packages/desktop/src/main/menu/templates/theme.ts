import { type MenuItemConstructorOptions } from 'electron'
import * as actions from '../actions/theme'
import { t } from '../../i18n'
import type Preference from '../../preferences'

// [i18nLabelKey, themeId] for each selectable theme. The menu label is
// `menu.theme.<labelKey>`; `themeId` is both the menu item id and the value
// passed to `selectTheme` / compared against the saved theme.
// Only ported Typora community themes are listed — the original MarkText/gogh
// themes were removed from the UI per user request.
const LIGHT_THEMES: ReadonlyArray<readonly [string, string]> = [
  ['lapis', 'lapis'],
  ['ursine', 'ursine'],
  ['vue', 'vue']
]

const DARK_THEMES: ReadonlyArray<readonly [string, string]> = [
  ['blackout', 'blackout'],
  ['cobalt', 'cobalt'],
  ['githubNight', 'github-night']
]

export default function (userPreference: Preference): MenuItemConstructorOptions {
  const preferences = userPreference.getAll() as { theme?: string; followSystemTheme?: boolean }
  const { theme, followSystemTheme } = preferences
  const isThemeSelectionEnabled = !followSystemTheme

  const themeRadio = ([labelKey, id]: readonly [string, string]): MenuItemConstructorOptions => ({
    label: t(`menu.theme.${labelKey}`),
    type: 'radio',
    id,
    enabled: isThemeSelectionEnabled,
    checked: theme === id,
    click() {
      actions.selectTheme(id)
    }
  })

  const submenu: MenuItemConstructorOptions[] = [
    // Follow System Theme
    {
      label: t('preferences.theme.followSystemTheme'),
      type: 'checkbox',
      id: 'follow-system-theme',
      checked: !!followSystemTheme,
      click(menuItem) {
        actions.setFollowSystemTheme(menuItem.checked)
      }
    }
  ]

  if (!isThemeSelectionEnabled) {
    submenu.push({
      label: t('menu.theme.followThemDisabled'),
      enabled: false
    })
  }

  // Group themes into nested submenus so the top-level Theme menu stays short
  // instead of expanding to the full window height with 30+ flat items (#4534).
  submenu.push(
    { type: 'separator' },
    {
      label: t('menu.theme.lightThemes'),
      submenu: LIGHT_THEMES.map(themeRadio)
    },
    {
      label: t('menu.theme.darkThemes'),
      submenu: DARK_THEMES.map(themeRadio)
    }
  )

  return {
    label: t('menu.theme.theme'),
    id: 'themeMenu',
    submenu
  }
}
