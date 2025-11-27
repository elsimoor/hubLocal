export interface VCardData {
  fullName: string
  email?: string
  phone?: string
  organization?: string
  title?: string
  url?: string
  photo?: string
  note?: string
}

export function generateVCard(data: VCardData): string {
  const lines: string[] = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeVCardText(data.fullName)}`,
    `N:${escapeVCardText(data.fullName)};;;;`,
  ]

  if (data.email) {
    lines.push(`EMAIL;TYPE=INTERNET:${escapeVCardText(data.email)}`)
  }

  if (data.phone) {
    lines.push(`TEL;TYPE=VOICE:${escapeVCardText(data.phone)}`)
  }

  if (data.organization) {
    lines.push(`ORG:${escapeVCardText(data.organization)}`)
  }

  if (data.title) {
    lines.push(`TITLE:${escapeVCardText(data.title)}`)
  }

  if (data.url) {
    lines.push(`URL:${escapeVCardText(data.url)}`)
  }

  if (data.photo) {
    lines.push(`PHOTO;VALUE=URI:${data.photo}`)
  }

  if (data.note) {
    lines.push(`NOTE:${escapeVCardText(data.note)}`)
  }

  lines.push("END:VCARD")

  return lines.join("\r\n")
}

export function downloadVCard(data: VCardData, filename?: string): void {
  const vcard = generateVCard(data)
  const blob = new Blob([vcard], { type: "text/vcard" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename || `${data.fullName.replace(/\s+/g, "_")}.vcf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function shareVCardUrl(data: VCardData): void {
  const vcard = generateVCard(data)
  const blob = new Blob([vcard], { type: "text/vcard" })
  const url = URL.createObjectURL(blob)

  if (navigator.share) {
    navigator
      .share({
        title: `${data.fullName}'s Contact Info`,
        text: "Add my contact to your phone",
        url,
      })
      .catch((err) => console.log("Error sharing:", err))
  }
}

function escapeVCardText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\r\n|\r|\n/g, "\\n")
}
