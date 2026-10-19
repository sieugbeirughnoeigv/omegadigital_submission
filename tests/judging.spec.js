// the ten functional tests from the brief, done the way a judge would do them
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../src/App.vue'
import { STORAGE_KEY } from '../src/composables/useJobs.js'

let app

function mountApp() {
  app = mount(App, { attachTo: document.body })
  return app
}

// unmount and mount again, reading from local storage like a page refresh
function refresh() {
  app.unmount()
  return mountApp()
}

async function report({ description, reporter, priority = 'Normal' }) {
  await app.get('#report-description').setValue(description)
  await app.get('#report-reporter').setValue(reporter)
  await app.get(`input[name="priority"][value="${priority}"]`).setValue(true)
  await app.get('form.report-form').trigger('submit')
  await flushPromises()
}

async function openJob(id) {
  await app.get(`[data-job-id="${id}"]`).trigger('click')
  await flushPromises()
}

async function startWork() {
  await findButton('Start work').trigger('click')
  await flushPromises()
}

async function saveNote(text) {
  await app.get('#progress-note').setValue(text)
  await app.get('form.note-form').trigger('submit')
  await flushPromises()
}

async function complete(text) {
  await app.get('#completion-note').setValue(text)
  await app.get('form.complete-form').trigger('submit')
  await flushPromises()
}

function findButton(label) {
  const button = app.findAll('button').find((b) => b.text() === label)
  if (!button) throw new Error(`no button called "${label}"`)
  return button
}

function savedJobs() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
}

function detail() {
  return app.get('.detail')
}

function detailFact(name) {
  const row = detail()
    .findAll('.facts > div')
    .find((r) => r.get('dt').text() === name)
  return row.get('dd').text()
}

function historyLabels() {
  return detail()
    .findAll('.timeline-entry')
    .map((entry) => entry.get('.timeline-label').text())
}

beforeEach(() => {
  localStorage.clear()
  mountApp()
})

afterEach(() => {
  app.unmount()
})

describe('1. valid repair report', () => {
  it('creates a distinct New job with id, date, house, description, reporter and Urgent', async () => {
    await report({ description: 'Garden fence damaged', reporter: 'Alex Morgan', priority: 'Urgent' })

    expect(app.findAll('.job-item')).toHaveLength(1)
    expect(app.get('.report-status').text()).toContain('Job MH-0001 created.')

    expect(detail().get('h2').text()).toBe('Job MH-0001')
    expect(detail().get('.tags').text()).toContain('New')
    expect(detail().get('.tags').text()).toContain('Urgent')
    expect(detail().get('.description').text()).toBe('Garden fence damaged')
    expect(detailFact('House')).toBe('Meadow House')
    expect(detailFact('Reported by')).toBe('Alex Morgan')
    expect(detailFact('Priority')).toBe('Urgent')

    const reported = detail().get('.facts time')
    expect(Number.isNaN(Date.parse(reported.attributes('datetime')))).toBe(false)
    expect(reported.text()).toMatch(/^\d{1,2} \w{3} \d{4}, \d{2}:\d{2}$/)
  })

  it('clears the form ready for the next report', async () => {
    await report({ description: 'Garden fence damaged', reporter: 'Alex Morgan', priority: 'Urgent' })

    expect(app.get('#report-description').element.value).toBe('')
    expect(app.get('#report-reporter').element.value).toBe('')
    expect(app.get('input[value="Normal"]').element.checked).toBe(true)
  })
})

describe('2. description required', () => {
  it.each([
    ['blank', ''],
    ['spaces only', '     '],
  ])('rejects a %s description with feedback', async (_, description) => {
    await report({ description, reporter: 'Alex Morgan' })

    expect(app.findAll('.job-item')).toHaveLength(0)
    expect(savedJobs()).toHaveLength(0)

    const field = app.get('#report-description')
    const error = app.get('#report-description-error')
    expect(error.text()).toContain('Enter a description of the repair')
    expect(field.attributes('aria-invalid')).toBe('true')
    expect(field.attributes('aria-describedby')).toContain('report-description-error')
    expect(document.activeElement).toBe(field.element)

    // the valid field is left alone
    expect(app.get('#report-reporter').element.value).toBe('Alex Morgan')
  })

  it('rejects blank then spaces in a row, still no job', async () => {
    await report({ description: '', reporter: 'Alex Morgan' })
    await report({ description: '   ', reporter: 'Alex Morgan' })

    expect(app.findAll('.job-item')).toHaveLength(0)
    expect(app.find('#report-description-error').exists()).toBe(true)
  })
})

describe('3. reporter required', () => {
  it.each([
    ['blank', ''],
    ['spaces only', '    '],
  ])('rejects a %s reporter with feedback', async (_, reporter) => {
    await report({ description: 'Garden fence damaged', reporter })

    expect(app.findAll('.job-item')).toHaveLength(0)
    expect(savedJobs()).toHaveLength(0)

    const field = app.get('#report-reporter')
    expect(app.get('#report-reporter-error').text()).toContain('Enter the name of the person reporting it')
    expect(field.attributes('aria-invalid')).toBe('true')
    expect(field.attributes('aria-describedby')).toContain('report-reporter-error')
    expect(document.activeElement).toBe(field.element)

    expect(app.get('#report-description').element.value).toBe('Garden fence damaged')
  })

  it('shows both errors when both fields are empty', async () => {
    await report({ description: ' ', reporter: ' ' })

    expect(app.find('#report-description-error').exists()).toBe(true)
    expect(app.find('#report-reporter-error').exists()).toBe(true)
    expect(app.findAll('.job-item')).toHaveLength(0)
  })
})

describe('4. priority retained', () => {
  it('keeps Normal and Urgent on their own jobs, urgent shown in words', async () => {
    await report({ description: 'Bathroom tap dripping', reporter: 'Sam Lee', priority: 'Normal' })
    await report({ description: 'Garden fence damaged', reporter: 'Alex Morgan', priority: 'Urgent' })

    await openJob('MH-0001')
    expect(detailFact('Priority')).toBe('Normal')
    expect(detail().get('.tags').text()).not.toContain('Urgent')

    await openJob('MH-0002')
    expect(detailFact('Priority')).toBe('Urgent')
    expect(detail().get('.tag-urgent').text()).toContain('Urgent')

    expect(app.get('[data-job-id="MH-0001"]').text()).toContain('Normal')
    expect(app.get('[data-job-id="MH-0002"]').text()).toContain('Urgent')
  })
})

describe('5. independent jobs', () => {
  it('changing the fence leaves the kitchen light alone', async () => {
    await report({ description: 'Garden fence damaged', reporter: 'Alex Morgan', priority: 'Urgent' })
    await report({ description: 'Kitchen light flickering', reporter: 'Priya Shah', priority: 'Normal' })

    const [fence, kitchen] = savedJobs()
    expect(fence.id).not.toBe(kitchen.id)

    await openJob(fence.id)
    await startWork()
    await saveNote('Temporary barrier fitted')
    await complete('Fence repaired and checked')

    const kitchenAfter = savedJobs().find((job) => job.id === kitchen.id)
    expect(kitchenAfter).toEqual(kitchen)

    await openJob(kitchen.id)
    expect(detail().get('.description').text()).toBe('Kitchen light flickering')
    expect(detail().get('.tags').text()).toContain('New')
    expect(historyLabels()).toEqual(['Reported, status New'])
    expect(detail().find('.latest-note').exists()).toBe(false)
  })

  it('a draft typed on one job does not show up on another', async () => {
    await report({ description: 'Garden fence damaged', reporter: 'Alex Morgan' })
    await report({ description: 'Kitchen light flickering', reporter: 'Priya Shah' })

    await openJob('MH-0001')
    await startWork()
    await app.get('#progress-note').setValue('half written')

    await openJob('MH-0002')
    await startWork()
    expect(app.get('#progress-note').element.value).toBe('')
  })
})

describe('6. progress and history', () => {
  it('moves to In Progress, saves the note and keeps earlier history', async () => {
    await report({ description: 'Garden fence damaged', reporter: 'Alex Morgan', priority: 'Urgent' })

    await startWork()
    expect(detail().get('.tags').text()).toContain('In Progress')
    expect(detail().get('[role="status"]').text()).toContain('Status is now In Progress')

    await saveNote('Temporary barrier fitted')

    expect(detail().get('.tags').text()).toContain('In Progress')
    expect(detail().get('.latest-note').text()).toContain('Temporary barrier fitted')
    expect(detail().get('[role="status"]').text()).toContain('Progress note saved')
    expect(app.get('#progress-note').element.value).toBe('')

    expect(historyLabels()).toEqual([
      'Reported, status New',
      'Status changed to In Progress',
      'Progress note',
    ])

    // every entry has a date and time
    for (const time of detail().findAll('.timeline-time')) {
      expect(time.text()).toMatch(/^\d{1,2} \w{3} \d{4}, \d{2}:\d{2}$/)
      expect(Number.isNaN(Date.parse(time.attributes('datetime')))).toBe(false)
    }

    await saveNote('Ordered new panels')
    expect(detail().get('.latest-note').text()).toContain('Ordered new panels')
    expect(detail().get('.history').text()).toContain('Temporary barrier fitted')
    expect(historyLabels()).toHaveLength(4)
  })

  it('rejects a blank progress note', async () => {
    await report({ description: 'Garden fence damaged', reporter: 'Alex Morgan' })
    await startWork()
    await saveNote('   ')

    expect(app.get('#progress-note-error').text()).toContain('Write a note before saving')
    expect(historyLabels()).toHaveLength(2)
  })
})

describe('7. completion note required', () => {
  it('rejects empty and spaces-only completion and keeps everything as it was', async () => {
    await report({ description: 'Garden fence damaged', reporter: 'Alex Morgan', priority: 'Urgent' })
    await startWork()
    await saveNote('Temporary barrier fitted')

    const before = savedJobs()[0]

    for (const attempt of ['', '    ']) {
      await complete(attempt)

      const field = app.get('#completion-note')
      expect(app.get('#completion-note-error').text()).toContain('Add a completion note')
      expect(field.attributes('aria-invalid')).toBe('true')
      expect(field.attributes('aria-describedby')).toContain('completion-note-error')

      expect(detail().get('.tags').text()).toContain('In Progress')
      expect(detail().get('.latest-note').text()).toContain('Temporary barrier fitted')
      expect(historyLabels()).toEqual([
        'Reported, status New',
        'Status changed to In Progress',
        'Progress note',
      ])
      expect(savedJobs()[0]).toEqual(before)
    }
  })
})

describe('8. complete a repair', () => {
  it('shows Completed and the note, earlier history still there', async () => {
    await report({ description: 'Garden fence damaged', reporter: 'Alex Morgan', priority: 'Urgent' })
    await startWork()
    await saveNote('Temporary barrier fitted')
    await complete('Fence repaired and checked')

    expect(detail().get('.tags').text()).toContain('Completed')
    expect(detail().get('.outcome').text()).toContain('Completed')
    expect(detail().get('.outcome-note').text()).toBe('Fence repaired and checked')
    expect(document.activeElement).toBe(detail().get('.outcome').element)

    expect(historyLabels()).toEqual([
      'Reported, status New',
      'Status changed to In Progress',
      'Progress note',
      'Status changed to Completed',
    ])
    expect(detail().get('.history').text()).toContain('Temporary barrier fitted')
    expect(detail().get('.history').text()).toContain('Fence repaired and checked')

    // nothing left to update once it's done
    expect(app.find('#progress-note').exists()).toBe(false)
    expect(app.find('#completion-note').exists()).toBe(false)
  })
})

describe('9. refresh persistence', () => {
  it('both jobs keep their own fields, status, notes and history', async () => {
    await report({ description: 'Garden fence damaged', reporter: 'Alex Morgan', priority: 'Urgent' })
    await startWork()
    await saveNote('Temporary barrier fitted')
    await complete('Fence repaired and checked')

    await report({ description: 'Kitchen light flickering', reporter: 'Priya Shah', priority: 'Normal' })

    const before = savedJobs()
    refresh()
    await flushPromises()

    expect(app.findAll('.job-item')).toHaveLength(2)
    expect(savedJobs()).toEqual(before)

    await openJob('MH-0001')
    expect(detail().get('.description').text()).toBe('Garden fence damaged')
    expect(detailFact('Reported by')).toBe('Alex Morgan')
    expect(detailFact('Priority')).toBe('Urgent')
    expect(detail().get('.tags').text()).toContain('Completed')
    expect(detail().get('.outcome-note').text()).toBe('Fence repaired and checked')
    expect(historyLabels()).toHaveLength(4)
    expect(detail().get('.history').text()).toContain('Temporary barrier fitted')

    await openJob('MH-0002')
    expect(detail().get('.description').text()).toBe('Kitchen light flickering')
    expect(detailFact('Reported by')).toBe('Priya Shah')
    expect(detailFact('Priority')).toBe('Normal')
    expect(detail().get('.tags').text()).toContain('New')
    expect(historyLabels()).toEqual(['Reported, status New'])
  })

  it('keeps ids unique after a refresh', async () => {
    await report({ description: 'Garden fence damaged', reporter: 'Alex Morgan' })
    refresh()
    await report({ description: 'Kitchen light flickering', reporter: 'Priya Shah' })

    expect(savedJobs().map((job) => job.id)).toEqual(['MH-0001', 'MH-0002'])
  })
})

describe('10. typed text stays plain', () => {
  const literal = '<b>check gate</b>'

  it('shows html-looking text literally in the report and notes', async () => {
    await report({ description: literal, reporter: 'Alex Morgan' })
    await startWork()
    await saveNote(literal)

    expect(detail().get('.description').text()).toBe(literal)
    expect(detail().get('.latest-note').text()).toContain(literal)
    expect(app.get('[data-job-id="MH-0001"]').text()).toContain(literal)

    await complete(literal)
    expect(detail().get('.outcome-note').text()).toBe(literal)

    expect(document.querySelector('#app b, body b')).toBeNull()
  })

  it('never runs injected markup', async () => {
    window.__ran = false
    const nasty = '<img src=x onerror="window.__ran = true"><script>window.__ran = true</script>'

    await report({ description: nasty, reporter: nasty })
    await startWork()
    await saveNote(nasty)
    await flushPromises()

    expect(document.querySelector('img')).toBeNull()
    expect(document.querySelectorAll('script')).toHaveLength(0)
    expect(detail().get('.description').text()).toBe(nasty)
    expect(window.__ran).toBe(false)
  })
})

describe('accessibility basics', () => {
  it('every form control has a label', async () => {
    await report({ description: 'Garden fence damaged', reporter: 'Alex Morgan' })
    await startWork()

    for (const control of document.querySelectorAll('input, textarea')) {
      const label = control.labels?.[0]
      expect(label?.textContent.trim(), `control ${control.id || control.name}`).toBeTruthy()
    }
  })

  it('moves focus to the job when picked from the list', async () => {
    await report({ description: 'Garden fence damaged', reporter: 'Alex Morgan' })
    await report({ description: 'Kitchen light flickering', reporter: 'Priya Shah' })

    await openJob('MH-0001')
    expect(document.activeElement).toBe(detail().get('h2').element)
    expect(app.get('[data-job-id="MH-0001"]').attributes('aria-current')).toBe('true')
  })
})
