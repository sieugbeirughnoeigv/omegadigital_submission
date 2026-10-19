<script setup>
import { computed, nextTick, provide, ref } from 'vue'
import ReportForm from './components/ReportForm.vue'
import JobList from './components/JobList.vue'
import JobDetail from './components/JobDetail.vue'
import ThemeToggle from './components/ThemeToggle.vue'
import { STATUS, useJobs } from './composables/useJobs.js'

const store = useJobs()
provide('jobs', store)

const { jobs } = store

// newest report at the top
const sortedJobs = computed(() => [...jobs.value].reverse())

const selectedId = ref(sortedJobs.value[0]?.id ?? null)
const selectedJob = computed(() => jobs.value.find((job) => job.id === selectedId.value) ?? null)

const openCount = computed(() => jobs.value.filter((job) => job.status !== STATUS.COMPLETED).length)
const completedCount = computed(() => jobs.value.length - openCount.value)

const detail = ref(null)

function showCreated(job) {
  // keep focus in the form so another report can go straight in
  selectedId.value = job.id
}

async function openJob(id) {
  selectedId.value = id
  // on a phone the detail is below the list, focusing it scrolls it into view
  await nextTick()
  detail.value?.focusHeading()
}
</script>

<template>
  <header class="site-header">
    <div class="site-header-inner">
      <div class="brand">
        <svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="7" />
          <path d="M8 15.5 16 9l8 6.5V24h-5.5v-5h-5v5H8z" />
        </svg>
        <div>
          <h1>Meadow House Repairs</h1>
          <p class="tagline">Report repairs, follow their progress and see what was done.</p>
        </div>
      </div>
      <div class="header-side">
        <p class="totals">
          <span><strong>{{ openCount }}</strong> open</span>
          <span><strong>{{ completedCount }}</strong> completed</span>
        </p>
        <ThemeToggle />
      </div>
    </div>
  </header>

  <main class="layout">
    <ReportForm class="area-form" @created="showCreated" @view="openJob" />

    <JobList class="area-list" :jobs="sortedJobs" :selected-id="selectedId" @select="openJob" />

    <div class="area-detail">
      <JobDetail v-if="selectedJob" :key="selectedJob.id" ref="detail" :job="selectedJob" />

      <section v-else class="card no-selection" aria-labelledby="no-selection-heading">
        <h2 id="no-selection-heading">No job selected</h2>
        <p v-if="jobs.length === 0">
          Nothing has been reported yet. Use the form to report the first repair and it will open here.
        </p>
        <p v-else>Choose a job from the list to see its details and update it.</p>
      </section>
    </div>
  </main>
</template>

<style scoped>
.site-header {
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

.site-header-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 24px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px 24px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand-mark {
  flex: none;
  width: 40px;
  height: 40px;
}

/* the logo keeps its colours in both themes */
.brand-mark rect {
  fill: #2f6b4f;
}

.brand-mark path {
  fill: #fff;
}

h1 {
  font-size: 1.35rem;
}

.tagline {
  color: var(--muted);
  font-size: 14px;
}

.header-side {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 24px;
}

.totals {
  display: flex;
  gap: 16px;
  color: var(--muted);
  font-size: 15px;
}

.totals strong {
  color: var(--text);
  font-variant-numeric: tabular-nums;
}

/* phone first: form, then list, then the selected job */
.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas:
    'form'
    'list'
    'detail';
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px 16px 48px;
}

.area-form {
  grid-area: form;
}

.area-list {
  grid-area: list;
}

.area-detail {
  grid-area: detail;
  min-width: 0;
}

.no-selection {
  display: grid;
  gap: 6px;
  color: var(--muted);
}

.no-selection h2 {
  color: var(--text);
}

/* tablet and small laptops: form and list stacked on the left */
@media (min-width: 800px) {
  .layout {
    grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);
    grid-template-rows: auto 1fr;
    grid-template-areas:
      'form detail'
      'list detail';
    align-items: start;
    padding: 24px 24px 48px;
  }
}

/* wide screens: everything side by side */
@media (min-width: 1240px) {
  .layout {
    grid-template-columns: 320px 340px minmax(0, 1fr);
    grid-template-rows: auto;
    grid-template-areas: 'form list detail';
  }
}
</style>
