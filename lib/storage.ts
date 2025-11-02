import { randomUUID } from 'crypto'

export class StorageConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StorageConfigError'
  }
}

const ATTACHMENT_BUCKET = process.env.NOTES_ATTACHMENT_BUCKET || 'note-attachments'

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
}

function requireEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new StorageConfigError(`${name} must be configured to store note attachments.`)
  }
  return value
}

function sanitizeFileName(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function extensionFrom(contentType: string, fileName?: string | null) {
  if (fileName) {
    const parts = fileName.split('.')
    if (parts.length > 1) {
      return parts.pop()!.toLowerCase()
    }
  }
  return MIME_EXTENSION_MAP[contentType] || 'bin'
}

function encodePath(path: string) {
  return path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

function buildObjectPath(fileName?: string | null, extHint?: string) {
  const ext = extHint ? extHint.replace(/^\./, '') : undefined
  const safeName = fileName ? sanitizeFileName(fileName) : undefined
  const base = randomUUID()

  if (safeName) {
    const hasExtension = /\.[a-z0-9]+$/i.test(safeName)
    if (hasExtension) {
      return `notes/${base}-${safeName}`
    }
    const suffix = ext ? `.${ext}` : ''
    return `notes/${base}-${safeName}${suffix}`
  }

  const suffix = ext ? `.${ext}` : ''
  return `notes/${base}${suffix || '.bin'}`
}

function publicUrlFor(supabaseUrl: string, bucket: string, path: string) {
  const url = new URL(`/storage/v1/object/public/${bucket}/${path}`, supabaseUrl)
  return url.toString()
}

async function uploadArrayBuffer(
  buffer: ArrayBuffer,
  contentType: string,
  options: { fileName?: string | null } = {}
) {
  const supabaseUrl = requireEnv('SUPABASE_URL', process.env.SUPABASE_URL)
  const serviceKey = requireEnv(
    'SUPABASE_SERVICE_ROLE_KEY',
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const fileName = options.fileName || null
  const ext = extensionFrom(contentType, fileName)
  const objectPath = buildObjectPath(fileName, ext)
  const uploadUrl = new URL(
    `/storage/v1/object/${encodeURIComponent(ATTACHMENT_BUCKET)}/${encodePath(objectPath)}`,
    supabaseUrl
  )

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': contentType,
      'x-upsert': 'false',
    },
    body: Buffer.from(buffer),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Failed to upload attachment (${response.status}): ${detail}`)
  }

  return {
    path: objectPath,
    url: publicUrlFor(supabaseUrl, ATTACHMENT_BUCKET, objectPath),
  }
}

export async function uploadAttachmentFromDataUrl(dataUrl: string) {
  const match = /^data:(?<mime>[^;]+);base64,(?<data>.+)$/i.exec(dataUrl)
  if (!match?.groups?.mime || !match.groups.data) {
    throw new Error('Unsupported attachment format. Expected data URL.')
  }
  const contentType = match.groups.mime
  const buffer = Buffer.from(match.groups.data, 'base64')
  return uploadArrayBuffer(buffer, contentType)
}

export async function uploadAttachmentFromFile(file: File) {
  const arrayBuffer = await file.arrayBuffer()
  return uploadArrayBuffer(arrayBuffer, file.type || 'application/octet-stream', {
    fileName: file.name,
  })
}

export async function removeAttachment(path: string) {
  const supabaseUrl = requireEnv('SUPABASE_URL', process.env.SUPABASE_URL)
  const serviceKey = requireEnv(
    'SUPABASE_SERVICE_ROLE_KEY',
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const deleteUrl = new URL(
    `/storage/v1/object/${encodeURIComponent(ATTACHMENT_BUCKET)}/${encodePath(path)}`,
    supabaseUrl
  )

  const response = await fetch(deleteUrl, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
    },
  })

  if (!response.ok && response.status !== 404) {
    const detail = await response.text()
    throw new Error(`Failed to remove attachment (${response.status}): ${detail}`)
  }
}

export function getAttachmentBucket() {
  return ATTACHMENT_BUCKET
}
