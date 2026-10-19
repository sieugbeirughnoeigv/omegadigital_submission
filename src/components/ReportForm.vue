<script setup>
import { inject, ref, watch } from 'vue'
import { isBlank } from '../composables/useJobs.js'

const emit = defineEmits(['created'])
const { createJob } = inject('jobs')

const description = ref('')
const reporter = ref('')
const priority = ref('Normal')

const errors = ref({ description: '', reporter: '' })
const created = ref(null)

const descriptionInput = ref(null)
const reporterInput = ref(null)

// once a field has real text in it, drop its error
watch(description, (value) => {
  if (!isBlank(value)) errors.value.description = ''
})
watch(reporter, (value) => {
  if (!isBlank(value)) errors.value.reporter = ''
})

function validate() {
  errors.value.description = isBlank(description.value)
    ? "Enter a description of the repair. It can't be blank or only spaces."
    : ''
  errors.value.reporter = isBlank(reporter.value)
    ? "Enter the name of the person reporting it. It can't be blank or only spaces."
    : ''

  return !errors.value.description && !errors.value.reporter
}

function submit() {
  created.value = null

  if (!validate()) {
    // the other field keeps whatever was typed, only move focus to the first problem
    const firstBad = errors.value.description ? descriptionInput : reporterInput
    firstBad.value.focus()
    return
  }

  const job = createJob({
    description: description.value,
    reporter: reporter.value,
    priority: priority.value,
  })

  created.value = job
  description.value = ''
  reporter.value = ''
  priority.value = 'Normal'
  emit('created', job)
}
</script>

<template>
  <section class="card report" aria-labelledby="report-heading">
    <div class="card-head">
      <h2 id="report-heading">Report a repair</h2>
    </div>

    <form class="report-form" novalidate @submit.prevent="submit">
      <div class="field">
        <label class="field-label" for="report-description">Description</label>
        <p id="report-description-hint" class="field-hint">What's wrong and where it is.</p>
        <textarea
          id="report-description"
          ref="descriptionInput"
          v-model="description"
          class="input"
          rows="3"
          :aria-invalid="Boolean(errors.description)"
          :aria-describedby="errors.description
            ? 'report-description-error report-description-hint'
            : 'report-description-hint'"
        ></textarea>
        <p v-if="errors.description" id="report-description-error" class="field-error">
          {{ errors.description }}
        </p>
      </div>

      <div class="field">
        <label class="field-label" for="report-reporter">Reporter name</label>
        <input
          id="report-reporter"
          ref="reporterInput"
          v-model="reporter"
          class="input"
          type="text"
          autocomplete="name"
          :aria-invalid="Boolean(errors.reporter)"
          :aria-describedby="errors.reporter ? 'report-reporter-error' : undefined"
        />
        <p v-if="errors.reporter" id="report-reporter-error" class="field-error">
          {{ errors.reporter }}
        </p>
      </div>

      <fieldset class="field">
        <legend class="field-label">Priority</legend>
        <p id="report-priority-hint" class="field-hint">
          Urgent is for anything unsafe or that stops the house running normally.
        </p>
        <div class="priority-options">
          <label class="priority-option">
            <input
              v-model="priority"
              type="radio"
              name="priority"
              value="Normal"
              aria-describedby="report-priority-hint"
            />
            <span>Normal</span>
          </label>
          <label class="priority-option priority-option-urgent">
            <input
              v-model="priority"
              type="radio"
              name="priority"
              value="Urgent"
              aria-describedby="report-priority-hint"
            />
            <span>Urgent</span>
          </label>
        </div>
      </fieldset>

      <button type="submit" class="btn btn-primary submit">Report repair</button>

      <div class="report-status" role="status">
        <p v-if="created" class="success">
          <strong>Job {{ created.id }} created.</strong>
          It's at the top of the job list with status New and {{ created.priority }} priority.
        </p>
      </div>
    </form>
  </section>
</template>

<style scoped>
.priority-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.priority-option {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid var(--border-input);
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.priority-option input {
  width: 18px;
  height: 18px;
  margin: 0;
  accent-color: var(--green);
}

/* ring the whole option, the radio on its own is a small target to spot */
.priority-option input:focus-visible {
  outline: none;
}

.priority-option:has(input:focus-visible) {
  outline: 3px solid var(--focus);
  outline-offset: 2px;
}

.priority-option:has(input:checked) {
  border-color: var(--green);
  background: var(--green-tint);
  box-shadow: inset 0 0 0 1px var(--green);
}

.priority-option-urgent input {
  accent-color: var(--red);
}

.priority-option-urgent:has(input:checked) {
  border-color: var(--red);
  background: var(--red-tint);
  box-shadow: inset 0 0 0 1px var(--red);
  color: var(--red);
}

.submit {
  width: 100%;
}

.report-status .success {
  margin-top: 14px;
}
</style>
