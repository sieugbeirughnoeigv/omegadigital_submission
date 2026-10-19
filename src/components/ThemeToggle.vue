<script setup>
import { ref } from 'vue'

const STORAGE_KEY = 'meadow-house-theme'

// index.html has already picked a theme, start from that
const theme = ref(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')

function choose(value) {
  theme.value = value
  document.documentElement.dataset.theme = value
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // storage blocked, it just won't be remembered next time
  }
}
</script>

<template>
  <div class="theme" role="group" aria-labelledby="theme-label">
    <span id="theme-label" class="theme-label">Theme</span>
    <span class="theme-options">
      <button
        type="button"
        class="theme-option"
        :aria-pressed="theme === 'light'"
        @click="choose('light')"
      >
        Light
      </button>
      <button
        type="button"
        class="theme-option"
        :aria-pressed="theme === 'dark'"
        @click="choose('dark')"
      >
        Dark
      </button>
    </span>
  </div>
</template>

<style scoped>
.theme {
  display: flex;
  align-items: center;
  gap: 10px;
}

.theme-label {
  color: var(--muted);
  font-size: 14px;
}

.theme-options {
  display: inline-flex;
  padding: 3px;
  border: 1px solid var(--border-input);
  border-radius: 8px;
  background: var(--surface);
}

.theme-option {
  min-width: 60px;
  min-height: 34px;
  padding: 4px 12px;
  border: 0;
  border-radius: 5px;
  background: none;
  color: var(--text);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.theme-option:hover {
  background: var(--green-tint);
}

.theme-option[aria-pressed='true'] {
  background: var(--green);
  color: var(--on-green);
}
</style>
