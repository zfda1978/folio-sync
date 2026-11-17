import * as pdfjsLib from 'pdfjs-dist';
import { calculateWordCount, cleanWatermarksFromText } from './textParser';

if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  } catch (e) {
    console.warn('Worker init warning:', e);
  }
}

export interface PdfPageInspection {
  pageNumber: number;
  rawText: string;
  cleanText: string;
  wordCount: number;
  needsOcr: boolean;
}

export interface PdfInspectionResult {
  pageCount: number;
  metadataTitle?: string;
  metadataAuthor?: string;
  pages: PdfPageInspection[];
  digitalPagesCount: number;
  scannedPagesCount: number;
  combinedDigitalText: string;
  totalCleanWords: number;
}

export interface RenderedPdfPage {
  pageNumber: number;
  imageBase64: string; // raw base64 without data:image/... prefix
}

function reconstructPageLines(items: any[]): string {
  if (!items || items.length === 0) return '';
  const lines: string[] = [];
  let currentLine = '';
  let lastY: number | null = null;

  for (const item of items) {
    if (!('str' in item)) continue;
    const str: string = item.str;
    const y: number | null = Array.isArray(item.transform) ? item.transform[5] : null;

    // Detect line break if Y coordinate shifted noticeably (> 4px)
    if (lastY !== null && y !== null && Math.abs(y - lastY) > 4) {
      if (currentLine.trim()) {
        lines.push(currentLine.trim());
      }
      currentLine = str;
    } else {
      if (currentLine && str && !currentLine.endsWith(' ') && !str.startsWith(' ')) {
        currentLine += ' ' + str;
      } else {
        currentLine += str;
      }
    }

    if (item.hasEOL) {
      if (currentLine.trim()) {
        lines.push(currentLine.trim());
      }
      currentLine = '';
      lastY = null;
    } else if (y !== null) {
      lastY = y;
    }
  }

  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  return lines.join('\n');
}

async function loadPdfDocument(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
    disableFontFace: true,
  });

  // Generous 60s timeout for very large PDFs
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('PDF loading timed out after 60s')), 60000)
  );

  const pdf = await Promise.race([loadingTask.promise, timeoutPromise]);
  return { pdf, loadingTask };
}

export async function inspectPdfDocument(file: File): Promise<PdfInspectionResult> {
  const { pdf, loadingTask } = await loadPdfDocument(file);
  const numPages = pdf.numPages;

  let metadataTitle = '';
  let metadataAuthor = '';

  try {
    const meta = await pdf.getMetadata();
    if (meta?.info) {
      const info = meta.info as any;
      if (
        info.Title &&
        typeof info.Title === 'string' &&
        info.Title.trim() &&
        !/untitled|microsoft word|adobe/i.test(info.Title)
      ) {
        metadataTitle = info.Title.trim();
      }
      if (info.Author && typeof info.Author === 'string' && info.Author.trim()) {
        metadataAuthor = info.Author.trim();
      }
    }
  } catch (e) {
    console.warn('Could not read PDF metadata', e);
  }

  // Extract raw lines per page
  const rawPageTexts: string[] = [];
  const lineFrequency = new Map<string, number>();

  for (let i = 1; i <= numPages; i++) {
    try {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = reconstructPageLines(textContent.items as any[]);
      rawPageTexts.push(pageText);

      // Count short lines that repeat across pages (typical of website watermarks & running headers)
      const uniqueShortLines = new Set(
        pageText
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length > 2 && l.length <= 90)
      );
      uniqueShortLines.forEach((line) => {
        lineFrequency.set(line, (lineFrequency.get(line) || 0) + 1);
      });
    } catch (pageErr) {
      console.warn(`Failed to read text layer of page ${i}:`, pageErr);
      rawPageTexts.push('');
    }
  }

  // Identify repeating watermark/header lines appearing on >= 35% of pages (when >= 3 pages)
  const repeatingLines = new Set<string>();
  if (numPages >= 3) {
    const threshold = Math.max(2, Math.ceil(numPages * 0.35));
    lineFrequency.forEach((count, line) => {
      // Ignore pure chapter headings or numbers if short; target repeating domains/headers
      if (count >= threshold && !/^(chapter|part|book|section)\b/i.test(line)) {
        repeatingLines.add(line);
      }
    });
  }

  const pages: PdfPageInspection[] = [];
  let digitalPagesCount = 0;
  let scannedPagesCount = 0;

  for (let i = 0; i < numPages; i++) {
    const raw = rawPageTexts[i] || '';
    const withoutRepeating = raw
      .split('\n')
      .filter((l) => !repeatingLines.has(l.trim()))
      .join('\n');

    const cleanText = cleanWatermarksFromText(withoutRepeating);
    const wordCount = calculateWordCount(cleanText);

    // A page with fewer than 18 non-watermark words is likely a cover, blank page, or scanned image
    const needsOcr = wordCount < 18;
    if (needsOcr) {
      scannedPagesCount++;
    } else {
      digitalPagesCount++;
    }

    pages.push({
      pageNumber: i + 1,
      rawText: raw,
      cleanText,
      wordCount,
      needsOcr,
    });
  }

  const combinedDigitalText = pages
    .filter((p) => p.cleanText.trim().length > 0 && !p.needsOcr)
    .map((p) => `--- Page ${p.pageNumber} ---\n${p.cleanText}`)
    .join('\n\n');

  const totalCleanWords = calculateWordCount(combinedDigitalText);

  try {
    await pdf.cleanup();
    await loadingTask.destroy();
  } catch {
    // ignore cleanup error
  }

  return {
    pageCount: numPages,
    metadataTitle,
    metadataAuthor,
    pages,
    digitalPagesCount,
    scannedPagesCount,
    combinedDigitalText,
    totalCleanWords,
  };
}

export interface PdfSession {
  numPages: number;
  renderPages: (pageNumbers: number[], maxWidth?: number) => Promise<RenderedPdfPage[]>;
  close: () => Promise<void>;
}

async function renderPageToJpeg(pdf: any, pageNum: number, maxWidth: number): Promise<RenderedPdfPage | null> {
  if (pageNum < 1 || pageNum > pdf.numPages) return null;
  try {
    const page = await pdf.getPage(pageNum);
    const baseViewport = page.getViewport({ scale: 1 });
    // Target crisp readable resolution (~1100px wide, capped at 1.6x scale for fast batch uploads)
    const scale = Math.min(1.6, Math.max(1.0, maxWidth / Math.max(1, baseViewport.width)));
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Fill white background (important for transparent PDF pages)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    await page.render({
      canvas,
      viewport,
    }).promise;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.76);
    const imageBase64 = dataUrl.replace(/^data:image\/jpeg;base64,/, '');

    // Clean up canvas memory
    canvas.width = 0;
    canvas.height = 0;

    return {
      pageNumber: pageNum,
      imageBase64,
    };
  } catch (renderErr) {
    console.warn(`Failed to render PDF page ${pageNum} to image:`, renderErr);
    return null;
  }
}

export async function openPdfSession(file: File): Promise<PdfSession> {
  const { pdf, loadingTask } = await loadPdfDocument(file);

  return {
    numPages: pdf.numPages,
    renderPages: async (pageNumbers: number[], maxWidth = 1100) => {
      const rendered: RenderedPdfPage[] = [];
      for (const pageNum of pageNumbers) {
        const result = await renderPageToJpeg(pdf, pageNum, maxWidth);
        if (result) rendered.push(result);
      }
      return rendered;
    },
    close: async () => {
      try {
        await pdf.cleanup();
        await loadingTask.destroy();
      } catch {
        // ignore cleanup errors
      }
    },
  };
}

export async function renderPdfPagesToImages(
  file: File,
  pageNumbers: number[],
  maxWidth = 1100
): Promise<RenderedPdfPage[]> {
  const session = await openPdfSession(file);
  try {
    return await session.renderPages(pageNumbers, maxWidth);
  } finally {
    await session.close();
  }
}
