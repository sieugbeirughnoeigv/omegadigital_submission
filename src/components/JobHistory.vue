<script setup>
import { formatDateTime } from '../format.js'

defineProps({
  history: { type: Array, required: true },
})

const labels = {
  created: 'Reported, status New',
  started: 'Status changed to In Progress',
  note: 'Progress note',
  completed: 'Status changed to Completed',
}
</script>

<template>
  <section class="history" aria-labelledby="history-heading">
    <h3 id="history-heading">History</h3>
    <p class="history-hint">Oldest first. Entries are never removed.</p>

    <ol class="timeline">
      <li v-for="(entry, index) in history" :key="index" class="timeline-entry" :class="entry.type">
        <time class="timeline-time" :datetime="entry.at">{{ formatDateTime(entry.at) }}</time>
        <p class="timeline-label">{{ labels[entry.type] }}</p>
        <p v-if="entry.note" class="timeline-note typed-text">{{ entry.note }}</p>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.history-hint {
  margin: 2px 0 14px;
  color: var(--muted);
  font-size: 14px;
}

.timeline {
  margin: 0;
  padding: 0;
  list-style: none;
}

.timeline-entry {
  position: relative;
  padding: 0 0 18px 24px;
}

/* the line down the left, stops at the last entry */
.timeline-entry::before {
  content: '';
  position: absolute;
  top: 17px;
  bottom: -5px;
  left: 5px;
  width: 2px;
  background: var(--border);
}

.timeline-entry:last-child {
  padding-bottom: 0;
}

.timeline-entry:last-child::before {
  display: none;
}

/* the dot */
.timeline-entry::after {
  content: '';
  position: absolute;
  top: 5px;
  left: 0;
  width: 12px;
  height: 12px;
  border: 2px solid var(--slate);
  border-radius: 50%;
  background: var(--surface);
}

.timeline-entry.started::after {
  border-color: var(--amber);
}

.timeline-entry.note::after {
  border-color: var(--muted);
  background: var(--muted);
  transform: scale(0.67);
}

.timeline-entry.completed::after {
  border-color: var(--green);
  background: var(--green);
}

.timeline-time {
  display: block;
  color: var(--muted);
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}

.timeline-label {
  font-weight: 600;
}

.timeline-note {
  margin-top: 4px;
  padding: 8px 12px;
  border-radius: 6px;
  background: var(--surface-sunk);
  border: 1px solid var(--border);
}
</style>
