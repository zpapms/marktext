// NOTE: This are mutable fields that may change at runtime.

import { type BaseWindow, type BrowserWindow, type MenuItemConstructorOptions } from 'electron'
import { t } from '../../i18n'

// Use function form to avoid calling the translation function during module load
export const getCUT = (): MenuItemConstructorOptions => ({
  label: t('contextMenu.cut'),
  id: 'cutMenuItem',
  role: 'cut'
})

export const getCOPY = (): MenuItemConstructorOptions => ({
  label: t('contextMenu.copy'),
  id: 'copyMenuItem',
  role: 'copy'
})

export const getPASTE = (): MenuItemConstructorOptions => ({
  label: t('contextMenu.paste'),
  id: 'pasteMenuItem',
  role: 'paste'
})

export const getCopyAsRich = (): MenuItemConstructorOptions => ({
  label: t('contextMenu.copyAsRich'),
  id: 'copyAsRichMenuItem',
  click(_menuItem, targetWindow) {
    if (targetWindow) {
      ;(targetWindow as BrowserWindow).webContents.send('mt::cm-copy-as-rich')
    }
  }
})

export const getCopyAsHtml = (): MenuItemConstructorOptions => ({
  label: t('contextMenu.copyAsHtml'),
  id: 'copyAsHtmlMenuItem',
  click(_menuItem, targetWindow) {
    if (targetWindow) {
      ;(targetWindow as BrowserWindow).webContents.send('mt::cm-copy-as-html')
    }
  }
})

export const getPasteAsPlainText = (): MenuItemConstructorOptions => ({
  label: t('contextMenu.pasteAsPlainText'),
  id: 'pasteAsPlainTextMenuItem',
  click(_menuItem, targetWindow) {
    if (targetWindow) {
      ;(targetWindow as BrowserWindow).webContents.send('mt::cm-paste-as-plain-text')
    }
  }
})

type LookupTarget = BaseWindow & {
  webContents: {
    showDefinitionForSelection: () => void
  }
}

const canShowDefinitionForSelection = (
  targetWindow?: BaseWindow | null
): targetWindow is LookupTarget => {
  const candidate = targetWindow as
    | (BaseWindow & {
        webContents?: { showDefinitionForSelection?: unknown }
      })
    | null
    | undefined

  return typeof candidate?.webContents?.showDefinitionForSelection === 'function'
}

export const lookUpSelection = (
  selectionText: string,
  targetWindow?: BaseWindow | null
): boolean => {
  const selection = selectionText.trim()
  if (!selection || !canShowDefinitionForSelection(targetWindow)) {
    return false
  }

  targetWindow.webContents.showDefinitionForSelection()
  return true
}

export const getLookUp = (selectionText: string): MenuItemConstructorOptions => ({
  label: t('contextMenu.lookUp', { selection: selectionText.trim() }),
  id: 'lookUpMenuItem',
  click(_menuItem, targetWindow) {
    lookUpSelection(selectionText, targetWindow)
  }
})

export const getInsertBefore = (): MenuItemConstructorOptions => ({
  label: t('contextMenu.insertParagraphBefore'),
  id: 'insertParagraphBeforeMenuItem',
  click(_menuItem, targetWindow) {
    if (targetWindow) {
      ;(targetWindow as BrowserWindow).webContents.send('mt::cm-insert-paragraph', 'before')
    }
  }
})

export const getInsertAfter = (): MenuItemConstructorOptions => ({
  label: t('contextMenu.insertParagraphAfter'),
  id: 'insertParagraphAfterMenuItem',
  click(_menuItem, targetWindow) {
    if (targetWindow) {
      ;(targetWindow as BrowserWindow).webContents.send('mt::cm-insert-paragraph', 'after')
    }
  }
})

// Formatting entries reuse the same IPC channels the native menu uses, so the
// renderer's existing handlers apply them to the current selection without any
// extra plumbing.
const sendFormatAction = (
  targetWindow: BaseWindow | undefined,
  channel: 'mt::editor-format-action' | 'mt::editor-paragraph-action',
  type: string
): void => {
  if (targetWindow) {
    ;(targetWindow as BrowserWindow).webContents.send(channel, { type })
  }
}

const formatItem = (id: string, label: string, type: string): MenuItemConstructorOptions => ({
  id,
  label,
  click(_menuItem, targetWindow) {
    sendFormatAction(targetWindow, 'mt::editor-format-action', type)
  }
})

const paragraphItem = (id: string, label: string, type: string): MenuItemConstructorOptions => ({
  id,
  label,
  click(_menuItem, targetWindow) {
    sendFormatAction(targetWindow, 'mt::editor-paragraph-action', type)
  }
})

export const getFormatSubmenu = (): MenuItemConstructorOptions => ({
  label: t('menu.format.format'),
  id: 'contextFormatMenuItem',
  submenu: [
    formatItem('ctxStrongMenuItem', t('menu.format.bold'), 'strong'),
    formatItem('ctxEmphasisMenuItem', t('menu.format.italic'), 'em'),
    formatItem('ctxUnderlineMenuItem', t('menu.format.underline'), 'u'),
    formatItem('ctxStrikeMenuItem', t('menu.format.strikethrough'), 'del'),
    formatItem('ctxHighlightMenuItem', t('menu.format.highlight'), 'mark'),
    formatItem('ctxInlineCodeMenuItem', t('menu.format.inlineCode'), 'inline_code'),
    SEPARATOR,
    {
      label: t('menu.paragraph.title'),
      submenu: [
        paragraphItem('ctxParagraphMenuItem', t('menu.paragraph.paragraph'), 'paragraph'),
        paragraphItem('ctxHeading1MenuItem', t('menu.paragraph.heading1'), 'heading 1'),
        paragraphItem('ctxHeading2MenuItem', t('menu.paragraph.heading2'), 'heading 2'),
        paragraphItem('ctxHeading3MenuItem', t('menu.paragraph.heading3'), 'heading 3'),
        paragraphItem('ctxHeading4MenuItem', t('menu.paragraph.heading4'), 'heading 4'),
        paragraphItem('ctxHeading5MenuItem', t('menu.paragraph.heading5'), 'heading 5'),
        paragraphItem('ctxHeading6MenuItem', t('menu.paragraph.heading6'), 'heading 6'),
        SEPARATOR,
        paragraphItem('ctxQuoteBlockMenuItem', t('menu.paragraph.quoteBlock'), 'blockquote'),
        paragraphItem('ctxCodeFencesMenuItem', t('menu.paragraph.codeFences'), 'pre'),
        paragraphItem('ctxOrderListMenuItem', t('menu.paragraph.orderedList'), 'ol-order'),
        paragraphItem('ctxBulletListMenuItem', t('menu.paragraph.bulletList'), 'ul-bullet'),
        paragraphItem('ctxTaskListMenuItem', t('menu.paragraph.taskList'), 'ul-task'),
        SEPARATOR,
        paragraphItem('ctxTableMenuItem', t('menu.paragraph.table'), 'table'),
        paragraphItem('ctxHorizontalLineMenuItem', t('menu.paragraph.horizontalRule'), 'hr'),
        paragraphItem('ctxMathBlockMenuItem', t('menu.paragraph.mathBlock'), 'mathblock')
      ]
    },
    SEPARATOR,
    formatItem('ctxClearFormatMenuItem', t('menu.format.clearFormat'), 'clear')
  ]
})

// Retained for backward compatibility
export const CUT = getCUT()
export const COPY = getCOPY()
export const PASTE = getPASTE()
export const COPY_AS_RICH = getCopyAsRich()
export const COPY_AS_HTML = getCopyAsHtml()
export const PASTE_AS_PLAIN_TEXT = getPasteAsPlainText()
export const INSERT_BEFORE = getInsertBefore()
export const INSERT_AFTER = getInsertAfter()

export const SEPARATOR: MenuItemConstructorOptions = {
  type: 'separator'
}
