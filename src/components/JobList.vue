<script setup>
import JobTags from './JobTags.vue'
import { formatDateTime } from '../format.js'

defineProps({
  jobs: { type: Array, required: true },
  selectedId: { type: String, default: null },
})

defineEmits(['select'])
</script>

<template>
  <section class="card jobs" aria-labelledby="jobs-heading">
    <div class="card-head">
      <h2 id="jobs-heading">Jobs</h2>
      <span class="count">{{ jobs.length }} {{ jobs.length === 1 ? 'job' : 'jobs' }}</span>
    </div>

    <p v-if="jobs.length === 0" class="empty">
      No repairs reported yet. New reports will show up here.
    </p>

    <ul v-else class="job-list">
      <li v-for="job in jobs" :key="job.id">
        <button
          type="button"
          class="job-item"
          :class="{ selected: job.id === selectedId }"
          :aria-current="job.id === selectedId ? 'true' : undefined"
          :data-job-id="job.id"
          @click="$emit('select', job.id)"
        >
          <span class="job-item-top">
            <span class="job-id">{{ job.id }}</span>
            <JobTags :job="job" />
          </span>
          <span class="job-description">{{ job.description }}</span>
          <span class="job-meta">
            {{ job.reporter }} · {{ formatDateTime(job.createdAt) }}
          </span>
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.count {
  color: var(--muted);
  font-size: 14px;
}

.empty {
  color: var(--muted);
}

.job-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.job-item {
  display: grid;
  gap: 4px;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-left: 4px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  text-align: left;
  cursor: pointer;
}

.job-item:hover {
  border-color: var(--border-input);
  background: var(--surface-sunk);
}

.job-item.selected {
  border-color: var(--green);
  border-left-color: var(--green);
  background: var(--green-tint);
}

.job-item-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px 10px;
}

.job-id {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.job-description {
  white-space: pre-wrap;
}

.job-meta {
  color: var(--muted);
  font-size: 14px;
}
</style>
