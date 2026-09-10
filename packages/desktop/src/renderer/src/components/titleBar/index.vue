<template>
  <div>
    <div v-if="showTitleBar" class="title-bar-editor-bg" :class="{ 'tabs-visible': showTabBar }" />
    <div
      v-if="showTitleBar"
      class="title-bar"
      :class="[
        { active: active },
        { 'tabs-visible': showTabBar },
        { frameless: titleBarStyle === 'custom' },
        { isOsx: isOsx },
        { 'with-window-controls': showWindowControls }
      ]"
    >
      <div class="title" @dblclick.stop="toggleMaxmizeOnMacOS">
        <span v-if="!filename">MarkText</span>
        <span v-else>
          <template v-if="titleBarShowPath">
            <span v-for="(path, index) of paths" :key="index">
              {{ path }}
              <el-icon class="path-arrow" :size="12">
                <ArrowRight />
              </el-icon>
            </span>
          </template>
          <span
            class="filename"
            :class="{ isOsx: platform === 'darwin' }"
            :title="t('menu.file.rename')"
            @click="rename"
          >
            {{ filename }}
          </span>
          <span class="save-dot" :class="{ show: !isSaved }" />
        </span>
      </div>
      <div v-if="showTitleBar" class="title-bar-toggle title-no-drag" :class="{ isOsx }">
        <button
          type="button"
          class="tb-btn"
          :class="{ collapsed: !showSideBar }"
          :data-tooltip="t('menu.view.toggleSidebar')"
          @click.stop="toggleSideBar"
        >
          <svg viewBox="0 0 24 24" class="tb-svg">
            <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
            <path d="M9.5 4.5v15" />
          </svg>
        </button>
      </div>
      <div :class="showCustomTitleBar ? 'left-toolbar title-no-drag' : 'right-toolbar'">
        <div
          v-if="showCustomTitleBar"
          class="frameless-titlebar-menu title-no-drag"
          @click.stop="handleMenuClick"
        >
          <span class="text-center-vertical">&#9776;</span>
        </div>
      </div>
      <div
        v-if="showWindowControls"
        class="right-toolbar"
        :class="[{ 'title-no-drag': titleBarStyle === 'custom' }]"
      >
        <div
          class="frameless-titlebar-button frameless-titlebar-close"
          @click.stop="handleCloseClick"
        >
          <div>
            <svg width="10" height="10">
              <path :d="windowIconClose" />
            </svg>
          </div>
        </div>
        <div
          class="frameless-titlebar-button frameless-titlebar-toggle"
          @click.stop="handleMaximizeClick"
        >
          <div>
            <svg width="10" height="10">
              <path v-show="!isMaximized" :d="windowIconMaximize" />
              <path v-show="isMaximized" :d="windowIconRestore" />
            </svg>
          </div>
        </div>
        <div
          class="frameless-titlebar-button frameless-titlebar-minimize"
          @click.stop="handleMinimizeClick"
        >
          <div>
            <svg width="10" height="10">
              <path :d="windowIconMinimize" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePreferencesStore } from '@/store/preferences.js'
import { useLayoutStore } from '@/store/layout.js'
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { minimizePath, restorePath, maximizePath, closePath } from '../../assets/window-controls.js'
import { PATH_SEPARATOR } from '../../config'
import { isOsx as isOsxPlatform } from '@/util'
import { shouldShowInAppTitleBar } from './visibility'
import { useEditorStore } from '@/store/editor'
import bus from '@/bus'
import { useI18n } from 'vue-i18n'
import { ArrowRight } from '@element-plus/icons-vue'

interface ProjectInfo {
  name?: string
  [key: string]: unknown
}

const props = defineProps<{
  project?: ProjectInfo | null
  filename?: string
  pathname?: string
  active?: boolean
  platform?: string
  isSaved?: boolean
}>()

const preferencesStore = usePreferencesStore()
const layoutStore = useLayoutStore()
const editorStore = useEditorStore()
const { t } = useI18n()

const isOsx = isOsxPlatform
const windowIconMinimize = minimizePath
const windowIconRestore = restorePath
const windowIconMaximize = maximizePath
const windowIconClose = closePath

const isFullScreen = ref(false)
const isMaximized = ref(false)

onMounted(async () => {
  try {
    const [fs, max] = await Promise.all([
      window.electron.windowControl.isFullScreen(),
      window.electron.windowControl.isMaximized()
    ])
    isFullScreen.value = !!fs
    isMaximized.value = !!max
  } catch {}
})

const { titleBarStyle, titleBarShowPath } = storeToRefs(preferencesStore)
const { showTabBar, showSideBar } = storeToRefs(layoutStore)

const toggleSideBar = (): void => {
  const willShow = !showSideBar.value
  bus.emit('view:toggle-layout-entry', 'showSideBar')
  // If the sidebar was previously collapsed down to the 45px icon rail,
  // restore a real panel so the toggle always reveals something useful.
  if (willShow && !layoutStore.rightColumn) {
    layoutStore.SET_LAYOUT({ rightColumn: 'files' })
  }
}

const paths = computed(() => {
  if (!props.pathname) return []
  const pathnameToken = props.pathname.split(PATH_SEPARATOR).filter((i) => i)
  return pathnameToken.slice(0, pathnameToken.length - 1).slice(-3)
})

const showCustomTitleBar = computed(() => {
  return titleBarStyle.value === 'custom' && !isOsx
})

// The custom window controls (close / minimize / maximize) are rendered on the
// right edge for non-macOS platforms with the "custom" title bar style. When
// they are visible we must reserve room for them so the sidebar toggle does not
// overlap the close button.
const showWindowControls = computed(() => {
  return titleBarStyle.value === 'custom' && !isFullScreen.value && !isOsx
})

const showTitleBar = computed(() => {
  return shouldShowInAppTitleBar(titleBarStyle.value, isOsx)
})

watch(
  () => props.filename,
  (value) => {
    // Set filename when hover on dock
    const hasOpenFolder = !!(props.project && props.project.name)
    const projectName = props.project?.name ?? ''
    let title = ''
    if (value) {
      title = hasOpenFolder ? `${value} - ${projectName}` : `${value}`
    } else {
      title = hasOpenFolder ? projectName : ''
    }

    document.title = title
  }
)

const handleCloseClick = () => {
  window.electron.windowControl.close()
}

const handleMaximizeClick = async () => {
  if (isFullScreen.value) {
    window.electron.windowControl.setFullScreen(false)
    return
  }
  if (isMaximized.value) window.electron.windowControl.unmaximize()
  else window.electron.windowControl.maximize()
}

const toggleMaxmizeOnMacOS = () => {
  if (isOsx) {
    handleMaximizeClick()
  }
}

const handleMinimizeClick = () => {
  window.electron.windowControl.minimize()
}

const handleMenuClick = () => {
  window.electron.windowControl.popupApplicationMenu({ x: 23, y: 20 })
}

const rename = (): void => {
  // Clicking the filename in the title bar renames the current document.
  // RESPONSE_FOR_RENAME falls back to a "save as" flow for unsaved files,
  // so this is safe on every platform that renders the in-app title bar.
  if (!editorStore.currentFile) return
  editorStore.RESPONSE_FOR_RENAME()
}

const onMaximize = () => {
  isMaximized.value = true
}
const onUnmaximize = () => {
  isMaximized.value = false
}
const onEnterFullScreen = () => {
  isFullScreen.value = true
}
const onLeaveFullScreen = () => {
  isFullScreen.value = false
}

const offMaximize = window.electron.ipcRenderer.on('mt::window-maximize', onMaximize)
const offUnmaximize = window.electron.ipcRenderer.on('mt::window-unmaximize', onUnmaximize)
const offEnterFullScreen = window.electron.ipcRenderer.on(
  'mt::window-enter-full-screen',
  onEnterFullScreen
)
const offLeaveFullScreen = window.electron.ipcRenderer.on(
  'mt::window-leave-full-screen',
  onLeaveFullScreen
)

onBeforeUnmount(() => {
  offMaximize()
  offUnmaximize()
  offEnterFullScreen()
  offLeaveFullScreen()
})
</script>

<style scoped>
.title-bar-editor-bg {
  height: var(--titleBarHeight);
  background: var(--editorBgColor);
  position: relative;
  left: 0;
  top: 0;
  right: 0;
}
.title-bar {
  -webkit-app-region: drag;
  user-select: none;
  background: transparent;
  height: var(--titleBarHeight);
  box-sizing: border-box;
  color: var(--editorColor50);
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  z-index: 2;
  transition: color 0.4s ease-in-out;
  cursor: default;
}
.active {
  color: var(--editorColor);
}
img {
  height: 90%;
  margin-top: 1px;
  vertical-align: top;
}
.title {
  padding: 0 142px;
  height: 100%;
  line-height: var(--titleBarHeight);
  font-size: 14px;
  text-align: center;
  transition: all 0.25s ease-in-out;
  & .filename {
    transition: all 0.25s ease-in-out;
    /* The filename sits inside the draggable title bar. Mark it as a
       no-drag region so the click-to-rename handler actually fires. */
    -webkit-app-region: no-drag;
    app-region: no-drag;
    cursor: pointer;
  }
  &::after {
    content: '';
    position: absolute;
    top: 0;
    height: 1px;
    width: 100%;
    z-index: 1;
    -webkit-app-region: no-drag;
  }
}
div.title > span {
  /* Workaround for GH#339 */
  display: block;
  direction: rtl;
  overflow: hidden;
  text-overflow: clip;
  white-space: nowrap;
}

.title-bar .title .filename.isOsx:hover {
  color: var(--themeColor);
}

.active .save-dot {
  margin-right: 0.25rem;
  width: 8px;
  height: 8px;
  display: inline-block;
  border-radius: 50%;
  background: var(--highlightThemeColor);
  opacity: 0.7;
  visibility: hidden;
}
.active .save-dot.show {
  visibility: visible;
}
.title:hover {
  color: var(sideBarTitleColor);
}

.left-toolbar {
  padding: 0 10px;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  width: 118px; /* + 2*10px padding*/
  display: flex;
  flex-direction: row;
}
.right-toolbar {
  height: 100%;
  position: absolute;
  top: 0;
  right: 0;
  width: 138px;
  display: flex;
  align-items: center;
  flex-direction: row-reverse;
  & .item {
    margin-right: 10px;
  }
}

.title-no-drag {
  -webkit-app-region: no-drag;
}
/* frameless window controls */
.frameless-titlebar-button {
  position: relative;
  display: block;
  width: 46px;
  height: var(--titleBarHeight);
}
.frameless-titlebar-button > div {
  position: absolute;
  display: inline-flex;
  top: 50%;
  left: 50%;
  transform: translateX(-50%) translateY(-50%);
}
.frameless-titlebar-menu {
  color: var(--sideBarColor);
}
.frameless-titlebar-close:hover {
  background-color: rgb(228, 79, 79);
}
.frameless-titlebar-minimize:hover,
.frameless-titlebar-toggle:hover {
  background-color: rgba(0, 0, 0, 0.1);
}
.frameless-titlebar-button svg {
  fill: #000000;
}
.frameless-titlebar-close:hover svg {
  fill: #ffffff;
}

.text-center-vertical {
  display: inline-block;
  vertical-align: middle;
  line-height: normal;
}

/* ---- Sidebar toggle button ---- */
.title-bar-toggle {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  height: var(--titleBarHeight);
  padding-right: 10px;
  -webkit-app-region: no-drag;
  /* Hidden by default; revealed when the pointer enters the title bar. */
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease-in-out;
}
/* Reveal on hovering the title bar, and keep it reachable while focused. */
.title-bar:hover .title-bar-toggle,
.title-bar-toggle:focus-within {
  opacity: 1;
  pointer-events: auto;
}
/* Windows/Linux custom title bar: the window controls (close / minimize /
   maximize) occupy the right-most 138px (3 x 46px). Park the sidebar toggle
   just to their left, and reserve matching right padding on the centred title
   so the toggle never collides with the close button. */
.title-bar.with-window-controls .title {
  padding-right: 178px;
}
.title-bar.with-window-controls .title-bar-toggle {
  right: 138px;
}
.tb-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--editorColor50);
  cursor: pointer;
  -webkit-app-region: no-drag;
  transition:
    color 0.15s ease,
    background-color 0.15s ease;
}
.tb-btn:hover {
  color: var(--editorColor);
  background: var(--sideBarBgColor);
}
.tb-btn.collapsed {
  color: var(--editorColor30);
}
.tb-svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* ---- Shared hover tooltip (data-tooltip) ---- */
.tb-btn[data-tooltip]::after {
  content: attr(data-tooltip);
  position: absolute;
  top: calc(100% + 6px);
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
.tb-btn[data-tooltip]:hover::after {
  opacity: 1;
  transform: translate(-50%, 0);
}

/* The sidebar toggle sits at the top-right, so anchor its tooltip to the
   right edge to keep it inside the window. */
.title-bar-toggle .tb-btn[data-tooltip]::after {
  left: auto;
  right: 0;
  transform: translate(0, -3px);
}
.title-bar-toggle .tb-btn[data-tooltip]:hover::after {
  transform: translate(0, 0);
}
</style>
