<script setup>
import { computed, inject, nextTick, ref, watch } from 'vue'
import JobTags from './JobTags.vue'
import JobHistory from './JobHistory.vue'
import { STATUS, isBlank } from '../composables/useJobs.js'
import { formatDateTime, formatTime } from '../format.js'

const props = defineProps({
  job: { type: Object, required: true },
})

const { startWork, addNote, completeJob } = inject('jobs')

const heading = ref(null)
const noteInput = ref(null)
const completionInput = ref(null)
const outcome = ref(null)

// drafts are local to this panel. App remounts it per job (via :key)
// so text typed on one job never leaks into another
const note = ref('')
const noteError = ref('')
const completionNote = ref('')
const completionError = ref('')
const savedMessage = ref('')

const latestNote = computed(() => props.job.history.findLast((entry) => entry.type === 'note'))

watch(note, (value) => {
  if (!isBlank(value)) noteError.value = ''
})
watch(completionNote, (value) => {
  if (!isBlank(value)) completionError.value = ''
})

async function start() {
  const entry = startWork(props.job.id)
  if (!entry) return

  savedMessage.value = `Work started at ${formatTime(entry.at)}. Status is now In Progress.`
  // the start button is gone now, so put focus somewhere useful
  await nextTick()
  noteInput.value.focus()
}

function saveNote() {
  savedMessage.value = ''

  if (isBlank(note.value)) {
    noteError.value = "Write a note before saving. It can't be blank or only spaces."
    noteInput.value.focus()
    return
  }

  const entry = addNote(props.job.id, note.value)
  note.value = ''
  savedMessage.value = `Progress note saved at ${formatTime(entry.at)}. It's shown as the latest note and added to the history.`
}

async function complete() {
  savedMessage.value = ''

  if (isBlank(completionNote.value)) {
    completionError.value =
      "Add a completion note saying what was done. It can't be blank or only spaces. The job stays In Progress until then."
    completionInput.value.focus()
    return
  }

  completeJob(props.job.id, completionNote.value)
  await nextTick()
  outcome.value.focus()
}

defineExpose({
  focusHeading: () => heading.value.focus(),
})
</script>

<template>
  <article class="card detail" aria-labelledby="detail-heading">
    <header class="detail-head">
      <h2 id="detail-heading" ref="heading" tabindex="-1">Job {{ job.id }}</h2>
      <JobTags :job="job" />
    </header>

    <p class="description typed-text">{{ job.description }}</p>

    <dl class="facts">
      <div>
        <dt>House</dt>
        <dd>{{ job.house }}</dd>
      </div>
      <div>
        <dt>Reported by</dt>
        <dd>{{ job.reporter }}</dd>
      </div>
      <div>
        <dt>Reported on</dt>
        <dd><time :datetime="job.createdAt">{{ formatDateTime(job.createdAt) }}</time></dd>
      </div>
      <div>
        <dt>Priority</dt>
        <dd :class="{ urgent: job.priority === 'Urgent' }">{{ job.priority }}</dd>
      </div>
    </dl>

    <section
      v-if="job.status === STATUS.COMPLETED"
      ref="outcome"
      class="outcome"
      tabindex="-1"
      aria-labelledby="outcome-heading"
    >
      <h3 id="outcome-heading">Completed</h3>
      <p class="outcome-when">
        Marked completed on <time :datetime="job.completedAt">{{ formatDateTime(job.completedAt) }}</time>
      </p>
      <p class="outcome-label">Completion note</p>
      <p class="outcome-note typed-text">{{ job.completionNote }}</p>
    </section>

    <section v-else class="update" aria-labelledby="update-heading">
      <div>
        <h3 id="update-heading">Update this job</h3>
        <div role="status">
          <p v-if="savedMessage" class="success saved">{{ savedMessage }}</p>
        </div>
      </div>

      <div v-if="job.status === STATUS.NEW" class="start">
        <p>
          Not started yet. Start work to move it to In Progress, then you can save
          progress notes and complete it.
        </p>
        <button type="button" class="btn btn-primary" @click="start">Start work</button>
      </div>

      <template v-else>
        <div v-if="latestNote" class="latest-note">
          <p class="latest-note-label">
            Latest note · <time :datetime="latestNote.at">{{ formatDateTime(latestNote.at) }}</time>
          </p>
          <p class="typed-text">{{ latestNote.note }}</p>
        </div>

        <form class="note-form" novalidate @submit.prevent="saveNote">
          <div class="field">
            <label class="field-label" for="progress-note">Progress note</label>
            <p id="progress-note-hint" class="field-hint">What's been done so far, or what happens next.</p>
            <textarea
              id="progress-note"
              ref="noteInput"
              v-model="note"
              class="input"
              rows="3"
              :aria-invalid="Boolean(noteError)"
              :aria-describedby="noteError ? 'progress-note-error progress-note-hint' : 'progress-note-hint'"
            ></textarea>
            <p v-if="noteError" id="progress-note-error" class="field-error">{{ noteError }}</p>
          </div>
          <button type="submit" class="btn">Save note</button>
        </form>

        <form class="complete-form" novalidate @submit.prevent="complete">
          <div class="field">
            <label class="field-label" for="completion-note">Completion note</label>
            <p id="completion-note-hint" class="field-hint">Required. Say what was done to fix it.</p>
            <textarea
              id="completion-note"
              ref="completionInput"
              v-model="completionNote"
              class="input"
              rows="3"
              :aria-invalid="Boolean(completionError)"
              :aria-describedby="completionError
                ? 'completion-note-error completion-note-hint'
                : 'completion-note-hint'"
            ></textarea>
            <p v-if="completionError" id="completion-note-error" class="field-error">
              {{ completionError }}
            </p>
          </div>
          <button type="submit" class="btn btn-primary">Complete job</button>
        </form>
      </template>
    </section>

    <JobHistory :history="job.history" />
  </article>
</template>

<style scoped>
.detail {
  display: grid;
  gap: 20px;
  padding: 24px;
}

.detail-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
}

.detail-head h2 {
  font-size: 1.4rem;
  font-variant-numeric: tabular-nums;
}

.description {
  font-size: 18px;
}

.facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px 20px;
  margin: 0;
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface-sunk);
}

.facts dt {
  color: var(--muted);
  font-size: 14px;
}

.facts dd {
  margin: 0;
  font-weight: 600;
}

.facts dd.urgent {
  color: var(--red);
}

.outcome {
  padding: 16px 18px;
  border: 1px solid #b9d6c3;
  border-left: 4px solid var(--green);
  border-radius: 8px;
  background: var(--green-tint);
}

.outcome h3 {
  color: var(--green-dark);
  font-size: 1.1rem;
}

.outcome-when {
  margin-top: 2px;
  color: var(--green-dark);
  font-size: 14px;
}

.outcome-label {
  margin-top: 12px;
  font-weight: 600;
}

.update {
  display: grid;
  gap: 16px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}

.saved {
  margin-top: 10px;
}

.start {
  display: grid;
  justify-items: start;
  gap: 12px;
}

.latest-note {
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-left: 4px solid var(--amber);
  border-radius: 8px;
  background: var(--surface-sunk);
}

.latest-note-label {
  margin-bottom: 2px;
  color: var(--muted);
  font-size: 14px;
  font-weight: 600;
}

.note-form .field,
.complete-form .field {
  margin-bottom: 10px;
}

.complete-form {
  padding-top: 16px;
  border-top: 1px dashed var(--border);
}

.history {
  padding-top: 20px;
  border-top: 1px solid var(--border);
}
</style>
