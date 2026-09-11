<template>
  <el-tooltip v-if="wordCount" :placement="tooltipPlacement" :show-after="200" effect="dark">
    <template #content>
      <div class="wc-tooltip-item">
        <span class="wc-tooltip-front">{{ t('menu.counter.words') }}:</span>
        <span class="wc-tooltip-text">{{ wordCount.word }}</span>
      </div>
      <div class="wc-tooltip-item">
        <span class="wc-tooltip-front">{{ t('menu.counter.characters') }}:</span>
        <span class="wc-tooltip-text">{{ wordCount.character }}</span>
      </div>
      <div class="wc-tooltip-item">
        <span class="wc-tooltip-front">{{ t('menu.counter.paragraphs') }}:</span>
        <span class="wc-tooltip-text">{{ wordCount.paragraph }}</span>
      </div>
    </template>
    <div
      v-show="showWordCount"
      class="word-count-float"
      :class="position === 'top-right' ? 'is-top-right' : 'is-bottom-right'"
      @click.stop="cycle"
    >
      {{ displayText }}
    </div>
  </el-tooltip>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useEditorStore } from '@/store/editor'
import { usePreferencesStore } from '@/store/preferences'

const METRICS = ['word', 'character', 'paragraph', 'all'] as const
type Metric = (typeof METRICS)[number]

const { t } = useI18n()
const editorStore = useEditorStore()
const preferencesStore = usePreferencesStore()

const { currentFile } = storeToRefs(editorStore)
const { showWordCount, wordCountPosition } = storeToRefs(preferencesStore)

const metric = ref<Metric>('word')

const wordCount = computed(() => currentFile.value?.wordCount)
const position = computed(() =>
  wordCountPosition.value === 'top-right' ? 'top-right' : 'bottom-right'
)
const tooltipPlacement = computed(() => (position.value === 'top-right' ? 'bottom-end' : 'top-end'))

const shortLabels = computed<Record<Metric, string>>(() => ({
  word: t('wordCount.short.word'),
  character: t('wordCount.short.character'),
  paragraph: t('wordCount.short.paragraph'),
  all: t('wordCount.short.all')
}))

const displayText = computed(() => {
  const wc = wordCount.value
  if (!wc) return ''
  return `${wc[metric.value]} ${shortLabels.value[metric.value]}`
})

const cycle = () => {
  const index = METRICS.indexOf(metric.value)
  metric.value = METRICS[(index + 1) % METRICS.length]!
}
</script>

<style scoped>
.word-count-float {
  position: absolute;
  right: 18px;
  z-index: 3;
  padding: 2px 10px;
  font-size: 12px;
  line-height: 18px;
  border-radius: 10px;
  color: var(--editorColor30);
  background: transparent;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  -webkit-app-region: no-drag;
  transition:
    color 0.2s ease,
    background 0.2s ease;
}

.word-count-float.is-top-right {
  top: 8px;
}

.word-count-float.is-bottom-right {
  bottom: 14px;
}

.word-count-float:hover {
  color: var(--sideBarTitleColor);
  background: var(--sideBarBgColor);
}
</style>

<style>
.wc-tooltip-item {
  height: 24px;
  line-height: 24px;
}
.wc-tooltip-item .wc-tooltip-front {
  opacity: 0.7;
}
.wc-tooltip-item .wc-tooltip-text {
  margin-left: 10px;
}
</style>
