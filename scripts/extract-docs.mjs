import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const AdmZip = require('adm-zip')

const TMP = path.resolve('docs/_tmp_docs')
const OUT = path.resolve('docs/extracted')

function extractDocx(filePath, outPath) {
  const zip = new AdmZip(filePath)
  const entry = zip.getEntry('word/document.xml')
  if (!entry) return false
  const xml = entry.getData().toString('utf8')
  const text = xml
    .replace(/<w:tab\/>/g, '\t')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n')
  fs.writeFileSync(outPath, text, 'utf8')
  return true
}

function extractPdfWithPdftotext(filePath, outPath) {
  try {
    const text = execSync(`pdftotext "${filePath}" -`, { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 })
    fs.writeFileSync(outPath, text.trim(), 'utf8')
    return true
  } catch {
    return false
  }
}

async function extractPdfWithParse(filePath, outPath) {
  try {
    const pdfParse = require('pdf-parse')
    const data = await pdfParse(fs.readFileSync(filePath))
    if (!data.text?.trim()) return false
    fs.writeFileSync(outPath, data.text.trim(), 'utf8')
    return true
  } catch {
    return false
  }
}

fs.mkdirSync(OUT, { recursive: true })

const files = fs.readdirSync(TMP)
let docxCount = 0
let pdfCount = 0

for (const file of files) {
  const ext = path.extname(file).toLowerCase()
  const base = path.basename(file, ext).replace(/[^\w\- ]+/g, '_')
  const outPath = path.join(OUT, `${base}.txt`)
  const full = path.join(TMP, file)

  if (ext === '.docx') {
    if (extractDocx(full, outPath)) docxCount++
  } else if (ext === '.pdf') {
    const size = fs.statSync(full).size
    if (size > 2_000_000) {
      fs.writeFileSync(outPath, `[SKIPPED: ${file} is ${Math.round(size / 1024 / 1024)}MB — likely image/screenshot PDF; needs manual review]`, 'utf8')
      continue
    }
    if (extractPdfWithPdftotext(full, outPath) || (await extractPdfWithParse(full, outPath))) pdfCount++
  }
}

console.log(`Extracted ${docxCount} docx and ${pdfCount} pdf files to ${OUT}`)
