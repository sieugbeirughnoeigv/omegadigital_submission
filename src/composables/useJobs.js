import { ref } from 'vue'

export const HOUSE_NAME = 'Meadow House'
export const STORAGE_KEY = 'meadow-house-repairs'

export const STATUS = {
  NEW: 'New',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
}

export function isBlank(text) {
  return !text || text.trim() === ''
}

function timestamp() {
  return new Date().toISOString()
}

function loadJobs(storage) {
  try {
    const saved = JSON.parse(storage.getItem(STORAGE_KEY))
    if (!Array.isArray(saved)) return []
    // drop anything that doesn't look like one of our jobs
    return saved.filter((job) => job && typeof job.id === 'string' && Array.isArray(job.history))
  } catch {
    // bad json or storage blocked, start with an empty list instead of crashing
    return []
  }
}

// ids go MH-0001, MH-0002... jobs are never deleted so highest + 1 is always free
function nextId(jobs) {
  const highest = jobs.reduce((max, job) => {
    const number = parseInt(job.id.replace('MH-', ''), 10)
    return Number.isNaN(number) ? max : Math.max(max, number)
  }, 0)
  return 'MH-' + String(highest + 1).padStart(4, '0')
}

// all job state lives here. each call reads from storage again,
// which is what a page refresh does too
export function useJobs(storage = window.localStorage) {
  const jobs = ref(loadJobs(storage))

  function save() {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(jobs.value))
    } catch {
      // storage full or disabled, nothing useful we can do here
    }
  }

  function findJob(id) {
    return jobs.value.find((job) => job.id === id)
  }

  function createJob({ description, reporter, priority }) {
    const now = timestamp()
    const job = {
      id: nextId(jobs.value),
      house: HOUSE_NAME,
      description: description.trim(),
      reporter: reporter.trim(),
      priority: priority === 'Urgent' ? 'Urgent' : 'Normal',
      status: STATUS.NEW,
      createdAt: now,
      completionNote: '',
      completedAt: null,
      history: [{ type: 'created', at: now }],
    }

    jobs.value.push(job)
    save()
    return findJob(job.id)
  }

  function startWork(id) {
    const job = findJob(id)
    if (!job || job.status !== STATUS.NEW) return null

    const entry = { type: 'started', at: timestamp() }
    job.status = STATUS.IN_PROGRESS
    job.history.push(entry)
    save()
    return entry
  }

  function addNote(id, text) {
    const job = findJob(id)
    if (!job || job.status === STATUS.COMPLETED || isBlank(text)) return null

    const entry = { type: 'note', at: timestamp(), note: text.trim() }
    job.history.push(entry)
    save()
    return entry
  }

  function completeJob(id, note) {
    const job = findJob(id)
    if (!job || job.status === STATUS.COMPLETED || isBlank(note)) return null

    const entry = { type: 'completed', at: timestamp(), note: note.trim() }
    job.status = STATUS.COMPLETED
    job.completionNote = entry.note
    job.completedAt = entry.at
    job.history.push(entry)
    save()
    return entry
  }

  return { jobs, createJob, startWork, addNote, completeJob }
}
