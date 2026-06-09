import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Gift,
  Heart,
  Link as LinkIcon,
  LockKeyhole,
  Mail,
  MessageCircle,
  PenLine,
  Printer,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react'
import heroImg from './assets/keepsent-hero.png'
import './App.css'

type OccasionKey = 'thanks' | 'tribute' | 'encouragement' | 'repair' | 'care'
type ToneKey = 'plain' | 'tender' | 'bright' | 'formal'

type NoteForm = {
  recipient: string
  sender: string
  relationship: string
  occasion: OccasionKey
  tone: ToneKey
  moment: string
  qualities: string
  impact: string
  hope: string
  boundary: string
  deliveryDate: string
}

type PublishedNote = NoteForm & {
  id: string
  body: string
  title: string
  createdAt: string
}

type Feedback = {
  id: string
  createdAt: string
  noteId: string
  label: string
  comment: string
}

type Reservation = {
  id: string
  createdAt: string
  plan: string
  name: string
  email: string
  why: string
}

const storageKeys = {
  form: 'keepsent.form',
  draft: 'keepsent.draft',
  notes: 'keepsent.notes',
  feedback: 'keepsent.feedback',
  reservations: 'keepsent.reservations',
}

const defaultForm: NoteForm = {
  recipient: '',
  sender: '',
  relationship: '',
  occasion: 'thanks',
  tone: 'plain',
  moment: '',
  qualities: '',
  impact: '',
  hope: '',
  boundary: '',
  deliveryDate: '',
}

const occasions: Record<
  OccasionKey,
  { label: string; short: string; icon: typeof Heart }
> = {
  thanks: {
    label: 'Thank you',
    short: 'Gratitude that feels specific',
    icon: Heart,
  },
  tribute: {
    label: 'Living tribute',
    short: 'A birthday, milestone, or legacy note',
    icon: Gift,
  },
  encouragement: {
    label: 'Encouragement',
    short: 'Steady words for a hard season',
    icon: MessageCircle,
  },
  repair: {
    label: 'Repair',
    short: 'An apology with respect and limits',
    icon: ShieldCheck,
  },
  care: {
    label: 'Caregiver note',
    short: 'Support for someone carrying a lot',
    icon: Users,
  },
}

const tones: Record<ToneKey, { label: string; hint: string }> = {
  plain: { label: 'Plain', hint: 'simple and direct' },
  tender: { label: 'Tender', hint: 'warm and vulnerable' },
  bright: { label: 'Bright', hint: 'light but sincere' },
  formal: { label: 'Formal', hint: 'polished and composed' },
}

const plans = [
  {
    name: 'Keepsake',
    price: '$7',
    cadence: 'one private page',
    audience: 'One important note, no account needed.',
    features: ['Polished note page', 'Share link', 'PDF or print export'],
  },
  {
    name: 'Year',
    price: '$29',
    cadence: 'per year',
    audience: 'For people who want to keep saying it well.',
    features: ['Unlimited notes', 'Saved recipients', 'Milestone reminders'],
  },
  {
    name: 'Family',
    price: '$79',
    cadence: 'per year',
    audience: 'For families preserving stories together.',
    features: ['Shared vault', 'Contributor prompts', 'Family occasions'],
  },
]

const sourceLinks = [
  {
    label: 'Gallup: 1 in 5 U.S. adults report daily loneliness',
    url: 'https://news.gallup.com/poll/651881/daily-loneliness-afflicts-one-five.aspx',
  },
  {
    label: 'Pew: Americans and emotional support networks',
    url: 'https://www.pewresearch.org/social-trends/2025/01/16/men-women-and-social-connections/',
  },
  {
    label: 'Grand View Research: U.S. greeting cards market',
    url: 'https://www.grandviewresearch.com/industry-analysis/us-greeting-cards-market-report',
  },
  {
    label: 'CDC: community connection and loneliness data',
    url: 'https://www.cdc.gov/mental-health/about-data/community-connection.html',
  },
]

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback

  try {
    const value = window.localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

function writeStorage<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function isOccasion(value: unknown): value is OccasionKey {
  return typeof value === 'string' && value in occasions
}

function isTone(value: unknown): value is ToneKey {
  return typeof value === 'string' && value in tones
}

function normalizeForm(value: unknown): NoteForm {
  if (!isRecord(value)) return defaultForm

  return {
    recipient: asString(value.recipient),
    sender: asString(value.sender),
    relationship: asString(value.relationship),
    occasion: isOccasion(value.occasion) ? value.occasion : defaultForm.occasion,
    tone: isTone(value.tone) ? value.tone : defaultForm.tone,
    moment: asString(value.moment),
    qualities: asString(value.qualities),
    impact: asString(value.impact),
    hope: asString(value.hope),
    boundary: asString(value.boundary),
    deliveryDate: asString(value.deliveryDate),
  }
}

function validatePublishedNote(value: unknown): PublishedNote | null {
  if (!isRecord(value)) return null

  const body = asString(value.body).trim()
  const title = asString(value.title).trim()
  const id = asString(value.id).trim()
  const createdAt = asString(value.createdAt).trim()

  if (!body || !title || !id || !createdAt) return null

  return {
    ...normalizeForm(value),
    id,
    body,
    title,
    createdAt,
  }
}

function validateFeedback(value: unknown): Feedback | null {
  if (!isRecord(value)) return null
  const id = asString(value.id).trim()
  const createdAt = asString(value.createdAt).trim()
  const noteId = asString(value.noteId).trim()
  const label = asString(value.label).trim()
  if (!id || !createdAt || !noteId || !label) return null

  return {
    id,
    createdAt,
    noteId,
    label,
    comment: asString(value.comment),
  }
}

function validateReservation(value: unknown): Reservation | null {
  if (!isRecord(value)) return null
  const id = asString(value.id).trim()
  const createdAt = asString(value.createdAt).trim()
  const plan = asString(value.plan).trim()
  const email = asString(value.email).trim()
  if (!id || !createdAt || !plan || !email) return null

  return {
    id,
    createdAt,
    plan,
    name: asString(value.name),
    email,
    why: asString(value.why),
  }
}

function readList<T>(
  key: string,
  validator: (value: unknown) => T | null,
): T[] {
  const value = readStorage<unknown>(key, [])
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    const parsed = validator(item)
    return parsed ? [parsed] : []
  })
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`
}

function compact(value: string, fallback: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : fallback
}

function splitList(value: string) {
  return value
    .split(/\n|,|;/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function sentence(value: string, fallback: string) {
  const text = compact(value, fallback)
  return text.endsWith('.') || text.endsWith('!') || text.endsWith('?')
    ? text
    : `${text}.`
}

function encodeNote(note: PublishedNote) {
  const json = JSON.stringify(note)
  const bytes = new TextEncoder().encode(json)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return window
    .btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function decodeNote(payload: string): PublishedNote | null {
  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    const binary = window.atob(padded)
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    return validatePublishedNote(JSON.parse(new TextDecoder().decode(bytes)))
  } catch {
    return null
  }
}

function getSharedNoteFromHash() {
  if (typeof window === 'undefined') return null
  if (!window.location.hash.startsWith('#note=')) return null
  return decodeNote(window.location.hash.replace('#note=', ''))
}

function buildDraft(form: NoteForm) {
  const recipient = compact(form.recipient, 'you')
  const sender = compact(form.sender, 'me')
  const relationship = compact(form.relationship, 'someone important to me')
  const moment = sentence(
    form.moment,
    'there is one moment I keep returning to when I think about you',
  )
  const impact = sentence(
    form.impact,
    'it changed the way I moved through that day',
  )
  const hope = sentence(
    form.hope,
    'I hope you can carry this as proof that your presence matters',
  )
  const qualities = splitList(form.qualities)
  const qualityLine =
    qualities.length > 0
      ? `What stays with me is your ${qualities.join(', ')}.`
      : 'What stays with me is the particular way you show up when it matters.'

  const toneOpeners: Record<ToneKey, string> = {
    plain: `Dear ${recipient},`,
    tender: `Dear ${recipient},`,
    bright: `${recipient},`,
    formal: `Dear ${recipient},`,
  }

  const toneClosers: Record<ToneKey, string> = {
    plain: `With care,\n${sender}`,
    tender: `With a full heart,\n${sender}`,
    bright: `Glad I got to say this,\n${sender}`,
    formal: `With appreciation,\n${sender}`,
  }

  const occasionOpeners: Record<OccasionKey, string> = {
    thanks: `I wanted to say thank you in a way that lasts longer than a quick message. As ${relationship}, I have seen how much of yourself you put into the people and moments around you.`,
    tribute: `I do not want to wait for a perfect speech to tell you what you have meant to me. As ${relationship}, I have had a front-row seat to parts of your life that deserve to be named while you can still hear them.`,
    encouragement: `I know this season has asked a lot of you. I am writing because a rushed check-in would not be enough, and because you deserve words that stay nearby when the day gets heavy.`,
    repair: `I have been thinking about what happened, and I want to write carefully instead of asking you to carry my unfinished thoughts. I am not writing to rush you or manage your response.`,
    care: `I can see that you have been carrying more than most people notice. I wanted to put words around that care, not as advice, but as witness.`,
  }

  const occasionMiddle: Record<OccasionKey, string> = {
    thanks: `The detail I do not want to lose is this: ${moment} ${impact}`,
    tribute: `The memory I keep is this: ${moment} ${qualityLine} ${impact}`,
    encouragement: `When I think about what might help you feel less alone, I come back to this: ${moment} ${qualityLine}`,
    repair: `The part I need to own is this: ${moment} ${impact}`,
    care: `The thing I have noticed is this: ${moment} ${qualityLine}`,
  }

  const boundary =
    form.boundary.trim().length > 0
      ? `I also want to respect this boundary: ${sentence(form.boundary, '')}`
      : form.occasion === 'repair'
        ? 'I will respect the time and space you need, even if that means waiting without pressing.'
        : ''

  const occasionEndings: Record<OccasionKey, string> = {
    thanks: `${hope} Thank you for the part of you that made that possible.`,
    tribute: `${hope} I am grateful that I get to say this now, plainly and without an occasion having to do all the work.`,
    encouragement: `${hope} You do not have to perform strength for this note to be true.`,
    repair: `${hope} I am sorry, and I will let my next actions carry more weight than this letter.`,
    care: `${hope} I hope you also receive care, rest, and backup, not only praise for enduring.`,
  }

  const paragraphs = [
    toneOpeners[form.tone],
    occasionOpeners[form.occasion],
    occasionMiddle[form.occasion],
    boundary,
    occasionEndings[form.occasion],
    toneClosers[form.tone],
  ].filter(Boolean)

  return paragraphs.join('\n\n')
}

function getQuality(form: NoteForm, draft: string) {
  const detailFields = [
    form.recipient,
    form.relationship,
    form.moment,
    form.qualities,
    form.impact,
    form.hope,
  ].filter((field) => field.trim().length > 0).length
  const wordCount = draft.trim().split(/\s+/).filter(Boolean).length
  const score = Math.min(100, detailFields * 13 + Math.min(22, wordCount / 4))
  const missing = [
    ['recipient', form.recipient],
    ['relationship', form.relationship],
    ['one concrete memory', form.moment],
    ['what changed because of them', form.impact],
    ['what you hope they carry', form.hope],
  ]
    .filter(([, value]) => !value.trim())
    .map(([label]) => label)

  return { score: Math.round(score), wordCount, missing }
}

function App() {
  const [form, setForm] = useState<NoteForm>(() =>
    normalizeForm(readStorage<unknown>(storageKeys.form, defaultForm)),
  )
  const [draft, setDraft] = useState(() => readStorage(storageKeys.draft, ''))
  const [savedNotes, setSavedNotes] = useState<PublishedNote[]>(() =>
    readList(storageKeys.notes, validatePublishedNote),
  )
  const [feedback, setFeedback] = useState<Feedback[]>(() =>
    readList(storageKeys.feedback, validateFeedback),
  )
  const [reservations, setReservations] = useState<Reservation[]>(() =>
    readList(storageKeys.reservations, validateReservation),
  )
  const [sharedNote, setSharedNote] = useState<PublishedNote | null>(() =>
    getSharedNoteFromHash(),
  )
  const [publishedNote, setPublishedNote] = useState<PublishedNote | null>(
    null,
  )
  const [toast, setToast] = useState('')
  const [selectedPlan, setSelectedPlan] = useState(plans[0].name)
  const [reservationForm, setReservationForm] = useState({
    name: '',
    email: '',
    why: '',
  })
  const [recipientReply, setRecipientReply] = useState('')
  const [recipientFeeling, setRecipientFeeling] = useState('felt personal')

  const quality = useMemo(() => getQuality(form, draft), [form, draft])

  useEffect(() => {
    writeStorage(storageKeys.form, form)
  }, [form])

  useEffect(() => {
    writeStorage(storageKeys.draft, draft)
  }, [draft])

  useEffect(() => {
    writeStorage(storageKeys.notes, savedNotes)
  }, [savedNotes])

  useEffect(() => {
    writeStorage(storageKeys.feedback, feedback)
  }, [feedback])

  useEffect(() => {
    writeStorage(storageKeys.reservations, reservations)
  }, [reservations])

  useEffect(() => {
    const onHashChange = () => setSharedNote(getSharedNoteFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(''), 2600)
    return () => window.clearTimeout(timeout)
  }, [toast])

  function updateForm<Key extends keyof NoteForm>(key: Key, value: NoteForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function generate() {
    const nextDraft = buildDraft(form)
    setDraft(nextDraft)
    setToast('Draft created')
  }

  function createNote() {
    const body = draft.trim() || buildDraft(form)
    if (!draft.trim()) setDraft(body)

    const note: PublishedNote = {
      ...form,
      id: makeId('note'),
      body,
      title: `${compact(form.recipient, 'Someone')} - ${
        occasions[form.occasion].label
      }`,
      createdAt: new Date().toISOString(),
    }

    const payload = encodeNote(note)
    window.history.replaceState(null, '', `#note=${payload}`)
    setPublishedNote(note)
    setSharedNote(note)
    setSavedNotes((current) => [note, ...current].slice(0, 12))
    setToast('Keepsake link created')
  }

  async function copyText(value: string, success: string) {
    await navigator.clipboard.writeText(value)
    setToast(success)
  }

  function getShareUrl(note: PublishedNote) {
    return `${window.location.origin}${window.location.pathname}#note=${encodeNote(
      note,
    )}`
  }

  function downloadText(filename: string, content: string) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
    setToast('Download ready')
  }

  function saveFeedback(label: string, comment: string, noteId = 'draft') {
    const next: Feedback = {
      id: makeId('feedback'),
      createdAt: new Date().toISOString(),
      noteId,
      label,
      comment,
    }
    setFeedback((current) => [next, ...current].slice(0, 40))
    setRecipientReply('')
    setToast('Feedback saved locally')
  }

  function getFeedbackPacket(note: PublishedNote) {
    return [
      `Keepsent feedback for ${note.title}`,
      `Reaction: ${recipientFeeling}`,
      recipientReply.trim() ? `Reply: ${recipientReply.trim()}` : '',
      `Note ID: ${note.id}`,
    ]
      .filter(Boolean)
      .join('\n')
  }

  function reservePlan() {
    const next: Reservation = {
      id: makeId('reservation'),
      createdAt: new Date().toISOString(),
      plan: selectedPlan,
      ...reservationForm,
    }
    setReservations((current) => [next, ...current])
    setReservationForm({ name: '', email: '', why: '' })
    setToast('Reservation saved locally')
  }

  function exportCompanyData() {
    downloadText(
      'keepsent-company-data.json',
      JSON.stringify({ savedNotes, feedback, reservations }, null, 2),
    )
  }

  function clearSharedNote() {
    window.history.replaceState(null, '', window.location.pathname)
    setSharedNote(null)
    setPublishedNote(null)
  }

  if (sharedNote) {
    return (
      <main className="shared-page">
        <section className="shared-hero">
          <div className="brand-mark">
            <Heart size={18} />
            <span>Keepsent</span>
          </div>
          <button className="ghost-button" type="button" onClick={clearSharedNote}>
            <PenLine size={17} />
            Write your own
          </button>
        </section>

        <article className="keepsake-sheet">
          <div className="keepsake-meta">
            <span>{occasions[sharedNote.occasion].label}</span>
            <span>
              {new Intl.DateTimeFormat(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }).format(new Date(sharedNote.createdAt))}
            </span>
          </div>
          <h1>{sharedNote.title}</h1>
          <pre>{sharedNote.body}</pre>
          <div className="shared-actions">
            <button
              type="button"
              className="icon-button"
              onClick={() =>
                copyText(getShareUrl(sharedNote), 'Share link copied')
              }
            >
              <LinkIcon size={17} />
              Link
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={() => window.print()}
            >
              <Printer size={17} />
              Print
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={() => copyText(sharedNote.body, 'Note copied')}
            >
              <Copy size={17} />
              Copy
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={() =>
                downloadText(`${sharedNote.title}.txt`, sharedNote.body)
              }
            >
              <Download size={17} />
              Save
            </button>
          </div>
        </article>

        <section className="reply-panel" aria-labelledby="reply-title">
          <div>
            <p className="eyebrow">Private feedback</p>
            <h2 id="reply-title">How did it land?</h2>
            <p className="microcopy">
              Saved feedback stays on this device. Copy it when the sender needs
              the signal.
            </p>
          </div>
          <div className="reply-options">
            {['felt personal', 'made me reply', 'too generic', 'too much'].map(
              (option) => (
                <button
                  key={option}
                  className={recipientFeeling === option ? 'selected' : ''}
                  type="button"
                  onClick={() => setRecipientFeeling(option)}
                >
                  {option}
                </button>
              ),
            )}
          </div>
          <textarea
            value={recipientReply}
            onChange={(event) => setRecipientReply(event.target.value)}
            placeholder="Optional reply or note to self"
          />
          <div className="button-row">
            <button
              className="primary-button"
              type="button"
              onClick={() =>
                saveFeedback(recipientFeeling, recipientReply, sharedNote.id)
              }
            >
              <Save size={17} />
              Save here
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() =>
                copyText(getFeedbackPacket(sharedNote), 'Feedback copied')
              }
            >
              <Copy size={17} />
              Copy feedback
            </button>
          </div>
        </section>
        {toast && <div className="toast">{toast}</div>}
      </main>
    )
  }

  return (
    <>
      <header className="topbar">
        <a className="brand-mark" href="#top" aria-label="Keepsent home">
          <Heart size={18} />
          <span>Keepsent</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#studio">Studio</a>
          <a href="#pricing">Pricing</a>
          <a href="#company">Company</a>
        </nav>
      </header>

      <main id="top">
        <section
          className="hero-section"
          style={{ backgroundImage: `url(${heroImg})` }}
        >
          <div className="hero-scrim" />
          <div className="hero-content">
            <p className="eyebrow">
              <LockKeyhole size={16} />
              Local-first private note studio
            </p>
            <h1>Keepsent</h1>
            <p className="hero-copy">
              Turn the important thing you keep almost saying into a specific
              keepsake note that still sounds like you.
            </p>
            <div className="hero-actions">
              <a className="primary-button" href="#studio">
                <PenLine size={18} />
                Start a note
              </a>
              <a className="secondary-button" href="#company">
                <BarChart3 size={18} />
                See the thesis
              </a>
            </div>
          </div>
        </section>

        <section className="studio-band" id="studio">
          <div className="section-heading">
            <p className="eyebrow">
              <PenLine size={16} />
              Product
            </p>
            <h2>A working studio for meaningful sends</h2>
            <p>
              Draft locally, shape the tone, publish a private link, and keep
              the feedback loop close to the words.
            </p>
          </div>

          <div className="studio-grid">
            <form
              className="composer-panel"
              onSubmit={(event) => {
                event.preventDefault()
                generate()
              }}
            >
              <div className="field-row">
                <label>
                  Recipient
                  <input
                    value={form.recipient}
                    onChange={(event) =>
                      updateForm('recipient', event.target.value)
                    }
                    placeholder="Maya"
                  />
                </label>
                <label>
                  From
                  <input
                    value={form.sender}
                    onChange={(event) => updateForm('sender', event.target.value)}
                    placeholder="Alex"
                  />
                </label>
              </div>

              <label>
                Relationship
                <input
                  value={form.relationship}
                  onChange={(event) =>
                    updateForm('relationship', event.target.value)
                  }
                  placeholder="your older brother, my mentor, our neighbor"
                />
              </label>

              <fieldset>
                <legend>Moment</legend>
                <div className="segment-grid">
                  {(Object.keys(occasions) as OccasionKey[]).map((key) => {
                    const Icon = occasions[key].icon
                    return (
                      <button
                        key={key}
                        type="button"
                        className={form.occasion === key ? 'selected' : ''}
                        onClick={() => updateForm('occasion', key)}
                      >
                        <Icon size={17} />
                        <span>{occasions[key].label}</span>
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <fieldset>
                <legend>Tone</legend>
                <div className="tone-row">
                  {(Object.keys(tones) as ToneKey[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      className={form.tone === key ? 'selected' : ''}
                      onClick={() => updateForm('tone', key)}
                    >
                      {tones[key].label}
                    </button>
                  ))}
                </div>
                <p className="microcopy">{tones[form.tone].hint}</p>
              </fieldset>

              <label>
                One concrete memory
                <textarea
                  value={form.moment}
                  onChange={(event) => updateForm('moment', event.target.value)}
                  placeholder="The moment you drove across town after work with soup and no speech..."
                />
              </label>

              <label>
                Qualities to name
                <textarea
                  value={form.qualities}
                  onChange={(event) =>
                    updateForm('qualities', event.target.value)
                  }
                  placeholder="steady patience, exact humor, courage, generosity"
                />
              </label>

              <label>
                What changed because of them
                <textarea
                  value={form.impact}
                  onChange={(event) => updateForm('impact', event.target.value)}
                  placeholder="I felt less alone and more able to do the next hard thing."
                />
              </label>

              <label>
                What you hope they carry
                <textarea
                  value={form.hope}
                  onChange={(event) => updateForm('hope', event.target.value)}
                  placeholder="I hope you know your care was noticed, not just needed."
                />
              </label>

              <label>
                Boundary or care note
                <input
                  value={form.boundary}
                  onChange={(event) => updateForm('boundary', event.target.value)}
                  placeholder="Optional, especially for repair notes"
                />
              </label>

              <label>
                Delivery date
                <input
                  type="date"
                  value={form.deliveryDate}
                  onChange={(event) =>
                    updateForm('deliveryDate', event.target.value)
                  }
                />
              </label>

              <div className="button-row">
                <button className="primary-button" type="submit">
                  <RefreshCw size={17} />
                  Draft
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => {
                    setForm(defaultForm)
                    setDraft('')
                  }}
                >
                  <Trash2 size={17} />
                  Reset
                </button>
              </div>
            </form>

            <aside className="draft-panel" aria-labelledby="draft-title">
              <div className="draft-header">
                <div>
                  <p className="eyebrow">
                    <FileText size={16} />
                    Draft
                  </p>
                  <h2 id="draft-title">Make it sound true</h2>
                </div>
                <div className="score-ring" aria-label={`Specificity score ${quality.score}`}>
                  {quality.score}
                </div>
              </div>

              <textarea
                className="draft-textarea"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Your draft will appear here."
              />

              <div className="quality-strip">
                <span>{quality.wordCount} words</span>
                <span>{quality.missing.length} gaps</span>
                <span>{occasions[form.occasion].short}</span>
              </div>

              {quality.missing.length > 0 && (
                <div className="gap-list">
                  {quality.missing.slice(0, 3).map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              )}

              <div className="button-grid">
                <button className="primary-button" type="button" onClick={createNote}>
                  <LinkIcon size={17} />
                  Make link
                </button>
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => copyText(draft, 'Draft copied')}
                  disabled={!draft.trim()}
                >
                  <Copy size={17} />
                  Copy
                </button>
                <button
                  className="icon-button"
                  type="button"
                  onClick={() =>
                    downloadText(
                      `${compact(form.recipient, 'keepsent-note')}.txt`,
                      draft,
                    )
                  }
                  disabled={!draft.trim()}
                >
                  <Download size={17} />
                  Export
                </button>
              </div>

              {publishedNote && (
                <div className="published-panel">
                  <CheckCircle2 size={20} />
                  <div>
                    <strong>Private keepsake ready</strong>
                    <button
                      type="button"
                      onClick={() =>
                        copyText(getShareUrl(publishedNote), 'Share link copied')
                      }
                    >
                      Copy share link
                    </button>
                  </div>
                </div>
              )}

              <div className="feedback-mini">
                <p className="eyebrow">Sender check</p>
                <div className="reply-options compact">
                  {['felt like me', 'too generic', 'too much', 'not enough'].map(
                    (label) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => saveFeedback(label, '', 'draft')}
                      >
                        {label}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="library-band">
          <div className="section-heading">
            <p className="eyebrow">
              <Clock size={16} />
              Vault
            </p>
            <h2>Saved locally on this device</h2>
          </div>
          <div className="note-list">
            {savedNotes.length === 0 ? (
              <p className="empty-state">No keepsakes yet.</p>
            ) : (
              savedNotes.map((note) => (
                <article className="note-card" key={note.id}>
                  <p className="eyebrow">{occasions[note.occasion].label}</p>
                  <h3>{note.title}</h3>
                  <p>{note.body.split('\n\n')[1]?.slice(0, 132) || note.body}</p>
                  <div className="note-actions">
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => {
                        window.history.replaceState(
                          null,
                          '',
                          `#note=${encodeNote(note)}`,
                        )
                        setSharedNote(note)
                      }}
                    >
                      <FileText size={16} />
                      Open
                    </button>
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() =>
                        copyText(getShareUrl(note), 'Share link copied')
                      }
                    >
                      <LinkIcon size={16} />
                      Link
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="pricing-band" id="pricing">
          <div className="section-heading">
            <p className="eyebrow">
              <CreditCard size={16} />
              Offer
            </p>
            <h2>Graceful pricing for meaningful moments</h2>
            <p>
              The first version sells clarity, privacy, and the courage to send,
              not addictive engagement.
            </p>
          </div>
          <div className="pricing-grid">
            {plans.map((plan) => (
              <article
                className={selectedPlan === plan.name ? 'plan-card selected' : 'plan-card'}
                key={plan.name}
              >
                <div className="plan-topline">
                  <h3>{plan.name}</h3>
                  <span>{plan.price}</span>
                </div>
                <p>{plan.cadence}</p>
                <p>{plan.audience}</p>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <CheckCircle2 size={16} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => setSelectedPlan(plan.name)}
                >
                  <CreditCard size={17} />
                  Select
                </button>
              </article>
            ))}
          </div>

          <div className="reservation-panel">
            <div>
              <p className="eyebrow">Founding signal</p>
              <h3>Reserve {selectedPlan}</h3>
              <p>
                This records purchase intent locally so early feedback can be
                judged against willingness to pay.
              </p>
            </div>
            <label>
              Name
              <input
                value={reservationForm.name}
                onChange={(event) =>
                  setReservationForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Your name"
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={reservationForm.email}
                onChange={(event) =>
                  setReservationForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                placeholder="you@example.com"
              />
            </label>
            <label>
              Why this is worth paying for
              <textarea
                value={reservationForm.why}
                onChange={(event) =>
                  setReservationForm((current) => ({
                    ...current,
                    why: event.target.value,
                  }))
                }
                placeholder="The person, occasion, or pain this would help with"
              />
            </label>
            <button
              className="primary-button"
              type="button"
              onClick={reservePlan}
              disabled={!reservationForm.email.trim()}
            >
              <Mail size={17} />
              Save reservation
            </button>
          </div>
        </section>

        <section className="company-band" id="company">
          <div className="section-heading">
            <p className="eyebrow">
              <BarChart3 size={16} />
              Company
            </p>
            <h2>A sustainable company around meaningful sends</h2>
            <p>
              Keepsent starts as a product people can use today and grows through
              paid moments, consented learning, and trusted private archives.
            </p>
          </div>

          <div className="company-grid">
            <article className="metric-card">
              <span>{savedNotes.length}</span>
              <p>keepsakes saved</p>
            </article>
            <article className="metric-card">
              <span>{feedback.length}</span>
              <p>feedback signals</p>
            </article>
            <article className="metric-card">
              <span>{reservations.length}</span>
              <p>paid-intent reservations</p>
            </article>
          </div>

          <div className="operating-grid">
            <article className="operating-card">
              <h3>Promise</h3>
              <p>
                Help people say something specific, private, and brave enough to
                send.
              </p>
            </article>
            <article className="operating-card">
              <h3>North star</h3>
              <p>Meaningful sends per active user, weighted by sender feedback.</p>
            </article>
            <article className="operating-card">
              <h3>Expansion</h3>
              <p>
                Caregiver support packs, family vaults, creator prompt packs, and
                printed keepsakes.
              </p>
            </article>
            <article className="operating-card">
              <h3>Trust rule</h3>
              <p>
                Private by default, no public gallery, no training on intimate
                notes without explicit consent.
              </p>
            </article>
          </div>

          <div className="source-panel">
            <div>
              <p className="eyebrow">Market signals</p>
              <h3>Why this wedge exists</h3>
            </div>
            <ul>
              {sourceLinks.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noreferrer">
                    <ExternalLink size={16} />
                    {source.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="button-row">
            <button className="secondary-button" type="button" onClick={exportCompanyData}>
              <Download size={17} />
              Export data
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() =>
                copyText(
                  'Keepsent helps people turn unsent feelings into private keepsake notes worth paying for because the recipient matters.',
                  'Company thesis copied',
                )
              }
            >
              <Copy size={17} />
              Copy thesis
            </button>
          </div>
        </section>
      </main>
      {toast && <div className="toast">{toast}</div>}
    </>
  )
}

export default App
