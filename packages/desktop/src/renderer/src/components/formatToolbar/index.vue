<template>
  <div
    v-if="formatToolbar && !sourceCode"
    class="format-toolbar-root"
    :class="autoHide ? 'is-overlay' : 'is-pinned'"
  >
    <!-- Invisible strip at the very top of the editor that reveals the bar. -->
    <div v-if="autoHide" class="ft-hover-strip" @mouseenter="reveal" />
    <div
      v-show="!autoHide || visible"
      class="format-toolbar"
      @mouseenter="reveal"
      @mouseleave="scheduleHide"
    >
      <!-- paragraph style -->
      <div class="ft-group" :data-tooltip="t('formatToolbar.paragraphStyle')">
        <select class="ft-select" :value="paragraphValue" @change="onParagraphChange">
          <option v-for="opt in paragraphOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <span class="ft-sep" />

      <!-- inline formats -->
      <div class="ft-group">
        <button
          v-for="btn in inlineButtons"
          :key="btn.token"
          class="ft-btn"
          type="button"
          :data-tooltip="btn.label"
          @mousedown.prevent
          @click="runFormat(btn.token)"
        >
          <span class="ft-tx" :class="btn.cls">{{ btn.glyph }}</span>
        </button>
        <button
          class="ft-btn"
          type="button"
          :data-tooltip="t('menu.format.highlight')"
          @mousedown.prevent
          @click="runFormat('mark')"
        >
          <span class="ft-mark">A</span>
        </button>
      </div>

      <span class="ft-sep" />

      <!-- lists -->
      <div class="ft-group">
        <button
          class="ft-btn"
          type="button"
          :data-tooltip="t('menu.paragraph.bulletList')"
          @mousedown.prevent
          @click="runParagraph('ul-bullet')"
        >
          <svg viewBox="0 0 24 24" class="ft-svg">
            <path d="M9 6h11 M9 12h11 M9 18h11" />
            <circle cx="4.5" cy="6" r="1.4" />
            <circle cx="4.5" cy="12" r="1.4" />
            <circle cx="4.5" cy="18" r="1.4" />
          </svg>
        </button>
        <button
          class="ft-btn"
          type="button"
          :data-tooltip="t('menu.paragraph.orderedList')"
          @mousedown.prevent
          @click="runParagraph('ol-order')"
        >
          <svg viewBox="0 0 24 24" class="ft-svg">
            <path d="M9 6h11 M9 12h11 M9 18h11" />
            <text x="2" y="8" font-size="7" fill="currentColor" stroke="none">1</text>
            <text x="2" y="14" font-size="7" fill="currentColor" stroke="none">2</text>
            <text x="2" y="20" font-size="7" fill="currentColor" stroke="none">3</text>
          </svg>
        </button>
        <button
          class="ft-btn"
          type="button"
          :data-tooltip="t('menu.paragraph.taskList')"
          @mousedown.prevent
          @click="runParagraph('ul-task')"
        >
          <svg viewBox="0 0 24 24" class="ft-svg">
            <rect x="3" y="4.5" width="6" height="6" rx="1.2" />
            <path d="M4.6 7.5l1.1 1.1L7.6 6.4" />
            <rect x="3" y="13.5" width="6" height="6" rx="1.2" />
            <path d="M11 7.5h10 M11 16.5h10" />
          </svg>
        </button>
      </div>

      <span class="ft-sep" />

      <!-- insert -->
      <div class="ft-group">
        <button
          class="ft-btn"
          type="button"
          :data-tooltip="t('menu.format.hyperlink')"
          @mousedown.prevent
          @click="runFormat('link')"
        >
          <svg viewBox="0 0 24 24" class="ft-svg">
            <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.4 1.4" />
            <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.4-1.4" />
          </svg>
        </button>
        <button
          class="ft-btn"
          type="button"
          :data-tooltip="t('menu.format.image')"
          @mousedown.prevent
          @click="runFormat('image')"
        >
          <svg viewBox="0 0 24 24" class="ft-svg">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <circle cx="8.5" cy="9.5" r="1.6" />
            <path d="M21 16.5l-4.5-4.5-6 6-2.5-2.5L3 20" />
          </svg>
        </button>
        <button
          class="ft-btn"
          type="button"
          :data-tooltip="t('menu.paragraph.table')"
          @mousedown.prevent
          @click="runParagraph('table')"
        >
          <svg viewBox="0 0 24 24" class="ft-svg">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M3 10h18 M3 15h18 M9.5 4v16 M15.5 4v16" />
          </svg>
        </button>
        <button
          class="ft-btn"
          type="button"
          :data-tooltip="t('menu.paragraph.horizontalRule')"
          @mousedown.prevent
          @click="runParagraph('hr')"
        >
          <svg viewBox="0 0 24 24" class="ft-svg">
            <path d="M3 12h18" />
          </svg>
        </button>
        <button
          class="ft-btn"
          type="button"
          :data-tooltip="t('menu.format.inlineMath')"
          @mousedown.prevent
          @click="runFormat('inline_math')"
        >
          <svg viewBox="0 0 24 24" class="ft-svg">
            <path d="M4 13h3l2.5 6L13.5 6H19" />
          </svg>
        </button>
        <button
          class="ft-btn"
          type="button"
          :data-tooltip="t('menu.paragraph.mathBlock')"
          @mousedown.prevent
          @click="runParagraph('mathblock')"
        >
          <svg viewBox="0 0 24 24" class="ft-svg">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M7 13h2l1.5 3.5L13.5 9H17" />
          </svg>
        </button>
      </div>

      <span class="ft-sep" />

      <!-- typography: applies to the whole editor (Markdown has no per-run font) -->
      <div class="ft-group ft-group-type">
        <span class="ft-label">{{ t('formatToolbar.font') }}</span>
        <input
          class="ft-font"
          :value="editorFontFamily"
          list="ft-font-list"
          spellcheck="false"
          @change="onFontFamilyChange"
        />
        <datalist id="ft-font-list">
          <option v-for="font in fontList" :key="font" :value="font" />
        </datalist>
        <span class="ft-label">{{ t('formatToolbar.fontSize') }}</span>
        <button
          class="ft-btn ft-step"
          type="button"
          :data-tooltip="t('formatToolbar.fontSize')"
          @mousedown.prevent
          @click="stepFontSize(-1)"
        >
          −
        </button>
        <span class="ft-size">{{ fontSize }}</span>
        <button
          class="ft-btn ft-step"
          type="button"
          :data-tooltip="t('formatToolbar.fontSize')"
          @mousedown.prevent
          @click="stepFontSize(1)"
        >
          +
        </button>
      </div>

      <span class="ft-sep" />

      <div class="ft-group">
        <button
          class="ft-btn ft-clear"
          type="button"
          @mousedown.prevent
          @click="runFormat('clear')"
        >
          {{ t('formatToolbar.clearFormat') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import bus from '@/bus'
import { usePreferencesStore } from '@/store/preferences'

const { t } = useI18n()
const preferencesStore = usePreferencesStore()
const { formatToolbar, formatToolbarAutoHide, sourceCode, editorFontFamily, fontSize } =
  storeToRefs(preferencesStore)

const autoHide = computed(() => formatToolbarAutoHide.value !== false)
const visible = ref(false)
let hideTimer: ReturnType<typeof setTimeout> | null = null

const reveal = (): void => {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  visible.value = true
}

// Small grace period so moving the pointer between the strip and the bar does
// not flicker the toolbar away.
const scheduleHide = (): void => {
  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    visible.value = false
  }, 160)
}

interface InlineButton {
  token: string
  label: string
  glyph: string
  cls?: string
}

const inlineButtons = computed<InlineButton[]>(() => [
  { token: 'strong', label: t('menu.format.bold'), glyph: 'B', cls: 'ft-bold' },
  { token: 'em', label: t('menu.format.italic'), glyph: 'I', cls: 'ft-italic' },
  { token: 'u', label: t('menu.format.underline'), glyph: 'U', cls: 'ft-underline' },
  { token: 'del', label: t('menu.format.strikethrough'), glyph: 'S', cls: 'ft-strike' },
  { token: 'inline_code', label: t('menu.format.inlineCode'), glyph: '</>' }
])

const paragraphOptions = computed(() => [
  { value: 'paragraph', label: t('menu.paragraph.paragraph') },
  { value: 'heading 1', label: t('menu.paragraph.heading1') },
  { value: 'heading 2', label: t('menu.paragraph.heading2') },
  { value: 'heading 3', label: t('menu.paragraph.heading3') },
  { value: 'heading 4', label: t('menu.paragraph.heading4') },
  { value: 'heading 5', label: t('menu.paragraph.heading5') },
  { value: 'heading 6', label: t('menu.paragraph.heading6') },
  { value: 'blockquote', label: t('menu.paragraph.quoteBlock') },
  { value: 'pre', label: t('menu.paragraph.codeFences') }
])

// Block-level commands are handled by the editor through the same bus channel
// the native menu uses, so no IPC round-trip is needed here.
const runFormat = (token: string): void => {
  bus.emit('format', token)
}

const runParagraph = (token: string): void => {
  bus.emit('paragraph', token)
}

const paragraphValue = ref('paragraph')

const onParagraphChange = (event: Event): void => {
  const value = (event.target as HTMLSelectElement).value
  paragraphValue.value = value
  runParagraph(value)
}

const fontList = ref<string[]>([])

const onFontFamilyChange = (event: Event): void => {
  const value = (event.target as HTMLInputElement).value.trim()
  if (!value) return
  preferencesStore.SET_SINGLE_PREFERENCE({ type: 'editorFontFamily', value })
}

const stepFontSize = (delta: number): void => {
  const next = Math.min(32, Math.max(12, Number(fontSize.value) + delta))
  preferencesStore.SET_SINGLE_PREFERENCE({ type: 'fontSize', value: next })
}

let offExternalParagraph: (() => void) | null = null
let offExternalFormat: (() => void) | null = null

onMounted(async () => {
  try {
    const fonts = await window.fonts.list()
    fontList.value = (fonts || []).map((f) => f.replace(/"/g, '').trim()).slice(0, 400)
  } catch {
    fontList.value = []
  }
  // Re-sync the paragraph dropdown when the native menu / context menu changes
  // the block type.
  offExternalParagraph = window.electron.ipcRenderer.on(
    'mt::editor-paragraph-action',
    onExternalParagraph
  )
  offExternalFormat = window.electron.ipcRenderer.on('mt::editor-format-action', onExternalFormat)
})

const onExternalParagraph = (_e: unknown, payload: { type?: string } = {}): void => {
  const type = payload?.type
  if (!type) return
  if (type === 'paragraph' || /^heading [1-6]$/.test(type)) {
    paragraphValue.value = type
  } else if (type === 'blockquote') {
    paragraphValue.value = 'blockquote'
  } else if (type === 'pre') {
    paragraphValue.value = 'pre'
  } else {
    // Any other block conversion means we are no longer in one of the styles
    // offered by the dropdown.
    paragraphValue.value = 'paragraph'
  }
}

const onExternalFormat = (): void => {
  // Inline formats do not affect the paragraph dropdown; nothing to sync.
}

onBeforeUnmount(() => {
  if (hideTimer) clearTimeout(hideTimer)
  offExternalParagraph?.()
  offExternalFormat?.()
})
</script>

<style scoped>
.format-toolbar-root {
  /* Overlay mode: floats above the editor and only reacts to the pointer. */
  &.is-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 40;
    pointer-events: none;
  }
  /* Pinned mode: a normal flex child of the editor column, always visible. */
  &.is-pinned {
    position: relative;
    z-index: 40;
  }
}

.ft-hover-strip {
  height: 18px;
  pointer-events: auto;
}

.format-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
  padding: 4px 8px;
  box-sizing: border-box;
  background: var(--floatBgColor, var(--editorBgColor));
  border-bottom: 1px solid var(--floatBorderColor, var(--editorColor10));
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  pointer-events: auto;
  font-size: 13px;
  color: var(--editorColor);
  user-select: none;
}

.is-pinned .format-toolbar {
  box-shadow: none;
}

.ft-group {
  display: flex;
  align-items: center;
  gap: 2px;
}

.ft-sep {
  width: 1px;
  height: 18px;
  margin: 0 5px;
  background: var(--floatBorderColor, var(--editorColor10));
  flex: none;
}

.ft-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 26px;
  padding: 0 4px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--editorColor);
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;

  &:hover {
    background: var(--floatHoverColor, var(--editorColor04));
    color: var(--themeColor);
  }
  &:active {
    background: var(--editorColor10);
  }
}

.ft-svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.ft-tx {
  display: inline-block;
  font-size: 14px;
  font-family: Georgia, 'Times New Roman', serif;
  line-height: 1;
}

.ft-bold {
  font-weight: 800;
}

.ft-italic {
  font-style: italic;
  font-family: Georgia, serif;
}

.ft-underline {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.ft-strike {
  text-decoration: line-through;
}

.ft-mark {
  display: inline-block;
  padding: 0 3px;
  border-radius: 3px;
  font-weight: 700;
  font-size: 13px;
  background: rgba(255, 214, 0, 0.55);
  color: inherit;
}

.ft-select {
  height: 26px;
  max-width: 92px;
  padding: 0 4px;
  border: 1px solid var(--floatBorderColor, var(--editorColor10));
  border-radius: 4px;
  background: transparent;
  color: var(--editorColor);
  font-size: 12px;
  cursor: pointer;
  outline: none;
}

.ft-group-type {
  gap: 4px;
}

.ft-label {
  font-size: 12px;
  color: var(--editorColor60);
}

.ft-font {
  width: 104px;
  height: 24px;
  padding: 0 4px;
  border: 1px solid var(--floatBorderColor, var(--editorColor10));
  border-radius: 4px;
  background: transparent;
  color: var(--editorColor);
  font-size: 12px;
  outline: none;
}

.ft-step {
  min-width: 20px;
  height: 22px;
  font-size: 14px;
  font-weight: 700;
}

.ft-size {
  min-width: 18px;
  text-align: center;
  font-size: 12px;
  color: var(--editorColor80, var(--editorColor));
}

.ft-clear {
  font-size: 12px;
  padding: 0 8px;
}

/* ---- Hover tooltips (data-tooltip) ----
   Native `title` tooltips are unreliable inside floating/re-patched layers,
   so labels are rendered as CSS tooltips instead. */
.ft-btn[data-tooltip],
.ft-group[data-tooltip] {
  position: relative;
}
.ft-btn[data-tooltip]::after,
.ft-group[data-tooltip]::after {
  content: attr(data-tooltip);
  position: absolute;
  top: calc(100% + 7px);
  left: 50%;
  z-index: 60;
  padding: 3px 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 4px;
  background: rgba(48, 49, 51, 0.96);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.28);
  color: #f5f5f5;
  font-size: 12px;
  line-height: 1.5;
  white-space: nowrap;
  opacity: 0;
  transform: translate(-50%, -3px);
  pointer-events: none;
  transition:
    opacity 0.12s ease,
    transform 0.12s ease;
}
.ft-btn[data-tooltip]:hover::after,
.ft-group[data-tooltip]:hover::after {
  opacity: 1;
  transform: translate(-50%, 0);
}
</style>
