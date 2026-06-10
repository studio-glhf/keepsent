import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  CalendarDays,
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
type LanguageKey = 'en' | 'es' | 'ko' | 'ja'
type CadenceKey = 'once' | 'yearly' | 'monthly'
type FinishKey = 'letter' | 'card' | 'tribute'
type OutreachStatus = 'candidate' | 'invited' | 'trying' | 'used' | 'reserved'
type PlanName = 'Keepsake' | 'Year' | 'Family'

type KeepsakeFinish = {
  style: FinishKey
  heading: string
}

type NoteForm = {
  recipient: string
  sender: string
  relationship: string
  language: LanguageKey
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
  finish: KeepsakeFinish
}

type EncryptedNoteEnvelope = {
  v: 1
  kdf: 'PBKDF2-SHA-256'
  iterations: number
  salt: string
  iv: string
  data: string
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
  plan: PlanName
  name: string
  email: string
  why: string
}

type MomentReminder = {
  id: string
  createdAt: string
  recipient: string
  relationship: string
  occasion: OccasionKey
  date: string
  cadence: CadenceKey
  note: string
}

type RecipientProfile = {
  id: string
  createdAt: string
  name: string
  relationship: string
  language: LanguageKey
  tone: ToneKey
  qualities: string
  notes: string
}

type OutreachContact = {
  id: string
  createdAt: string
  name: string
  channel: string
  relationship: string
  moment: string
  status: OutreachStatus
  notes: string
}

type MomentPack = {
  title: string
  label: string
  priceSignal: string
  occasion: OccasionKey
  tone: ToneKey
  audience: string
  promise: string
  starter: Pick<
    NoteForm,
    'relationship' | 'moment' | 'qualities' | 'impact' | 'hope' | 'boundary'
  >
}

const storageKeys = {
  form: 'keepsent.form',
  draft: 'keepsent.draft',
  notes: 'keepsent.notes',
  feedback: 'keepsent.feedback',
  reservations: 'keepsent.reservations',
  reminders: 'keepsent.reminders',
  profiles: 'keepsent.profiles',
  finish: 'keepsent.finish',
  outreach: 'keepsent.outreach',
}

const defaultForm: NoteForm = {
  recipient: '',
  sender: '',
  relationship: '',
  language: 'en',
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

const languages: Record<LanguageKey, { label: string; native: string }> = {
  en: { label: 'English', native: 'English' },
  es: { label: 'Spanish', native: 'Español' },
  ko: { label: 'Korean', native: '한국어' },
  ja: { label: 'Japanese', native: '日本語' },
}

const cadences: Record<CadenceKey, { label: string; hint: string }> = {
  once: { label: 'One-time', hint: 'A specific send date' },
  yearly: { label: 'Yearly', hint: 'Birthdays, anniversaries, milestones' },
  monthly: { label: 'Monthly', hint: 'Regular care or encouragement' },
}

const outreachStatuses: Record<
  OutreachStatus,
  { label: string; hint: string }
> = {
  candidate: {
    label: 'Candidate',
    hint: 'Could use Keepsent for a real note soon.',
  },
  invited: {
    label: 'Invited',
    hint: 'Received a personal pilot ask.',
  },
  trying: {
    label: 'Trying',
    hint: 'Started a note or asked for help.',
  },
  used: {
    label: 'Used',
    hint: 'Created, sent, printed, or saved a keepsake.',
  },
  reserved: {
    label: 'Reserved',
    hint: 'Gave credible paid-intent signal.',
  },
}

const finishes: Record<FinishKey, { label: string; hint: string }> = {
  letter: {
    label: 'Letter',
    hint: 'A quiet personal page for direct sharing or PDF print.',
  },
  card: {
    label: 'Card',
    hint: 'A warmer keepsake layout for birthdays, thanks, and encouragement.',
  },
  tribute: {
    label: 'Tribute',
    hint: 'A ceremonial page for legacy notes and family memory moments.',
  },
}

const defaultFinish: KeepsakeFinish = {
  style: 'letter',
  heading: '',
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
] satisfies Array<{
  name: PlanName
  price: string
  cadence: string
  audience: string
  features: string[]
}>

const checkoutEnvKeys: Record<PlanName, string> = {
  Keepsake: 'VITE_KEEPSENT_CHECKOUT_KEEPSAKE',
  Year: 'VITE_KEEPSENT_CHECKOUT_YEAR',
  Family: 'VITE_KEEPSENT_CHECKOUT_FAMILY',
}

const checkoutLinks: Record<PlanName, string> = {
  Keepsake: String(import.meta.env.VITE_KEEPSENT_CHECKOUT_KEEPSAKE || ''),
  Year: String(import.meta.env.VITE_KEEPSENT_CHECKOUT_YEAR || ''),
  Family: String(import.meta.env.VITE_KEEPSENT_CHECKOUT_FAMILY || ''),
}

const momentPacks: MomentPack[] = [
  {
    title: 'Caregiver Witness',
    label: 'Family plan preview',
    priceSignal: '$79/year family vault',
    occasion: 'care',
    tone: 'tender',
    audience: 'Families, siblings, spouses, close friends',
    promise: 'Name invisible care without turning it into advice.',
    starter: {
      relationship: 'someone carrying care for our family',
      moment:
        'the week you handled appointments, meals, calls, and everyone else’s worry without asking to be noticed',
      qualities: 'steadiness, patience, practical love, endurance',
      impact: 'the rest of us had room to breathe because you kept showing up',
      hope:
        'I hope you know your care was seen, not only needed, and that you deserve care too',
      boundary:
        'I do not want praise to become another burden; I want to offer real backup too',
    },
  },
  {
    title: 'Mentor Thanks',
    label: 'Keepsake classic',
    priceSignal: '$7 private page',
    occasion: 'thanks',
    tone: 'formal',
    audience: 'Mentors, teachers, managers, advisors',
    promise: 'Turn vague gratitude into a concrete professional keepsake.',
    starter: {
      relationship: 'a mentor who changed how I see my work',
      moment:
        'the day you made time to explain the hard thing slowly instead of making me feel behind',
      qualities: 'clarity, patience, standards, generosity',
      impact:
        'I began to expect more from myself without feeling smaller in the process',
      hope:
        'I hope you know that your attention became part of how I now help other people',
      boundary: '',
    },
  },
  {
    title: 'Repair With Dignity',
    label: 'Trust builder',
    priceSignal: '$7 private page',
    occasion: 'repair',
    tone: 'plain',
    audience: 'Partners, friends, siblings, teammates',
    promise: 'Apologize without pressure, performance, or manipulation.',
    starter: {
      relationship: 'someone I hurt and still respect',
      moment:
        'the conversation where I protected my own discomfort instead of listening well',
      qualities: 'honesty, patience, courage',
      impact:
        'I made it harder for you to feel heard, and I understand why that matters',
      hope:
        'I hope my next actions give you more safety than my words alone can',
      boundary:
        'You do not owe me a quick reply, reassurance, or forgiveness on my timeline',
    },
  },
  {
    title: 'Living Tribute',
    label: 'Family memory pack',
    priceSignal: '$29/year reminder loop',
    occasion: 'tribute',
    tone: 'tender',
    audience: 'Parents, grandparents, elders, chosen family',
    promise: 'Say the legacy words while the person can still receive them.',
    starter: {
      relationship: 'someone whose life shaped mine',
      moment:
        'the ordinary ritual you repeated for years that quietly taught me what love looks like',
      qualities: 'humor, resilience, loyalty, care',
      impact:
        'I carry your way of loving into rooms you may never enter, and it changes how I show up',
      hope:
        'I hope you can hear this while it can still become part of your day',
      boundary: '',
    },
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

const issueBase = 'https://github.com/studio-glhf/keepsent/issues/new'
const pilotFeedbackUrl = `${issueBase}?template=pilot-feedback.yml&title=${encodeURIComponent(
  'Pilot feedback: ',
)}`
const foundingReservationUrl = `${issueBase}?template=founding-reservation.yml&title=${encodeURIComponent(
  'Founding reservation: ',
)}`

const pilotSteps = [
  {
    title: 'Send one real note',
    body: 'Use a moment that already matters: thanks, repair, encouragement, tribute, or care.',
  },
  {
    title: 'Report the outcome',
    body: 'Tell us whether it felt like you, whether you sent it, and whether the recipient replied.',
  },
  {
    title: 'Price the value',
    body: 'Reserve only if this specific moment would be worth paying for again.',
  },
]

function getPilotInvite() {
  return [
    'I am piloting Keepsent, a private note studio for moments that deserve better than a quick text.',
    '',
    'The ask: write one real note you have been meaning to send, make a private keepsake link, and tell me whether it helped you say something you otherwise would have delayed.',
    '',
    'Try it here: https://studio-glhf.github.io/keepsent/',
    '',
    'Please do not share private note text or Keepsent share links in public feedback. The useful signal is whether it felt true, whether you sent it, and whether you would pay $7 for that moment.',
  ].join('\n')
}

function getProductUrl() {
  if (typeof window === 'undefined') return 'https://studio-glhf.github.io/keepsent/'
  return `${window.location.origin}${window.location.pathname}`
}

function getConfiguredCheckoutBase(planName: PlanName) {
  const value = checkoutLinks[planName].trim()
  if (!value) return ''

  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.toString() : ''
  } catch {
    return ''
  }
}

function getCheckoutUrl(planName: PlanName, reference: string) {
  const base = getConfiguredCheckoutBase(planName)
  if (!base) return ''

  const url = new URL(base)
  url.searchParams.set('client_reference_id', reference)
  url.searchParams.set('utm_source', 'keepsent')
  url.searchParams.set('utm_medium', 'web')
  url.searchParams.set('utm_campaign', 'founding_checkout')
  url.searchParams.set('utm_content', planName.toLowerCase())
  return url.toString()
}

function getCheckoutSetupNote() {
  return [
    'Keepsent checkout setup',
    '',
    'Create Stripe Payment Links for each paid offer, then set these Vite environment variables before build:',
    `${checkoutEnvKeys.Keepsake}=https://buy.stripe.com/...`,
    `${checkoutEnvKeys.Year}=https://buy.stripe.com/...`,
    `${checkoutEnvKeys.Family}=https://buy.stripe.com/...`,
    '',
    'Keepsent appends client_reference_id plus UTM parameters for non-private reconciliation. Do not put private note text, share links, or recipient names in checkout metadata.',
    '',
    'Official Stripe Payment Links docs: https://docs.stripe.com/payment-links',
  ].join('\n')
}

function getOutreachInvite(contact: OutreachContact) {
  const greeting = contact.name.trim() ? `Hi ${contact.name.trim()},` : 'Hi,'
  const momentLine = contact.moment.trim()
    ? `I thought of you because you mentioned or may have a moment like this: ${contact.moment.trim()}.`
    : 'I thought of you because you may have one real note you have been meaning to send.'
  const relationshipLine = contact.relationship.trim()
    ? `The broad context I had in mind: ${contact.relationship.trim()}.`
    : ''

  return [
    greeting,
    '',
    'I am piloting Keepsent, a private note studio for meaningful notes people keep delaying.',
    momentLine,
    relationshipLine,
    '',
    'The ask is small: use it for one real note, make a keepsake link or printable page if it helps, then tell me whether it helped you say something you otherwise would have put off.',
    '',
    `Try it here: ${getProductUrl()}`,
    '',
    'Please do not send me private note text or public share links. The useful signal is whether it felt true, whether you sent/saved/printed it, and whether that moment would have been worth $7.',
    '',
    `Public feedback form: ${pilotFeedbackUrl}`,
  ]
    .filter(Boolean)
    .join('\n')
}

function getInterviewScript() {
  return [
    'Keepsent pilot interview',
    '',
    '1. What note did you choose to write, in broad terms?',
    '2. What were you stuck on before using Keepsent?',
    '3. Did the draft feel like you? What felt off?',
    '4. Did you send, copy, print, or save it?',
    '5. Did the recipient respond or did your own behavior change?',
    '6. Would this have been worth $7 for this moment? Why or why not?',
    '7. What would make you trust Keepsent with more family or relationship moments?',
  ].join('\n')
}

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

function isLanguage(value: unknown): value is LanguageKey {
  return typeof value === 'string' && value in languages
}

function isPlanName(value: unknown): value is PlanName {
  return typeof value === 'string' && plans.some((plan) => plan.name === value)
}

function isFinish(value: unknown): value is FinishKey {
  return typeof value === 'string' && value in finishes
}

function isOutreachStatus(value: unknown): value is OutreachStatus {
  return typeof value === 'string' && value in outreachStatuses
}

function normalizeFinish(value: unknown): KeepsakeFinish {
  if (!isRecord(value)) return defaultFinish
  return {
    style: isFinish(value.style) ? value.style : defaultFinish.style,
    heading: asString(value.heading),
  }
}

function normalizeForm(value: unknown): NoteForm {
  if (!isRecord(value)) return defaultForm

  return {
    recipient: asString(value.recipient),
    sender: asString(value.sender),
    relationship: asString(value.relationship),
    language: isLanguage(value.language) ? value.language : defaultForm.language,
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
    finish: normalizeFinish(value.finish),
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
    plan: isPlanName(plan) ? plan : plans[0].name,
    name: asString(value.name),
    email,
    why: asString(value.why),
  }
}

function validateReminder(value: unknown): MomentReminder | null {
  if (!isRecord(value)) return null
  const id = asString(value.id).trim()
  const createdAt = asString(value.createdAt).trim()
  const recipient = asString(value.recipient).trim()
  const date = asString(value.date).trim()
  if (!id || !createdAt || !recipient || !date) return null
  if (!isOccasion(value.occasion)) return null
  if (!(asString(value.cadence) in cadences)) return null

  return {
    id,
    createdAt,
    recipient,
    relationship: asString(value.relationship),
    occasion: value.occasion,
    date,
    cadence: asString(value.cadence) as CadenceKey,
    note: asString(value.note),
  }
}

function validateProfile(value: unknown): RecipientProfile | null {
  if (!isRecord(value)) return null
  const id = asString(value.id).trim()
  const createdAt = asString(value.createdAt).trim()
  const name = asString(value.name).trim()
  if (!id || !createdAt || !name) return null

  return {
    id,
    createdAt,
    name,
    relationship: asString(value.relationship),
    language: isLanguage(value.language) ? value.language : defaultForm.language,
    tone: isTone(value.tone) ? value.tone : defaultForm.tone,
    qualities: asString(value.qualities),
    notes: asString(value.notes),
  }
}

function validateOutreachContact(value: unknown): OutreachContact | null {
  if (!isRecord(value)) return null
  const id = asString(value.id).trim()
  const createdAt = asString(value.createdAt).trim()
  const name = asString(value.name).trim()
  if (!id || !createdAt || !name) return null

  return {
    id,
    createdAt,
    name,
    channel: asString(value.channel),
    relationship: asString(value.relationship),
    moment: asString(value.moment),
    status: isOutreachStatus(value.status) ? value.status : 'candidate',
    notes: asString(value.notes),
  }
}

function validateEncryptedEnvelope(value: unknown): EncryptedNoteEnvelope | null {
  if (!isRecord(value)) return null
  if (value.v !== 1 || value.kdf !== 'PBKDF2-SHA-256') return null
  const iterations = Number(value.iterations)
  const salt = asString(value.salt).trim()
  const iv = asString(value.iv).trim()
  const data = asString(value.data).trim()
  if (!Number.isFinite(iterations) || iterations < 100000) return null
  if (!salt || !iv || !data) return null

  return {
    v: 1,
    kdf: 'PBKDF2-SHA-256',
    iterations,
    salt,
    iv,
    data,
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function sentence(value: string, fallback: string) {
  const text = compact(value, fallback)
  return text.endsWith('.') || text.endsWith('!') || text.endsWith('?')
    ? text
    : `${text}.`
}

function sentenceFor(value: string, fallback: string, language: LanguageKey) {
  const text = compact(value, fallback)
  if (/[.!?。？！]$/.test(text)) return text
  return `${text}${language === 'ja' ? '。' : '.'}`
}

function joinQualities(qualities: string[], language: LanguageKey) {
  if (qualities.length === 0) return ''
  if (language === 'es') return qualities.join(', ')
  if (language === 'ko') return qualities.join(', ')
  if (language === 'ja') return qualities.join('、')
  return qualities.join(', ')
}

function bytesToBase64Url(bytes: Uint8Array) {
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

function base64UrlToBytes(payload: string) {
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    '=',
  )
  const binary = window.atob(padded)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

function bytesToArrayBuffer(bytes: Uint8Array) {
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)
  return buffer
}

function encodePayload(value: unknown) {
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(value)))
}

function decodePayload<T>(
  payload: string,
  validator: (value: unknown) => T | null,
) {
  try {
    return validator(JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload))))
  } catch {
    return null
  }
}

function encodeNote(note: PublishedNote) {
  return encodePayload(note)
}

function decodeNote(payload: string): PublishedNote | null {
  return decodePayload(payload, validatePublishedNote)
}

function encodeEncryptedEnvelope(envelope: EncryptedNoteEnvelope) {
  return encodePayload(envelope)
}

function decodeEncryptedEnvelope(payload: string) {
  return decodePayload(payload, validateEncryptedEnvelope)
}

function getSharedNoteFromHash() {
  if (typeof window === 'undefined') return null
  if (!window.location.hash.startsWith('#note=')) return null
  return decodeNote(window.location.hash.replace('#note=', ''))
}

function getSecureEnvelopeFromHash() {
  if (typeof window === 'undefined') return null
  if (!window.location.hash.startsWith('#secure=')) return null
  return decodeEncryptedEnvelope(window.location.hash.replace('#secure=', ''))
}

const secureLinkIterations = 210000

async function getPassphraseKey(
  passphrase: string,
  salt: Uint8Array,
  usages: KeyUsage[],
  iterations = secureLinkIterations,
) {
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: bytesToArrayBuffer(salt),
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    usages,
  )
}

async function encryptNote(note: PublishedNote, passphrase: string) {
  const salt = window.crypto.getRandomValues(new Uint8Array(16))
  const iv = window.crypto.getRandomValues(new Uint8Array(12))
  const key = await getPassphraseKey(passphrase, salt, ['encrypt'])
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(JSON.stringify(note)),
  )

  return {
    v: 1,
    kdf: 'PBKDF2-SHA-256',
    iterations: secureLinkIterations,
    salt: bytesToBase64Url(salt),
    iv: bytesToBase64Url(iv),
    data: bytesToBase64Url(new Uint8Array(encrypted)),
  } satisfies EncryptedNoteEnvelope
}

async function decryptNote(
  envelope: EncryptedNoteEnvelope,
  passphrase: string,
) {
  const salt = base64UrlToBytes(envelope.salt)
  const iv = base64UrlToBytes(envelope.iv)
  const key = await getPassphraseKey(passphrase, salt, ['decrypt'], envelope.iterations)
  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    base64UrlToBytes(envelope.data),
  )
  return validatePublishedNote(
    JSON.parse(new TextDecoder().decode(new Uint8Array(decrypted))),
  )
}

function toLocalDateIso(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

function parseLocalDate(value: string) {
  const parts = value.split('-').map(Number)
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) {
    return null
  }
  const [year, month, day] = parts
  return new Date(year, month - 1, day)
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getNextReminderDate(reminder: MomentReminder, todayIso: string) {
  const original = parseLocalDate(reminder.date)
  const today = parseLocalDate(todayIso)
  if (!original || !today) return reminder.date
  if (reminder.cadence === 'once') return reminder.date

  if (reminder.cadence === 'yearly') {
    const candidate = new Date(
      today.getFullYear(),
      original.getMonth(),
      original.getDate(),
    )
    if (candidate < today) candidate.setFullYear(today.getFullYear() + 1)
    return toLocalDateIso(candidate)
  }

  const candidate = new Date(
    today.getFullYear(),
    today.getMonth(),
    Math.min(original.getDate(), daysInMonth(today.getFullYear(), today.getMonth())),
  )
  if (candidate < today) {
    candidate.setMonth(today.getMonth() + 1)
    candidate.setDate(
      Math.min(
        original.getDate(),
        daysInMonth(candidate.getFullYear(), candidate.getMonth()),
      ),
    )
  }
  return toLocalDateIso(candidate)
}

function getReminderTiming(reminder: MomentReminder, todayIso: string) {
  const nextDate = getNextReminderDate(reminder, todayIso)
  const next = parseLocalDate(nextDate)
  const today = parseLocalDate(todayIso)
  if (!next || !today) return { nextDate, label: 'Needs a valid date', days: 9999 }
  const days = Math.round((next.getTime() - today.getTime()) / 86400000)
  if (days < 0) return { nextDate, label: 'Past due', days }
  if (days === 0) return { nextDate, label: 'Due today', days }
  if (days === 1) return { nextDate, label: 'Due tomorrow', days }
  if (days <= 30) return { nextDate, label: `Due in ${days} days`, days }
  return { nextDate, label: nextDate, days }
}

function buildDraft(form: NoteForm) {
  const recipient = compact(form.recipient, 'you')
  const sender = compact(form.sender, 'me')
  const language = form.language
  const qualities = splitList(form.qualities)

  if (language === 'es') {
    const relationship = compact(form.relationship, 'alguien importante para mí')
    const moment = sentenceFor(
      form.moment,
      'hay un momento al que vuelvo cuando pienso en ti',
      language,
    )
    const impact = sentenceFor(
      form.impact,
      'eso cambió la forma en que atravesé ese día',
      language,
    )
    const hope = sentenceFor(
      form.hope,
      'espero que puedas llevar esto como prueba de que tu presencia importa',
      language,
    )
    const qualityLine =
      qualities.length > 0
        ? `Lo que se queda conmigo es tu ${joinQualities(qualities, language)}.`
        : 'Lo que se queda conmigo es tu manera particular de estar cuando importa.'
    const boundary =
      form.boundary.trim().length > 0
        ? `También quiero respetar este límite: ${sentenceFor(form.boundary, '', language)}`
        : form.occasion === 'repair'
          ? 'Voy a respetar el tiempo y el espacio que necesites, incluso si eso significa esperar sin presionar.'
          : ''
    const toneOpeners: Record<ToneKey, string> = {
      plain: `Para ${recipient},`,
      tender: `Querido/a ${recipient},`,
      bright: `${recipient},`,
      formal: `Estimado/a ${recipient},`,
    }
    const toneClosers: Record<ToneKey, string> = {
      plain: `Con cariño,\n${sender}`,
      tender: `Con todo mi corazón,\n${sender}`,
      bright: `Me alegra haberlo dicho,\n${sender}`,
      formal: `Con aprecio,\n${sender}`,
    }
    const occasionOpeners: Record<OccasionKey, string> = {
      thanks: `Quería darte las gracias de una forma que durara más que un mensaje rápido. Como ${relationship}, he visto cuánto de ti pones en las personas y momentos que te rodean.`,
      tribute: `No quiero esperar a tener un discurso perfecto para decirte lo que has significado para mí. Como ${relationship}, he visto partes de tu vida que merecen ser nombradas mientras aún puedes escucharlas.`,
      encouragement: `Sé que esta etapa te ha pedido mucho. Te escribo porque un saludo rápido no sería suficiente, y porque mereces palabras que puedan quedarse cerca cuando el día se ponga pesado.`,
      repair: `He estado pensando en lo que pasó, y quiero escribir con cuidado en lugar de pedirte que cargues con pensamientos incompletos. No escribo para apurarte ni para dirigir tu respuesta.`,
      care: `Veo que has estado cargando más de lo que muchas personas notan. Quería poner palabras alrededor de ese cuidado, no como consejo, sino como testimonio.`,
    }
    const occasionMiddle: Record<OccasionKey, string> = {
      thanks: `El detalle que no quiero perder es este: ${moment} ${impact}`,
      tribute: `El recuerdo que guardo es este: ${moment} ${qualityLine} ${impact}`,
      encouragement: `Cuando pienso en lo que podría ayudarte a sentirte menos solo/a, vuelvo a esto: ${moment} ${qualityLine}`,
      repair: `La parte que necesito asumir es esta: ${moment} ${impact}`,
      care: `Lo que he notado es esto: ${moment} ${qualityLine}`,
    }
    const occasionEndings: Record<OccasionKey, string> = {
      thanks: `${hope} Gracias por la parte de ti que hizo eso posible.`,
      tribute: `${hope} Agradezco poder decir esto ahora, con claridad, sin esperar a que una ocasión haga todo el trabajo.`,
      encouragement: `${hope} No tienes que representar fortaleza para que esta nota sea verdad.`,
      repair: `${hope} Lo siento, y dejaré que mis próximas acciones pesen más que esta carta.`,
      care: `${hope} Espero que también recibas cuidado, descanso y apoyo, no solo elogios por resistir.`,
    }
    return [
      toneOpeners[form.tone],
      occasionOpeners[form.occasion],
      occasionMiddle[form.occasion],
      boundary,
      occasionEndings[form.occasion],
      toneClosers[form.tone],
    ]
      .filter(Boolean)
      .join('\n\n')
  }

  if (language === 'ko') {
    const relationship = compact(form.relationship, '내게 중요한 사람')
    const moment = sentenceFor(
      form.moment,
      '당신을 생각할 때 계속 떠오르는 한 장면이 있습니다',
      language,
    )
    const impact = sentenceFor(
      form.impact,
      '그 일은 그날을 지나가는 제 마음을 바꾸어 주었습니다',
      language,
    )
    const hope = sentenceFor(
      form.hope,
      '당신의 존재가 중요하다는 증거로 이 말을 간직했으면 합니다',
      language,
    )
    const qualityLine =
      qualities.length > 0
        ? `제 마음에 남아 있는 것은 당신의 ${joinQualities(qualities, language)}입니다.`
        : '제 마음에 남아 있는 것은 중요한 순간마다 당신이 보여 주는 고유한 방식입니다.'
    const boundary =
      form.boundary.trim().length > 0
        ? `또 이 경계는 꼭 존중하고 싶습니다: ${sentenceFor(form.boundary, '', language)}`
        : form.occasion === 'repair'
          ? '당신에게 필요한 시간과 거리를 존중하겠습니다. 기다리는 일이 필요하다면 재촉하지 않고 기다리겠습니다.'
          : ''
    const toneOpeners: Record<ToneKey, string> = {
      plain: `${recipient}에게,`,
      tender: `소중한 ${recipient}에게,`,
      bright: `${recipient},`,
      formal: `${recipient}님께,`,
    }
    const toneClosers: Record<ToneKey, string> = {
      plain: `마음을 담아,\n${sender}`,
      tender: `진심을 다해,\n${sender}`,
      bright: `이 말을 전할 수 있어 다행입니다,\n${sender}`,
      formal: `감사의 마음을 담아,\n${sender}`,
    }
    const occasionOpeners: Record<OccasionKey, string> = {
      thanks: `짧은 메시지보다 오래 남을 방식으로 고맙다는 말을 전하고 싶었습니다. ${relationship}로서, 당신이 사람들과 순간들에 얼마나 많은 마음을 쏟는지 보아 왔습니다.`,
      tribute: `완벽한 말이 준비될 때까지 기다리지 않고, 당신이 제게 어떤 의미였는지 지금 말하고 싶습니다. ${relationship}로서, 당신이 직접 들을 수 있을 때 이름 붙여야 할 순간들을 보아 왔습니다.`,
      encouragement: `요즘이 당신에게 많은 것을 요구하고 있다는 것을 압니다. 가벼운 안부만으로는 충분하지 않아서, 무거운 날에도 가까이 둘 수 있는 말을 남기고 싶었습니다.`,
      repair: `그 일을 계속 생각해 왔고, 미완성된 생각을 당신에게 떠넘기기보다 조심스럽게 적고 싶었습니다. 당신의 반응을 서두르게 하거나 조종하려는 마음은 아닙니다.`,
      care: `당신이 많은 사람이 알아차리지 못하는 무게를 지고 있다는 것을 봅니다. 조언이 아니라 증인으로서 그 돌봄에 말을 붙이고 싶었습니다.`,
    }
    const occasionMiddle: Record<OccasionKey, string> = {
      thanks: `제가 잃어버리고 싶지 않은 구체적인 장면은 이것입니다: ${moment} ${impact}`,
      tribute: `제가 간직하고 있는 기억은 이것입니다: ${moment} ${qualityLine} ${impact}`,
      encouragement: `당신이 덜 혼자라고 느끼는 데 무엇이 도움이 될지 생각하면, 저는 이 장면으로 돌아옵니다: ${moment} ${qualityLine}`,
      repair: `제가 책임져야 할 부분은 이것입니다: ${moment} ${impact}`,
      care: `제가 알아차린 것은 이것입니다: ${moment} ${qualityLine}`,
    }
    const occasionEndings: Record<OccasionKey, string> = {
      thanks: `${hope} 그것을 가능하게 해 준 당신의 마음에 감사합니다.`,
      tribute: `${hope} 어떤 특별한 날이 모든 일을 대신해 주기를 기다리지 않고, 지금 분명히 말할 수 있어 감사합니다.`,
      encouragement: `${hope} 이 말이 사실이기 위해 당신이 강한 척할 필요는 없습니다.`,
      repair: `${hope} 미안합니다. 이 편지보다 앞으로의 행동이 더 무겁게 남도록 하겠습니다.`,
      care: `${hope} 견뎌 냈다는 칭찬만이 아니라, 당신도 돌봄과 휴식과 도움을 받기를 바랍니다.`,
    }
    return [
      toneOpeners[form.tone],
      occasionOpeners[form.occasion],
      occasionMiddle[form.occasion],
      boundary,
      occasionEndings[form.occasion],
      toneClosers[form.tone],
    ]
      .filter(Boolean)
      .join('\n\n')
  }

  if (language === 'ja') {
    const relationship = compact(form.relationship, '私にとって大切な人')
    const moment = sentenceFor(
      form.moment,
      'あなたのことを思うたびに戻ってくる場面があります',
      language,
    )
    const impact = sentenceFor(
      form.impact,
      'そのことが、その日を進む私の気持ちを変えてくれました',
      language,
    )
    const hope = sentenceFor(
      form.hope,
      'あなたの存在が大切だという証として、この言葉を持っていてほしいです',
      language,
    )
    const qualityLine =
      qualities.length > 0
        ? `私の中に残っているのは、あなたの${joinQualities(qualities, language)}です。`
        : '私の中に残っているのは、大事な場面でのあなたらしい在り方です。'
    const boundary =
      form.boundary.trim().length > 0
        ? `それから、この境界も大切にしたいです。${sentenceFor(form.boundary, '', language)}`
        : form.occasion === 'repair'
          ? 'あなたに必要な時間と距離を尊重します。待つことが必要なら、急かさずに待ちます。'
          : ''
    const toneOpeners: Record<ToneKey, string> = {
      plain: `${recipient}へ、`,
      tender: `大切な${recipient}へ、`,
      bright: `${recipient}へ、`,
      formal: `${recipient}様、`,
    }
    const toneClosers: Record<ToneKey, string> = {
      plain: `心を込めて、\n${sender}`,
      tender: `心から、\n${sender}`,
      bright: `伝えられてよかった、\n${sender}`,
      formal: `感謝を込めて、\n${sender}`,
    }
    const occasionOpeners: Record<OccasionKey, string> = {
      thanks: `短いメッセージよりも長く残る形で、ありがとうを伝えたいと思いました。${relationship}として、あなたが人や出来事にどれほど心を注いでいるかを見てきました。`,
      tribute: `完璧な言葉がそろうまで待たずに、あなたが私にとってどんな存在だったかを今伝えたいです。${relationship}として、あなたが聞けるうちに名前をつけたい場面を見てきました。`,
      encouragement: `今の時期があなたに多くを求めていることを知っています。軽い声かけだけでは足りない気がして、重い日にもそばに置ける言葉を残したくなりました。`,
      repair: `あのことをずっと考えていました。未完成な思いをあなたに背負わせるのではなく、慎重に書きたいと思います。返事を急がせたり、反応を動かそうとしているわけではありません。`,
      care: `あなたが多くの人に気づかれない重さを担っていることを見ています。助言ではなく、見ている者として、そのケアに言葉を添えたいと思いました。`,
    }
    const occasionMiddle: Record<OccasionKey, string> = {
      thanks: `失いたくない具体的なことがあります。${moment} ${impact}`,
      tribute: `私が持っている記憶はこれです。${moment} ${qualityLine} ${impact}`,
      encouragement: `あなたが少しでも一人ではないと感じるために何が役立つかを考えると、私はこの場面に戻ります。${moment} ${qualityLine}`,
      repair: `私が引き受けるべき部分はこれです。${moment} ${impact}`,
      care: `私が気づいたことはこれです。${moment} ${qualityLine}`,
    }
    const occasionEndings: Record<OccasionKey, string> = {
      thanks: `${hope} それを可能にしてくれたあなたの一部に、ありがとうを伝えたいです。`,
      tribute: `${hope} 特別な日がすべてを代わりにしてくれるのを待たず、今はっきり言えることに感謝しています。`,
      encouragement: `${hope} この言葉が本当であるために、あなたが強いふりをする必要はありません。`,
      repair: `${hope} ごめんなさい。この手紙よりも、これからの行動に重みを持たせます。`,
      care: `${hope} 耐えていることを褒められるだけでなく、あなた自身もケアと休息と支えを受け取れますように。`,
    }
    return [
      toneOpeners[form.tone],
      occasionOpeners[form.occasion],
      occasionMiddle[form.occasion],
      boundary,
      occasionEndings[form.occasion],
      toneClosers[form.tone],
    ]
      .filter(Boolean)
      .join('\n\n')
  }

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
  const qualityLine =
    qualities.length > 0
      ? `What stays with me is your ${joinQualities(qualities, language)}.`
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

  return [
    toneOpeners[form.tone],
    occasionOpeners[form.occasion],
    occasionMiddle[form.occasion],
    boundary,
    occasionEndings[form.occasion],
    toneClosers[form.tone],
  ]
    .filter(Boolean)
    .join('\n\n')
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
  const [finish, setFinish] = useState<KeepsakeFinish>(() =>
    normalizeFinish(readStorage<unknown>(storageKeys.finish, defaultFinish)),
  )
  const [savedNotes, setSavedNotes] = useState<PublishedNote[]>(() =>
    readList(storageKeys.notes, validatePublishedNote),
  )
  const [feedback, setFeedback] = useState<Feedback[]>(() =>
    readList(storageKeys.feedback, validateFeedback),
  )
  const [reservations, setReservations] = useState<Reservation[]>(() =>
    readList(storageKeys.reservations, validateReservation),
  )
  const [reminders, setReminders] = useState<MomentReminder[]>(() =>
    readList(storageKeys.reminders, validateReminder),
  )
  const [profiles, setProfiles] = useState<RecipientProfile[]>(() =>
    readList(storageKeys.profiles, validateProfile),
  )
  const [outreachContacts, setOutreachContacts] = useState<OutreachContact[]>(
    () => readList(storageKeys.outreach, validateOutreachContact),
  )
  const [sharedNote, setSharedNote] = useState<PublishedNote | null>(() =>
    getSharedNoteFromHash(),
  )
  const [secureEnvelope, setSecureEnvelope] =
    useState<EncryptedNoteEnvelope | null>(() => getSecureEnvelopeFromHash())
  const [publishedNote, setPublishedNote] = useState<PublishedNote | null>(
    null,
  )
  const [toast, setToast] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<PlanName>(plans[0].name)
  const [reservationForm, setReservationForm] = useState({
    name: '',
    email: '',
    why: '',
  })
  const [reminderForm, setReminderForm] = useState({
    recipient: '',
    relationship: '',
    occasion: 'tribute' as OccasionKey,
    date: '',
    cadence: 'yearly' as CadenceKey,
    note: '',
  })
  const [profileForm, setProfileForm] = useState({
    name: '',
    relationship: '',
    language: 'en' as LanguageKey,
    tone: 'plain' as ToneKey,
    qualities: '',
    notes: '',
  })
  const [outreachForm, setOutreachForm] = useState({
    name: '',
    channel: '',
    relationship: '',
    moment: '',
    status: 'candidate' as OutreachStatus,
    notes: '',
  })
  const [recipientReply, setRecipientReply] = useState('')
  const [recipientFeeling, setRecipientFeeling] = useState('felt personal')
  const [pilotEvidenceForm, setPilotEvidenceForm] = useState({
    outcome: 'sent',
    delayed: 'yes',
    paidValue: 'maybe',
    trustGap: '',
  })
  const [clearLocalDataArmed, setClearLocalDataArmed] = useState(false)
  const [showReservationPrompt, setShowReservationPrompt] = useState(false)
  const [securePassphrase, setSecurePassphrase] = useState('')
  const [secureShareUrl, setSecureShareUrl] = useState('')
  const [isSecuring, setIsSecuring] = useState(false)
  const [unlockPassphrase, setUnlockPassphrase] = useState('')
  const [unlockError, setUnlockError] = useState('')
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [protectedSourceUrl, setProtectedSourceUrl] = useState('')

  const quality = useMemo(() => getQuality(form, draft), [form, draft])
  const todayIso = useMemo(() => toLocalDateIso(new Date()), [])
  const orderedReminders = useMemo(
    () =>
      [...reminders].sort(
        (left, right) =>
          getReminderTiming(left, todayIso).days -
          getReminderTiming(right, todayIso).days,
      ),
    [reminders, todayIso],
  )
  const outreachMetrics = useMemo(() => {
    const byStatus = Object.fromEntries(
      (Object.keys(outreachStatuses) as OutreachStatus[]).map((status) => [
        status,
        0,
      ]),
    ) as Record<OutreachStatus, number>

    outreachContacts.forEach((contact) => {
      byStatus[contact.status] += 1
    })

    const reached =
      byStatus.invited + byStatus.trying + byStatus.used + byStatus.reserved
    const crediblePilots = byStatus.used + byStatus.reserved
    const target = 20

    return {
      byStatus,
      reached,
      crediblePilots,
      target,
      remaining: Math.max(0, target - outreachContacts.length),
    }
  }, [outreachContacts])
  const configuredCheckoutPlans = useMemo(
    () => plans.filter((plan) => getConfiguredCheckoutBase(plan.name)).length,
    [],
  )
  const selectedCheckoutUrl = useMemo(
    () => getCheckoutUrl(selectedPlan, `pricing-${selectedPlan.toLowerCase()}`),
    [selectedPlan],
  )
  const publishedCheckoutUrl = useMemo(
    () =>
      publishedNote
        ? getCheckoutUrl(selectedPlan, `note-${publishedNote.id}`)
        : '',
    [publishedNote, selectedPlan],
  )
  const hasDraftData = Boolean(
    draft.trim() ||
      form.recipient.trim() ||
      form.sender.trim() ||
      form.relationship.trim() ||
      form.moment.trim() ||
      form.qualities.trim() ||
      form.impact.trim() ||
      form.hope.trim() ||
      form.boundary.trim() ||
      form.deliveryDate.trim(),
  )
  const localDataSummary = useMemo(
    () => [
      {
        label: 'Studio draft',
        count: hasDraftData ? 1 : 0,
        detail: 'Current form fields and editable draft',
      },
      {
        label: 'Keepsakes',
        count: savedNotes.length,
        detail: 'Saved local note pages and link payloads',
      },
      {
        label: 'Feedback',
        count: feedback.length,
        detail: 'Sender, recipient, and pilot evidence signals',
      },
      {
        label: 'Reservations',
        count: reservations.length,
        detail: 'Local paid-intent records',
      },
      {
        label: 'People',
        count: profiles.length,
        detail: 'Recipient context saved in this browser',
      },
      {
        label: 'Planner',
        count: reminders.length,
        detail: 'Local meaningful-send reminders',
      },
      {
        label: 'Outreach',
        count: outreachContacts.length,
        detail: 'Pilot target names and channels kept out of export',
      },
    ],
    [
      feedback.length,
      hasDraftData,
      outreachContacts.length,
      profiles.length,
      reminders.length,
      reservations.length,
      savedNotes.length,
    ],
  )
  const localDataRecordCount = localDataSummary.reduce(
    (total, item) => total + item.count,
    0,
  )

  useEffect(() => {
    writeStorage(storageKeys.form, form)
  }, [form])

  useEffect(() => {
    writeStorage(storageKeys.draft, draft)
  }, [draft])

  useEffect(() => {
    writeStorage(storageKeys.finish, finish)
  }, [finish])

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
    writeStorage(storageKeys.reminders, reminders)
  }, [reminders])

  useEffect(() => {
    writeStorage(storageKeys.profiles, profiles)
  }, [profiles])

  useEffect(() => {
    writeStorage(storageKeys.outreach, outreachContacts)
  }, [outreachContacts])

  useEffect(() => {
    const onHashChange = () => {
      setSharedNote(getSharedNoteFromHash())
      setSecureEnvelope(getSecureEnvelopeFromHash())
      setUnlockError('')
      if (window.location.hash.startsWith('#note=')) setProtectedSourceUrl('')
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    if (
      !window.location.hash ||
      window.location.hash.startsWith('#note=') ||
      window.location.hash.startsWith('#secure=')
    ) {
      return
    }
    const id = window.location.hash.slice(1)
    const scrollToAnchor = () => {
      document.getElementById(id)?.scrollIntoView()
    }
    window.requestAnimationFrame(scrollToAnchor)
    const timeout = window.setTimeout(scrollToAnchor, 250)
    return () => window.clearTimeout(timeout)
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

  function loadMomentPack(pack: MomentPack) {
    setForm((current) => ({
      ...current,
      occasion: pack.occasion,
      tone: pack.tone,
      relationship: pack.starter.relationship,
      moment: pack.starter.moment,
      qualities: pack.starter.qualities,
      impact: pack.starter.impact,
      hope: pack.starter.hope,
      boundary: pack.starter.boundary,
    }))
    setDraft('')
    window.history.replaceState(null, '', '#studio')
    document.getElementById('studio')?.scrollIntoView()
    setToast(`${pack.title} loaded. Replace the starter details.`)
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
      finish,
    }

    const payload = encodeNote(note)
    window.history.replaceState(null, '', `#note=${payload}`)
    setPublishedNote(note)
    setSavedNotes((current) => [note, ...current].slice(0, 12))
    setShowReservationPrompt(false)
    setSecurePassphrase('')
    setSecureShareUrl('')
    setProtectedSourceUrl('')
    setPilotEvidenceForm({
      outcome: 'sent',
      delayed: 'yes',
      paidValue: 'maybe',
      trustGap: '',
    })
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

  function getSecureShareUrl(envelope: EncryptedNoteEnvelope) {
    return `${window.location.origin}${window.location.pathname}#secure=${encodeEncryptedEnvelope(
      envelope,
    )}`
  }

  async function createSecureShareLink(note: PublishedNote) {
    if (securePassphrase.trim().length < 8) {
      setToast('Use at least 8 characters')
      return
    }
    if (!window.crypto?.subtle) {
      setToast('Protected links need browser crypto support')
      return
    }

    setIsSecuring(true)
    try {
      const envelope = await encryptNote(note, securePassphrase)
      const url = getSecureShareUrl(envelope)
      setSecureShareUrl(url)
      try {
        await navigator.clipboard.writeText(url)
        setToast('Protected link copied')
      } catch {
        setToast('Protected link ready')
      }
    } catch {
      setToast('Protected link failed')
    } finally {
      setIsSecuring(false)
    }
  }

  async function unlockSecureNote() {
    if (!secureEnvelope || !unlockPassphrase.trim()) return
    setIsUnlocking(true)
    setUnlockError('')
    try {
      const note = await decryptNote(secureEnvelope, unlockPassphrase)
      if (!note) throw new Error('Invalid note')
      setProtectedSourceUrl(window.location.href)
      setSharedNote(note)
      setSecureEnvelope(null)
      setUnlockPassphrase('')
    } catch {
      setUnlockError('That passphrase did not unlock this keepsake.')
    } finally {
      setIsUnlocking(false)
    }
  }

  function getReservationSummary(note: PublishedNote) {
    const checkoutConfigured = Boolean(
      getCheckoutUrl(selectedPlan, `note-${note.id}`),
    )

    return [
      'Keepsent public-safe paid-intent summary',
      `Moment type: ${occasions[note.occasion].label}`,
      `Draft language: ${languages[note.language].label}`,
      `Selected plan: ${selectedPlan}`,
      `Checkout mode: ${checkoutConfigured ? 'checkout link configured' : 'reservation only'}`,
      'Private note text, names, share links, and contact details intentionally omitted.',
      'Worth paying because: [replace with a broad, non-private reason]',
    ].join('\n')
  }

  function getPilotFeedbackSummary(note: PublishedNote) {
    return [
      'Keepsent public-safe pilot summary',
      `Moment type: ${occasions[note.occasion].label}`,
      `Draft language: ${languages[note.language].label}`,
      `Finish: ${finishes[note.finish.style].label}`,
      `Outcome: ${pilotEvidenceForm.outcome}`,
      `Did it help me say something I would have delayed? ${pilotEvidenceForm.delayed}`,
      `Would this moment have been worth $7? ${pilotEvidenceForm.paidValue}`,
      pilotEvidenceForm.trustGap.trim()
        ? `Trust gap or improvement: ${pilotEvidenceForm.trustGap.trim()}`
        : '',
      'Private note text, names, share links, and contact details intentionally omitted.',
    ]
      .filter(Boolean)
      .join('\n')
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

  function getKeepsakeHeading(note: PublishedNote) {
    return compact(note.finish.heading, note.title)
  }

  function downloadKeepsakePage(note: PublishedNote) {
    const heading = getKeepsakeHeading(note)
    const paragraphs = note.body
      .split(/\n\n+/)
      .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
      .join('\n')
    const html = `<!doctype html>
<html lang="${note.language}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(heading)}</title>
  <style>
    body { margin: 0; background: #f7f3ea; color: #28251f; font-family: Georgia, serif; }
    main { max-width: 780px; margin: 40px auto; padding: 56px; background: #fffdf8; border: 1px solid #d9d2c3; }
    main.card { background: linear-gradient(180deg, #fffdf8, #f7efe4); border-color: #d9b7a8; }
    main.tribute { background: linear-gradient(180deg, #fffdf8, #ebefe0); border-color: #aebba5; }
    .meta { display: flex; justify-content: space-between; gap: 16px; color: #52614d; font: 700 12px system-ui; text-transform: uppercase; }
    h1 { margin: 28px 0; font-size: 48px; line-height: 1; }
    main.card h1 { color: #9d4f3f; }
    main.tribute h1 { color: #52614d; }
    p { font-size: 21px; line-height: 1.72; }
    @media print { body { background: white; } main { margin: 0; border: 0; box-shadow: none; } }
  </style>
</head>
<body>
  <main class="${note.finish.style}">
    <div class="meta">
      <span>${escapeHtml(occasions[note.occasion].label)}</span>
      <span>${escapeHtml(finishes[note.finish.style].label)}</span>
      <span>${escapeHtml(new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(note.createdAt)))}</span>
    </div>
    <h1>${escapeHtml(heading)}</h1>
    ${paragraphs}
  </main>
</body>
</html>`
    downloadText(`${heading}.html`, html)
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

  function savePilotEvidence(note: PublishedNote) {
    saveFeedback(
      `pilot-evidence: ${pilotEvidenceForm.outcome}`,
      [
        `Delayed-send help: ${pilotEvidenceForm.delayed}`,
        `Worth $7: ${pilotEvidenceForm.paidValue}`,
        pilotEvidenceForm.trustGap.trim()
          ? `Trust gap: ${pilotEvidenceForm.trustGap.trim()}`
          : '',
      ]
        .filter(Boolean)
        .join('\n'),
      note.id,
    )
    if (pilotEvidenceForm.paidValue !== 'no') setShowReservationPrompt(true)
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

  function saveOutreachContact() {
    const next: OutreachContact = {
      id: makeId('pilot'),
      createdAt: new Date().toISOString(),
      ...outreachForm,
      name: outreachForm.name.trim(),
    }
    setOutreachContacts((current) => [
      next,
      ...current.filter(
        (contact) =>
          contact.name.trim().toLowerCase() !==
          next.name.trim().toLowerCase(),
      ),
    ].slice(0, 60))
    setOutreachForm({
      name: '',
      channel: '',
      relationship: '',
      moment: '',
      status: 'candidate',
      notes: '',
    })
    setToast('Pilot target saved locally')
  }

  function updateOutreachStatus(id: string, status: OutreachStatus) {
    setOutreachContacts((current) =>
      current.map((contact) =>
        contact.id === id ? { ...contact, status } : contact,
      ),
    )
    setToast(`${outreachStatuses[status].label} saved`)
  }

  function deleteOutreachContact(id: string) {
    setOutreachContacts((current) =>
      current.filter((contact) => contact.id !== id),
    )
    setToast('Pilot target removed')
  }

  function saveReminder() {
    const next: MomentReminder = {
      id: makeId('reminder'),
      createdAt: new Date().toISOString(),
      ...reminderForm,
    }
    setReminders((current) => [next, ...current].slice(0, 30))
    setReminderForm({
      recipient: '',
      relationship: '',
      occasion: 'tribute',
      date: '',
      cadence: 'yearly',
      note: '',
    })
    setToast('Moment planned locally')
  }

  function loadReminder(reminder: MomentReminder) {
    setForm((current) => ({
      ...current,
      recipient: reminder.recipient,
      relationship: reminder.relationship || current.relationship,
      occasion: reminder.occasion,
      deliveryDate: getNextReminderDate(reminder, todayIso),
    }))
    setDraft('')
    window.history.replaceState(null, '', '#studio')
    document.getElementById('studio')?.scrollIntoView()
    setToast(`${reminder.recipient} loaded into the studio`)
  }

  function deleteReminder(id: string) {
    setReminders((current) => current.filter((reminder) => reminder.id !== id))
    setToast('Moment removed')
  }

  function seedProfileFromStudio() {
    setProfileForm({
      name: form.recipient,
      relationship: form.relationship,
      language: form.language,
      tone: form.tone,
      qualities: form.qualities,
      notes: form.boundary,
    })
    setToast('Studio details copied into People')
  }

  function saveProfile() {
    const next: RecipientProfile = {
      id: makeId('person'),
      createdAt: new Date().toISOString(),
      ...profileForm,
    }
    setProfiles((current) => [
      next,
      ...current.filter(
        (profile) =>
          profile.name.trim().toLowerCase() !==
          next.name.trim().toLowerCase(),
      ),
    ].slice(0, 40))
    setProfileForm({
      name: '',
      relationship: '',
      language: 'en',
      tone: 'plain',
      qualities: '',
      notes: '',
    })
    setToast('Person saved locally')
  }

  function loadProfile(profile: RecipientProfile) {
    setForm((current) => ({
      ...current,
      recipient: profile.name,
      relationship: profile.relationship,
      language: profile.language,
      tone: profile.tone,
      qualities: profile.qualities,
      boundary: profile.notes,
    }))
    setDraft('')
    window.history.replaceState(null, '', '#studio')
    document.getElementById('studio')?.scrollIntoView()
    setToast(`${profile.name} loaded into the studio`)
  }

  function deleteProfile(id: string) {
    setProfiles((current) => current.filter((profile) => profile.id !== id))
    setToast('Person removed')
  }

  function exportCompanyData() {
    downloadText(
      'keepsent-company-data.json',
      JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          localDataSummary,
          savedNotes,
          feedback,
          reservations,
          reminders,
          profiles,
          outreachSummary: outreachMetrics,
        },
        null,
        2,
      ),
    )
  }

  function getTrustReceipt() {
    return [
      'Keepsent trust receipt',
      '',
      'Storage: browser local storage on this device. No account, backend, or model API is required for the current MVP.',
      'Simple share links: note content is encoded in the URL, so anyone with the URL can read it.',
      'Protected share links: note content is encrypted in the URL with a passphrase before sharing. Keepsent cannot recover the passphrase.',
      'Public feedback: do not paste note text, share links, names, contact details, or sensitive facts into GitHub issues.',
      'Checkout: hosted payment links can be configured, but checkout metadata must not include private note content or recipient identity.',
      '',
      `This browser currently has ${localDataRecordCount} Keepsent local record${localDataRecordCount === 1 ? '' : 's'} across:`,
      ...localDataSummary.map(
        (item) => `- ${item.label}: ${item.count} (${item.detail})`,
      ),
      '',
      'Controls: export a local snapshot, copy this receipt, or clear Keepsent local data from the Company section.',
    ].join('\n')
  }

  function clearLocalData() {
    Object.values(storageKeys).forEach((key) => {
      window.localStorage.removeItem(key)
    })
    setForm(defaultForm)
    setDraft('')
    setFinish(defaultFinish)
    setSavedNotes([])
    setFeedback([])
    setReservations([])
    setReminders([])
    setProfiles([])
    setOutreachContacts([])
    setPublishedNote(null)
    setSecurePassphrase('')
    setSecureShareUrl('')
    setReservationForm({ name: '', email: '', why: '' })
    setReminderForm({
      recipient: '',
      relationship: '',
      occasion: 'tribute',
      date: '',
      cadence: 'yearly',
      note: '',
    })
    setProfileForm({
      name: '',
      relationship: '',
      language: 'en',
      tone: 'plain',
      qualities: '',
      notes: '',
    })
    setOutreachForm({
      name: '',
      channel: '',
      relationship: '',
      moment: '',
      status: 'candidate',
      notes: '',
    })
    setPilotEvidenceForm({
      outcome: 'sent',
      delayed: 'yes',
      paidValue: 'maybe',
      trustGap: '',
    })
    setClearLocalDataArmed(false)
    setShowReservationPrompt(false)
    setToast('Keepsent local data cleared')
  }

  function clearSharedNote() {
    window.history.replaceState(null, '', window.location.pathname)
    setSharedNote(null)
    setSecureEnvelope(null)
    setPublishedNote(null)
    setUnlockPassphrase('')
    setUnlockError('')
    setProtectedSourceUrl('')
  }

  if (secureEnvelope && !sharedNote) {
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

        <form
          className="unlock-panel"
          onSubmit={(event) => {
            event.preventDefault()
            void unlockSecureNote()
          }}
        >
          <p className="eyebrow">
            <LockKeyhole size={16} />
            Protected keepsake
          </p>
          <h1>Passphrase required</h1>
          <p className="microcopy">
            The note is encrypted in this link. The passphrase is checked on
            this device and is not sent to Keepsent.
          </p>
          <label>
            Passphrase
            <input
              type="password"
              value={unlockPassphrase}
              onChange={(event) => setUnlockPassphrase(event.target.value)}
              autoComplete="current-password"
            />
          </label>
          {unlockError && <p className="error-text">{unlockError}</p>}
          <button
            className="primary-button"
            type="submit"
            disabled={!unlockPassphrase.trim() || isUnlocking}
          >
            <LockKeyhole size={17} />
            {isUnlocking ? 'Unlocking' : 'Unlock'}
          </button>
        </form>
        {toast && <div className="toast">{toast}</div>}
      </main>
    )
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

        <article className={`keepsake-sheet finish-${sharedNote.finish.style}`}>
          <div className="keepsake-meta">
            <span>{occasions[sharedNote.occasion].label}</span>
            <span>{languages[sharedNote.language].native}</span>
            <span>{finishes[sharedNote.finish.style].label}</span>
            <span>
              {new Intl.DateTimeFormat(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }).format(new Date(sharedNote.createdAt))}
            </span>
          </div>
          <h1>{getKeepsakeHeading(sharedNote)}</h1>
          <pre>{sharedNote.body}</pre>
          <div className="shared-actions">
            <button
              type="button"
              className="icon-button"
              onClick={() =>
                copyText(
                  protectedSourceUrl || getShareUrl(sharedNote),
                  protectedSourceUrl ? 'Protected link copied' : 'Share link copied',
                )
              }
            >
              <LinkIcon size={17} />
              {protectedSourceUrl ? 'Protected link' : 'Link'}
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
              Text
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={() => downloadKeepsakePage(sharedNote)}
            >
              <FileText size={17} />
              Page
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
          <a href="#packs">Packs</a>
          <a href="#studio">Studio</a>
          <a href="#people">People</a>
          <a href="#planner">Planner</a>
          <a href="#pricing">Pricing</a>
          <a href="#pilot">Pilot</a>
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

        <section className="packs-band" id="packs">
          <div className="section-heading">
            <p className="eyebrow">
              <Gift size={16} />
              Moment packs
            </p>
            <h2>Digital products for moments people already care about</h2>
            <p>
              Each pack loads a focused starter into the studio. The starter is
              intentionally broad; the value comes when the sender replaces it
              with the real memory, impact, and hope.
            </p>
          </div>

          <div className="pack-grid">
            {momentPacks.map((pack) => (
              <article className="pack-card" key={pack.title}>
                <div>
                  <p className="eyebrow">{pack.label}</p>
                  <h3>{pack.title}</h3>
                  <p>{pack.promise}</p>
                </div>
                <dl>
                  <div>
                    <dt>For</dt>
                    <dd>{pack.audience}</dd>
                  </div>
                  <div>
                    <dt>Signal</dt>
                    <dd>{pack.priceSignal}</dd>
                  </div>
                </dl>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => loadMomentPack(pack)}
                >
                  <PenLine size={17} />
                  Load starter
                </button>
              </article>
            ))}
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
                <legend>Draft language</legend>
                <div className="language-row">
                  {(Object.keys(languages) as LanguageKey[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      className={form.language === key ? 'selected' : ''}
                      onClick={() => updateForm('language', key)}
                    >
                      <span>{languages[key].native}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

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
                      setFinish(defaultFinish)
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
                  <span>{languages[form.language].native}</span>
                  <span>{occasions[form.occasion].short}</span>
                  <span>{finishes[finish.style].label} finish</span>
                </div>

              {quality.missing.length > 0 && (
                <div className="gap-list">
                  {quality.missing.slice(0, 3).map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                  </div>
                )}

                <fieldset className="finish-panel">
                  <legend>Keepsake finish</legend>
                  <div className="finish-grid">
                    {(Object.keys(finishes) as FinishKey[]).map((key) => (
                      <button
                        key={key}
                        type="button"
                        className={finish.style === key ? 'selected' : ''}
                        onClick={() =>
                          setFinish((current) => ({ ...current, style: key }))
                        }
                      >
                        <span>{finishes[key].label}</span>
                        <small>{finishes[key].hint}</small>
                      </button>
                    ))}
                  </div>
                  <label>
                    Keepsake heading
                    <input
                      value={finish.heading}
                      onChange={(event) =>
                        setFinish((current) => ({
                          ...current,
                          heading: event.target.value,
                        }))
                      }
                      placeholder="Optional title for the finished page"
                    />
                  </label>
                </fieldset>

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
                  <div className="published-content">
                    <strong>Private keepsake ready</strong>
                    <button
                      type="button"
                      onClick={() => {
                        setProtectedSourceUrl('')
                        setSharedNote(publishedNote)
                      }}
                    >
                      Open keepsake page
                    </button>
                    <p className="trust-receipt">
                      Simple links are readable by anyone with the URL.
                      Protected links encrypt the note behind a passphrase.
                      Never paste either link into public feedback.
                    </p>

                    <div className="trust-preflight">
                      <p className="eyebrow">
                        <ShieldCheck size={14} />
                        Trust preflight
                      </p>
                      <p>
                        This browser has {localDataRecordCount} Keepsent local
                        records. Use a protected link for sensitive notes, keep
                        the passphrase separate, and export only as a private
                        archive.
                      </p>
                      <div className="button-row">
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={() =>
                            copyText(getTrustReceipt(), 'Trust receipt copied')
                          }
                        >
                          <Copy size={16} />
                          Copy receipt
                        </button>
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={exportCompanyData}
                        >
                          <Download size={16} />
                          Export archive
                        </button>
                      </div>
                    </div>

                    <div className="secure-link-panel">
                      <p className="eyebrow">
                        <LockKeyhole size={14} />
                        Protected link recommended
                      </p>
                      <label>
                        Passphrase
                        <input
                          type="password"
                          value={securePassphrase}
                          onChange={(event) =>
                            setSecurePassphrase(event.target.value)
                          }
                          placeholder="At least 8 characters"
                          autoComplete="new-password"
                        />
                      </label>
                      <div className="button-row">
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={() => void createSecureShareLink(publishedNote)}
                          disabled={
                            securePassphrase.trim().length < 8 || isSecuring
                          }
                        >
                          <LockKeyhole size={16} />
                          {isSecuring ? 'Protecting' : 'Create protected link'}
                        </button>
                        {secureShareUrl && (
                          <button
                            className="secondary-button"
                            type="button"
                            onClick={() =>
                              copyText(secureShareUrl, 'Protected link copied')
                            }
                          >
                            <Copy size={16} />
                            Copy protected link
                          </button>
                        )}
                      </div>
                      <p className="microcopy">
                        Share the passphrase separately. Keepsent cannot recover
                        it.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        copyText(getShareUrl(publishedNote), 'Simple link copied')
                      }
                    >
                      Copy simple link
                    </button>

                    <div className="pilot-handoff">
                      <p className="eyebrow">
                        <MessageCircle size={14} />
                        Report this send
                      </p>
                      <p>
                        Prepare public-safe evidence before opening GitHub. Do
                        not include note text, names, links, or contact details.
                      </p>
                      <div className="field-row">
                        <label>
                          Outcome
                          <select
                            value={pilotEvidenceForm.outcome}
                            onChange={(event) =>
                              setPilotEvidenceForm((current) => ({
                                ...current,
                                outcome: event.target.value,
                              }))
                            }
                          >
                            {[
                              'sent',
                              'saved',
                              'protected link',
                              'printed',
                              'still editing',
                            ].map((outcome) => (
                              <option key={outcome} value={outcome}>
                                {outcome}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Worth $7?
                          <select
                            value={pilotEvidenceForm.paidValue}
                            onChange={(event) =>
                              setPilotEvidenceForm((current) => ({
                                ...current,
                                paidValue: event.target.value,
                              }))
                            }
                          >
                            {['yes', 'maybe', 'no'].map((value) => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <fieldset>
                        <legend>Helped with a delayed send?</legend>
                        <div className="reply-options compact">
                          {['yes', 'maybe', 'no'].map((value) => (
                            <button
                              key={value}
                              className={
                                pilotEvidenceForm.delayed === value
                                  ? 'selected'
                                  : ''
                              }
                              type="button"
                              onClick={() =>
                                setPilotEvidenceForm((current) => ({
                                  ...current,
                                  delayed: value,
                                }))
                              }
                            >
                              {value}
                            </button>
                          ))}
                        </div>
                      </fieldset>
                      <label>
                        Trust gap or improvement
                        <textarea
                          value={pilotEvidenceForm.trustGap}
                          onChange={(event) =>
                            setPilotEvidenceForm((current) => ({
                              ...current,
                              trustGap: event.target.value,
                            }))
                          }
                          placeholder="Broad, public-safe feedback only"
                        />
                      </label>
                      <div className="button-row">
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={() => savePilotEvidence(publishedNote)}
                        >
                          <Save size={16} />
                          Save evidence
                        </button>
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={() =>
                            copyText(
                              getPilotFeedbackSummary(publishedNote),
                              'Pilot summary copied',
                            )
                          }
                        >
                          <Copy size={16} />
                          Copy evidence
                        </button>
                        <a
                          className="secondary-button"
                          href={pilotFeedbackUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink size={16} />
                          Open feedback form
                        </a>
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={seedProfileFromStudio}
                          disabled={!form.recipient.trim()}
                        >
                          <Users size={16} />
                          Save this person
                        </button>
                      </div>
                    </div>

                    {showReservationPrompt && (
                      <div className="reservation-nudge">
                        <p>
                          If that value is real, copy a public-safe summary and
                          {publishedCheckoutUrl
                            ? ' continue to checkout.'
                            : ' open the founding reservation form.'}
                        </p>
                        <div className="button-row">
                          <button
                            className="secondary-button"
                            type="button"
                            onClick={() =>
                              copyText(
                                getReservationSummary(publishedNote),
                                'Reservation summary copied',
                              )
                            }
                          >
                            <Copy size={16} />
                            Copy summary
                          </button>
                          {publishedCheckoutUrl ? (
                            <a
                              className="primary-button"
                              href={publishedCheckoutUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <CreditCard size={16} />
                              Open checkout
                            </a>
                          ) : (
                            <a
                              className="secondary-button"
                              href={foundingReservationUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <ExternalLink size={16} />
                              Open form
                            </a>
                          )}
                        </div>
                      </div>
                    )}
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

        <section className="people-band" id="people">
          <div className="section-heading">
            <p className="eyebrow">
              <Users size={16} />
              People book
            </p>
            <h2>Keep context for the people you write to again</h2>
            <p>
              Save recipient context locally so the next birthday, repair note,
              or care check-in starts with the relationship already remembered.
            </p>
            <p className="trust-note">
              Saved only in this browser; export or delete anytime.
            </p>
          </div>

          <div className="people-grid">
            <form
              className="profile-panel"
              onSubmit={(event) => {
                event.preventDefault()
                saveProfile()
              }}
            >
              <div className="field-row">
                <label>
                  Person or group
                  <input
                    value={profileForm.name}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Maya, Dad, the care team"
                  />
                </label>
                <label>
                  Relationship
                  <input
                    value={profileForm.relationship}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        relationship: event.target.value,
                      }))
                    }
                    placeholder="my mentor, our neighbor, my older sister"
                  />
                </label>
              </div>

              <div className="field-row">
                <label>
                  Default language
                  <select
                    value={profileForm.language}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        language: event.target.value as LanguageKey,
                      }))
                    }
                  >
                    {(Object.keys(languages) as LanguageKey[]).map((key) => (
                      <option key={key} value={key}>
                        {languages[key].label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Default tone
                  <select
                    value={profileForm.tone}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        tone: event.target.value as ToneKey,
                      }))
                    }
                  >
                    {(Object.keys(tones) as ToneKey[]).map((key) => (
                      <option key={key} value={key}>
                        {tones[key].label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                Qualities to remember
                <textarea
                  value={profileForm.qualities}
                  onChange={(event) =>
                    setProfileForm((current) => ({
                      ...current,
                      qualities: event.target.value,
                    }))
                  }
                  placeholder="dry humor, patience, courage, the way they notice details"
                />
              </label>

              <label>
                Private context
                <textarea
                  value={profileForm.notes}
                  onChange={(event) =>
                    setProfileForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="Boundaries, care notes, phrases to avoid, or what matters to them"
                />
              </label>

              <div className="button-row">
                <button
                  className="primary-button"
                  type="submit"
                  disabled={!profileForm.name.trim()}
                >
                  <Save size={17} />
                  Save person
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={seedProfileFromStudio}
                  disabled={!form.recipient.trim()}
                >
                  <Copy size={17} />
                  Use studio details
                </button>
              </div>
            </form>

            <div className="profile-list" aria-label="Saved people">
              {profiles.length === 0 ? (
                <p className="empty-state">
                  No people saved yet. Save one recipient whose future moments
                  should not start from a blank page.
                </p>
              ) : (
                profiles.map((profile) => (
                  <article className="profile-card" key={profile.id}>
                    <div>
                      <p className="eyebrow">
                        {languages[profile.language].label} -{' '}
                        {tones[profile.tone].label}
                      </p>
                      <h3>{profile.name}</h3>
                      <p>{profile.relationship || 'Relationship not set yet'}</p>
                      <p>
                        {profile.qualities ||
                          profile.notes ||
                          'Add qualities and private context as you learn what helps.'}
                      </p>
                    </div>
                    <div className="note-actions">
                      <button
                        className="icon-button"
                        type="button"
                        onClick={() => loadProfile(profile)}
                      >
                        <PenLine size={16} />
                        Load studio
                      </button>
                      <button
                        className="icon-button"
                        type="button"
                        onClick={() => deleteProfile(profile.id)}
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
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
                        setProtectedSourceUrl('')
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

        <section className="planner-band" id="planner">
          <div className="section-heading">
            <p className="eyebrow">
              <CalendarDays size={16} />
              Moment planner
            </p>
            <h2>Plan the words before the moment passes</h2>
            <p>
              Save birthdays, repair windows, caregiver check-ins, and legacy
              moments locally. When a reminder is close, load the studio and
              write with context already in place.
            </p>
          </div>

          <div className="planner-grid">
            <form
              className="planner-panel"
              onSubmit={(event) => {
                event.preventDefault()
                saveReminder()
              }}
            >
              <div className="field-row">
                <label>
                  Recipient or group
                  <input
                    value={reminderForm.recipient}
                    onChange={(event) =>
                      setReminderForm((current) => ({
                        ...current,
                        recipient: event.target.value,
                      }))
                    }
                    placeholder="Mom, the care team, Jordan"
                  />
                </label>
                <label>
                  Date
                  <input
                    type="date"
                    value={reminderForm.date}
                    onChange={(event) =>
                      setReminderForm((current) => ({
                        ...current,
                        date: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <label>
                Relationship context
                <input
                  value={reminderForm.relationship}
                  onChange={(event) =>
                    setReminderForm((current) => ({
                      ...current,
                      relationship: event.target.value,
                    }))
                  }
                  placeholder="my parent, our neighbor, a friend in a hard season"
                />
              </label>

              <div className="field-row">
                <label>
                  Moment type
                  <select
                    value={reminderForm.occasion}
                    onChange={(event) =>
                      setReminderForm((current) => ({
                        ...current,
                        occasion: event.target.value as OccasionKey,
                      }))
                    }
                  >
                    {(Object.keys(occasions) as OccasionKey[]).map((key) => (
                      <option key={key} value={key}>
                        {occasions[key].label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Cadence
                  <select
                    value={reminderForm.cadence}
                    onChange={(event) =>
                      setReminderForm((current) => ({
                        ...current,
                        cadence: event.target.value as CadenceKey,
                      }))
                    }
                  >
                    {(Object.keys(cadences) as CadenceKey[]).map((key) => (
                      <option key={key} value={key}>
                        {cadences[key].label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                Private prompt
                <textarea
                  value={reminderForm.note}
                  onChange={(event) =>
                    setReminderForm((current) => ({
                      ...current,
                      note: event.target.value,
                    }))
                  }
                  placeholder="The small thing I do not want to forget to name..."
                />
              </label>

              <button
                className="primary-button"
                type="submit"
                disabled={!reminderForm.recipient.trim() || !reminderForm.date}
              >
                <CalendarDays size={17} />
                Save moment
              </button>
            </form>

            <div className="reminder-list" aria-label="Planned moments">
              {orderedReminders.length === 0 ? (
                <p className="empty-state">
                  No planned moments yet. Add one date that would be painful to
                  miss.
                </p>
              ) : (
                orderedReminders.map((reminder) => {
                  const timing = getReminderTiming(reminder, todayIso)
                  return (
                    <article className="reminder-card" key={reminder.id}>
                      <div>
                        <p className="eyebrow">
                          {cadences[reminder.cadence].label} -{' '}
                          {occasions[reminder.occasion].label}
                        </p>
                        <h3>{reminder.recipient}</h3>
                        <p>
                          <strong>{timing.label}</strong>
                          {timing.nextDate !== reminder.date
                            ? ` - next ${timing.nextDate}`
                            : ''}
                        </p>
                        <p>
                          {reminder.note ||
                            reminder.relationship ||
                            cadences[reminder.cadence].hint}
                        </p>
                      </div>
                      <div className="note-actions">
                        <button
                          className="icon-button"
                          type="button"
                          onClick={() => loadReminder(reminder)}
                        >
                          <PenLine size={16} />
                          Load studio
                        </button>
                        <button
                          className="icon-button"
                          type="button"
                          onClick={() => deleteReminder(reminder.id)}
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </article>
                  )
                })
              )}
            </div>
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
            {plans.map((plan) => {
              const checkoutUrl = getCheckoutUrl(
                plan.name,
                `pricing-${plan.name.toLowerCase()}`,
              )
              const checkoutReady = Boolean(checkoutUrl)

              return (
                <article
                  className={
                    selectedPlan === plan.name ? 'plan-card selected' : 'plan-card'
                  }
                  key={plan.name}
                >
                  <div className="plan-topline">
                    <h3>{plan.name}</h3>
                    <span>{plan.price}</span>
                  </div>
                  <p>{plan.cadence}</p>
                  <p>{plan.audience}</p>
                  <p
                    className={
                      checkoutReady
                        ? 'checkout-badge checkout-ready'
                        : 'checkout-badge'
                    }
                  >
                    {checkoutReady ? 'Checkout ready' : 'Reservation mode'}
                  </p>
                  <ul>
                    {plan.features.map((feature) => (
                      <li key={feature}>
                        <CheckCircle2 size={16} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="plan-actions">
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => setSelectedPlan(plan.name)}
                    >
                      <CreditCard size={17} />
                      Select
                    </button>
                    {checkoutReady ? (
                      <a
                        className="primary-button"
                        href={checkoutUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink size={17} />
                        Checkout
                      </a>
                    ) : (
                      <a
                        className="secondary-button"
                        href={foundingReservationUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink size={17} />
                        Reserve
                      </a>
                    )}
                  </div>
                </article>
              )
            })}
          </div>

          <div className="checkout-panel">
            <div>
              <p className="eyebrow">
                <ShieldCheck size={16} />
                Checkout path
              </p>
              <h3>
                {configuredCheckoutPlans > 0
                  ? `${configuredCheckoutPlans} plan checkout ${
                      configuredCheckoutPlans === 1 ? 'link is' : 'links are'
                    } configured`
                  : 'Reservation mode until checkout links are configured'}
              </h3>
              <p>
                Keepsent can route paid users to hosted checkout links and append
                non-private reference parameters for reconciliation. Without
                configured links, the product collects founding reservations
                instead of pretending payment is live.
              </p>
            </div>
            <div className="checkout-actions">
              {selectedCheckoutUrl ? (
                <a
                  className="primary-button"
                  href={selectedCheckoutUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <CreditCard size={17} />
                  Open {selectedPlan} checkout
                </a>
              ) : (
                <a
                  className="primary-button"
                  href={foundingReservationUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink size={17} />
                  Reserve {selectedPlan}
                </a>
              )}
              <button
                className="secondary-button"
                type="button"
                onClick={() =>
                  copyText(getCheckoutSetupNote(), 'Checkout setup copied')
                }
              >
                <Copy size={17} />
                Copy setup
              </button>
            </div>
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

        <section className="pilot-band" id="pilot">
          <div className="section-heading">
            <p className="eyebrow">
              <MessageCircle size={16} />
              Pilot
            </p>
            <h2>Help prove the company with one meaningful send</h2>
            <p>
              Keepsent grows only if it helps people send words they would have
              otherwise delayed. The pilot loop asks for outcome evidence, not
              private note text.
            </p>
          </div>

          <div className="pilot-grid">
            {pilotSteps.map((step, index) => (
              <article className="pilot-card" key={step.title}>
                <span>{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>

          <div className="pilot-actions">
            <article className="pilot-action-card">
              <div>
                <p className="eyebrow">Public feedback</p>
                <h3>Share pilot evidence</h3>
                <p>
                  Opens a public GitHub pilot form. Do not paste private note
                  text or Keepsent share links; note content is encoded in the
                  URL. Avoid names, contact details, sensitive topics, and
                  details about minors.
                </p>
              </div>
              <a
                className="primary-button"
                href={pilotFeedbackUrl}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink size={17} />
                Open feedback form
              </a>
            </article>

            <article className="pilot-action-card">
              <div>
                <p className="eyebrow">Paid intent</p>
                <h3>Reserve as a founding user</h3>
                <p>
                  Use this only when the value is real enough that you would pay
                  for a finished version. This is public by default and tied to
                  GitHub platform behavior; keep details broad.
                </p>
              </div>
              <a
                className="secondary-button"
                href={foundingReservationUrl}
                target="_blank"
                rel="noreferrer"
              >
                <CreditCard size={17} />
                Open reservation form
              </a>
            </article>
          </div>

          <div className="pilot-copy-panel">
            <button
              className="secondary-button"
              type="button"
              onClick={() => copyText(getPilotInvite(), 'Pilot invite copied')}
            >
              <Copy size={17} />
              Copy pilot invite
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() =>
                copyText(getInterviewScript(), 'Interview script copied')
              }
            >
              <FileText size={17} />
              Copy interview script
            </button>
          </div>

          <div className="outreach-header">
            <div>
              <p className="eyebrow">
                <Mail size={16} />
                Outreach kit
              </p>
              <h3>Recruit the first 20 meaningful-send pilots</h3>
              <p>
                Track personal pilot asks locally, copy a privacy-safe invite,
                and move each target from candidate to credible use.
              </p>
            </div>
            <div className="outreach-metrics" aria-label="Pilot outreach metrics">
              <span>
                <strong>{outreachContacts.length}</strong>
                targets
              </span>
              <span>
                <strong>{outreachMetrics.reached}</strong>
                reached
              </span>
              <span>
                <strong>{outreachMetrics.crediblePilots}</strong>
                credible pilots
              </span>
              <span>
                <strong>{outreachMetrics.remaining}</strong>
                left to 20
              </span>
            </div>
          </div>

          <div className="outreach-grid">
            <form
              className="outreach-form"
              onSubmit={(event) => {
                event.preventDefault()
                saveOutreachContact()
              }}
            >
              <div className="field-row">
                <label>
                  Pilot target
                  <input
                    value={outreachForm.name}
                    onChange={(event) =>
                      setOutreachForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Jordan"
                  />
                </label>
                <label>
                  Channel
                  <input
                    value={outreachForm.channel}
                    onChange={(event) =>
                      setOutreachForm((current) => ({
                        ...current,
                        channel: event.target.value,
                      }))
                    }
                    placeholder="DM, email, group chat"
                  />
                </label>
              </div>

              <label>
                Broad relationship or cohort
                <input
                  value={outreachForm.relationship}
                  onChange={(event) =>
                    setOutreachForm((current) => ({
                      ...current,
                      relationship: event.target.value,
                    }))
                  }
                  placeholder="new parent, mentor, caregiver, founder friend"
                />
              </label>

              <label>
                Likely meaningful-send moment
                <textarea
                  value={outreachForm.moment}
                  onChange={(event) =>
                    setOutreachForm((current) => ({
                      ...current,
                      moment: event.target.value,
                    }))
                  }
                  placeholder="Someone they have been meaning to thank, repair with, encourage, or honor"
                />
              </label>

              <div className="field-row">
                <label>
                  Status
                  <select
                    value={outreachForm.status}
                    onChange={(event) =>
                      setOutreachForm((current) => ({
                        ...current,
                        status: event.target.value as OutreachStatus,
                      }))
                    }
                  >
                    {(Object.keys(outreachStatuses) as OutreachStatus[]).map(
                      (status) => (
                        <option key={status} value={status}>
                          {outreachStatuses[status].label}
                        </option>
                      ),
                    )}
                  </select>
                </label>
                <label>
                  Private note
                  <input
                    value={outreachForm.notes}
                    onChange={(event) =>
                      setOutreachForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    placeholder="Follow-up context kept local"
                  />
                </label>
              </div>

              <button
                className="primary-button"
                type="submit"
                disabled={!outreachForm.name.trim()}
              >
                <Save size={17} />
                Save target
              </button>
            </form>

            <div className="outreach-list" aria-label="Pilot outreach targets">
              {outreachContacts.length === 0 ? (
                <p className="empty-state">
                  No pilot targets yet. Add people who already have a real note
                  to send this week.
                </p>
              ) : (
                outreachContacts.map((contact) => (
                  <article className="outreach-card" key={contact.id}>
                    <div>
                      <p className="eyebrow">
                        {outreachStatuses[contact.status].label}
                        {contact.channel ? ` - ${contact.channel}` : ''}
                      </p>
                      <h3>{contact.name}</h3>
                      <p>
                        {contact.moment ||
                          contact.relationship ||
                          outreachStatuses[contact.status].hint}
                      </p>
                      {contact.notes && <p>{contact.notes}</p>}
                    </div>
                    <div className="reply-options compact status-row">
                      {(Object.keys(outreachStatuses) as OutreachStatus[]).map(
                        (status) => (
                          <button
                            key={status}
                            className={
                              contact.status === status ? 'selected' : ''
                            }
                            type="button"
                            onClick={() => updateOutreachStatus(contact.id, status)}
                          >
                            {outreachStatuses[status].label}
                          </button>
                        ),
                      )}
                    </div>
                    <div className="note-actions">
                      <button
                        className="icon-button"
                        type="button"
                        onClick={() =>
                          copyText(
                            getOutreachInvite(contact),
                            'Outreach invite copied',
                          )
                        }
                      >
                        <Copy size={16} />
                        Invite
                      </button>
                      <button
                        className="icon-button"
                        type="button"
                        onClick={() => deleteOutreachContact(contact.id)}
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
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
              <span>{outreachContacts.length}</span>
              <p>pilot targets</p>
            </article>
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
            <article className="metric-card">
              <span>{reminders.length}</span>
              <p>moments planned</p>
            </article>
            <article className="metric-card">
              <span>{profiles.length}</span>
              <p>people saved</p>
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
              <h3>Activation</h3>
              <p>
                Twenty personal pilot asks, tracked locally from invite to
                credible use.
              </p>
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
                Private by default, protected links for sensitive notes, no
                public gallery, no training on intimate notes without explicit
                consent.
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

          <div className="trust-console">
            <div className="trust-console-copy">
              <p className="eyebrow">
                <ShieldCheck size={16} />
                Trust & data
              </p>
              <h3>Local data console</h3>
              <p>
                Keepsent stores the current MVP in this browser. These controls
                make that visible before someone trusts the product with private
                words or payment intent.
              </p>
              <p className="trust-note">
                Outreach target names and channels stay local and are excluded
                from the company data export.
              </p>
            </div>

            <div className="data-receipt-grid" aria-label="Local data receipt">
              {localDataSummary.map((item) => (
                <article className="data-receipt-card" key={item.label}>
                  <span>{item.count}</span>
                  <strong>{item.label}</strong>
                  <p>{item.detail}</p>
                </article>
              ))}
            </div>

            <div className="trust-control-panel">
              <div>
                <p className="eyebrow">Controls</p>
                <h3>{localDataRecordCount} local records in this browser</h3>
                <p>
                  Export before clearing if these notes, reminders, people, or
                  pilot signals still matter.
                </p>
              </div>
              <div className="trust-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={exportCompanyData}
                >
                  <Download size={17} />
                  Export data
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() =>
                    copyText(getTrustReceipt(), 'Trust receipt copied')
                  }
                >
                  <Copy size={17} />
                  Copy receipt
                </button>
              </div>
              <label className="clear-confirm">
                <input
                  type="checkbox"
                  checked={clearLocalDataArmed}
                  onChange={(event) =>
                    setClearLocalDataArmed(event.target.checked)
                  }
                />
                I understand this clears Keepsent notes, people, reminders,
                feedback, reservations, outreach targets, and the current draft
                from this browser.
              </label>
              <button
                className="danger-button"
                type="button"
                disabled={!clearLocalDataArmed}
                onClick={clearLocalData}
              >
                <Trash2 size={17} />
                Clear local data
              </button>
            </div>
          </div>

          <div className="button-row">
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
