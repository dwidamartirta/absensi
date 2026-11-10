import { createWorker } from 'tesseract.js'

export interface ParsedKtpData {
  nik: string | null
  nama: string | null
  tempat_lahir: string | null
  tanggal_lahir: string | null // YYYY-MM-DD
  jenis_kelamin: 'Laki-laki' | 'Perempuan' | null
  gol_darah: string | null
  alamat: string | null
  rt_rw: string | null
  kel_desa: string | null
  kecamatan: string | null
  agama: string | null
  status_perkawinan: 'Belum Kawin' | 'Kawin' | 'Cerai Hidup' | 'Cerai Mati' | null
  pekerjaan: string | null
  raw_text?: string
  confidence?: number
}

/**
 * Preprocessing canvas gambar e-KTP untuk meningkatkan kontras & ketajaman teks sebelum OCR
 */
export const preprocessKtpImage = async (file: Blob): Promise<Blob> => {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(file)
        return
      }

      // Standarisasi ukuran optimal OCR (lebar 1280px)
      const targetWidth = Math.min(1600, Math.max(1000, img.width))
      const scale = targetWidth / img.width
      canvas.width = targetWidth
      canvas.height = img.height * scale

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      try {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const d = imgData.data

        // Grayscale & Contrast boost
        for (let i = 0; i < d.length; i += 4) {
          // Luminance grayscale
          const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
          // Tingkatkan kontras
          const contrast = 1.2
          const factor = (259 * (contrast + 255)) / (255 * (259 - contrast))
          const adjusted = Math.min(255, Math.max(0, factor * (gray - 128) + 128))

          d[i] = adjusted
          d[i + 1] = adjusted
          d[i + 2] = adjusted
        }

        ctx.putImageData(imgData, 0, 0)
        canvas.toBlob(
          (blob) => {
            resolve(blob || file)
          },
          'image/jpeg',
          0.92
        )
      } catch {
        resolve(file)
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(file)
    }

    img.src = url
  })
}

/**
 * Parser pintar khusus format e-KTP Indonesia
 */
export const parseIndonesianKtpText = (rawText: string): ParsedKtpData => {
  const clean = rawText.replace(/\r/g, '').trim()
  const result: ParsedKtpData = {
    nik: null,
    nama: null,
    tempat_lahir: null,
    tanggal_lahir: null,
    jenis_kelamin: null,
    gol_darah: null,
    alamat: null,
    rt_rw: null,
    kel_desa: null,
    kecamatan: null,
    agama: null,
    status_perkawinan: null,
    pekerjaan: null,
    raw_text: clean,
  }

  // 1. NIK: 16 digit angka berurutan
  // e.g. "NIK: 3201012304950001" atau "3201012304950001"
  const nikMatch = clean.match(/(?:NIK|N1K|N!K|NlK|Nik)?[\s\:\.\-]*([0-9]{16})/i) || clean.match(/\b([0-9]{16})\b/)
  if (nikMatch) {
    result.nik = nikMatch[1]
  }

  // 2. Nama
  const namaMatch = clean.match(/(?:Nama|Neme|Name)[\s\:\.\-]+([A-Z\s\.\,\']{3,50})/i)
  if (namaMatch) {
    let nama = namaMatch[1].trim()
    nama = nama.replace(/(Tempat|Lahir|Jenis|Kelamin|Tgl|Agama)/gi, '').trim()
    if (nama.length >= 3) {
      result.nama = nama
    }
  }

  // 3. Tempat / Tanggal Lahir (Format: KOTA, DD-MM-YYYY)
  const ttlMatch = clean.match(
    /(?:Tempat\/Tgl|Tempat|Tgl\s*Lahir)[\s\:\.\-]+([A-Z\s\.\-]+)[\,\.\s]+([0-9]{1,2})[\-\/\.\s]+([0-9]{1,2})[\-\/\.\s]+([0-9]{4})/i
  )
  if (ttlMatch) {
    result.tempat_lahir = ttlMatch[1].trim()
    const day = ttlMatch[2].padStart(2, '0')
    const month = ttlMatch[3].padStart(2, '0')
    const year = ttlMatch[4]
    result.tanggal_lahir = `${year}-${month}-${day}`
  }

  // 4. Jenis Kelamin
  if (/LAKI[\-\s]*LAKI|PRIA/i.test(clean)) {
    result.jenis_kelamin = 'Laki-laki'
  } else if (/PEREMPUAN|WANITA/i.test(clean)) {
    result.jenis_kelamin = 'Perempuan'
  }

  // 5. Golongan Darah
  const golMatch = clean.match(/(?:Gol\.?\s*Darah|Darah)[\s\:\.\-]+(A|B|AB|O|\-)/i)
  if (golMatch) {
    result.gol_darah = golMatch[1].toUpperCase()
  }

  // 6. Alamat
  const alamatParts: string[] = []
  const alamatMatch = clean.match(/(?:Alamat)[\s\:\.\-]+([^\n\r]+)/i)
  if (alamatMatch) {
    alamatParts.push(alamatMatch[1].trim())
  }
  const rtrwMatch = clean.match(/(?:RT\/RW|RT|RW)[\s\:\.\-]+([0-9]{1,3}\s*[\/\-]\s*[0-9]{1,3})/i)
  if (rtrwMatch) {
    result.rt_rw = rtrwMatch[1].trim()
    alamatParts.push('RT/RW ' .concat(result.rt_rw))
  }
  const kelMatch = clean.match(/(?:Kel\/Desa|Kelurahan|Desa)[\s\:\.\-]+([A-Z0-9\s\.\-]+)/i)
  if (kelMatch) {
    result.kel_desa = kelMatch[1].trim()
    alamatParts.push('Kel. ' .concat(result.kel_desa))
  }
  const kecMatch = clean.match(/(?:Kecamatan)[\s\:\.\-]+([A-Z0-9\s\.\-]+)/i)
  if (kecMatch) {
    result.kecamatan = kecMatch[1].trim()
    alamatParts.push('Kec. ' .concat(result.kecamatan))
  }
  if (alamatParts.length > 0) {
    result.alamat = alamatParts.join(', ')
  }

  // 7. Agama
  if (/ISLAM/i.test(clean)) {
    result.agama = 'Islam'
  } else if (/KRISTEN/i.test(clean)) {
    result.agama = 'Kristen'
  } else if (/KATOLIK/i.test(clean)) {
    result.agama = 'Katolik'
  } else if (/HINDU/i.test(clean)) {
    result.agama = 'Hindu'
  } else if (/BUDDHA|BUDHA/i.test(clean)) {
    result.agama = 'Buddha'
  } else if (/KONGHUCU/i.test(clean)) {
    result.agama = 'Konghucu'
  }

  // 8. Status Perkawinan
  if (/BELUM\s*KAWIN/i.test(clean)) {
    result.status_perkawinan = 'Belum Kawin'
  } else if (/CERAI\s*HIDUP/i.test(clean)) {
    result.status_perkawinan = 'Cerai Hidup'
  } else if (/CERAI\s*MATI/i.test(clean)) {
    result.status_perkawinan = 'Cerai Mati'
  } else if (/KAWIN/i.test(clean)) {
    result.status_perkawinan = 'Kawin'
  }

  return result
}

/**
 * Scan gambar e-KTP menggunakan Tesseract.js di browser
 */
export const scanKtpImageWithOcr = async (
  imageBlob: Blob,
  onProgress?: (progress: number, status: string) => void
): Promise<{ rawText: string; confidence: number; parsed: ParsedKtpData }> => {
  onProgress?.(10, 'Menyiapkan gambar...')
  const preprocessed = await preprocessKtpImage(imageBlob)

  onProgress?.(25, 'Memuat OCR Engine...')
  const worker = await createWorker('eng')

  try {
    onProgress?.(45, 'Membaca teks e-KTP...')
    const ret = await worker.recognize(preprocessed)
    const rawText = ret.data.text || ''
    const confidence = ret.data.confidence || 0

    onProgress?.(85, 'Mengekstrak data e-KTP...')
    const parsed = parseIndonesianKtpText(rawText)
    parsed.confidence = confidence

    onProgress?.(100, 'Selesai!')
    return { rawText, confidence, parsed }
  } finally {
    await worker.terminate()
  }
}

