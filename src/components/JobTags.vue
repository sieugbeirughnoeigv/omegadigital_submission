<script setup>
defineProps({
  job: { type: Object, required: true },
})

const statusClass = {
  New: 'tag-new',
  'In Progress': 'tag-progress',
  Completed: 'tag-done',
}
</script>

<template>
  <span class="tags">
    <span class="tag" :class="statusClass[job.status]">
      <span class="sr-only">Status: </span>{{ job.status }}
    </span>
    <span class="tag" :class="job.priority === 'Urgent' ? 'tag-urgent' : 'tag-normal'">
      <span class="sr-only">Priority: </span>{{ job.priority }}
    </span>
  </span>
</template>
