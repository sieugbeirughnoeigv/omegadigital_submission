import { beforeEach, describe, expect, it } from 'vitest'
import { STATUS, STORAGE_KEY, isBlank, useJobs } from '../src/composables/useJobs.js'

const fence = { description: '  Garden fence damaged ', reporter: ' Alex Morgan', priority: 'Urgent' }

beforeEach(() => localStorage.clear())

describe('isBlank', () => {
  it('treats empty, spaces, tabs and newlines as blank', () => {
    for (const value of ['', ' ', '   ', '\t', '\n \n', undefined, null]) {
      expect(isBlank(value)).toBe(true)
    }
    expect(isBlank(' a ')).toBe(false)
  })
})

describe('useJobs', () => {
  it('trims text and fills in the fixed fields', () => {
    const { createJob } = useJobs()
    const job = createJob(fence)

    expect(job).toMatchObject({
      id: 'MH-0001',
      house: 'Meadow House',
      description: 'Garden fence damaged',
      reporter: 'Alex Morgan',
      priority: 'Urgent',
      status: STATUS.NEW,
    })
    expect(job.history).toEqual([{ type: 'created', at: job.createdAt }])
  })

  it('falls back to Normal for an unknown priority', () => {
    const { createJob } = useJobs()
    expect(createJob({ ...fence, priority: 'whatever' }).priority).toBe('Normal')
  })

  it('refuses blank notes and blank completions', () => {
    const { createJob, startWork, addNote, completeJob } = useJobs()
    const job = createJob(fence)
    startWork(job.id)

    expect(addNote(job.id, '   ')).toBeNull()
    expect(completeJob(job.id, '')).toBeNull()
    expect(job.status).toBe(STATUS.IN_PROGRESS)
    expect(job.history).toHaveLength(2)
  })

  it('does not allow changes after completion', () => {
    const { createJob, startWork, addNote, completeJob } = useJobs()
    const job = createJob(fence)
    startWork(job.id)
    completeJob(job.id, 'Fence repaired and checked')

    expect(addNote(job.id, 'one more thing')).toBeNull()
    expect(completeJob(job.id, 'again')).toBeNull()
    expect(startWork(job.id)).toBeNull()
    expect(job.completionNote).toBe('Fence repaired and checked')
    expect(job.history).toHaveLength(3)
  })

  it('saves after every change and loads it back', () => {
    const first = useJobs()
    const job = first.createJob(fence)
    first.startWork(job.id)
    first.addNote(job.id, 'Temporary barrier fitted')

    const second = useJobs()
    expect(second.jobs.value).toEqual(first.jobs.value)
  })

  it('carries on from the highest id', () => {
    const first = useJobs()
    first.createJob(fence)
    first.createJob(fence)

    const second = useJobs()
    expect(second.createJob(fence).id).toBe('MH-0003')
  })

  it('starts empty if storage holds junk', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    expect(useJobs().jobs.value).toEqual([])

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ hello: 'there' }))
    expect(useJobs().jobs.value).toEqual([])

    localStorage.setItem(STORAGE_KEY, JSON.stringify([null, { id: 5 }, 'x']))
    expect(useJobs().jobs.value).toEqual([])
  })

  it('still works when storage throws', () => {
    const broken = {
      getItem() {
        throw new Error('blocked')
      },
      setItem() {
        throw new Error('blocked')
      },
    }
    const { createJob, jobs } = useJobs(broken)
    createJob(fence)
    expect(jobs.value).toHaveLength(1)
  })
})
