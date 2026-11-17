import JSZip from 'jszip';
import { Chapter } from '../types';
import { calculateWordCount, cleanWatermarksFromText, parseChaptersFromText } from './textParser';

export interface EpubExtractionResult {
  title: string;
  author: string;
  chapters: Chapter[];
  fullText: string;
  totalWords: number;
}

function resolveZipPath(baseDir: string, relativePath: string): string {
  const cleanRel = decodeURIComponent(relativePath.split('#')[0]);
  if (!baseDir) return cleanRel.replace(/^\/+/, '');
  const parts = (baseDir + '/' + cleanRel).split('/');
  const resolved: string[] = [];
  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') {
      resolved.pop();
    } else {
      resolved.push(part);
    }
  }
  return resolved.join('/');
}

function extractTextAndTitleFromXhtml(xhtml: string): { heading: string; text: string } {
  const blockTags = new Set([
    'p',
    'div',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'li',
    'blockquote',
    'section',
    'article',
    'tr',
    'br',
    'hr',
  ]);

  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xhtml, 'text/html');
    doc.querySelectorAll('script, style, noscript, svg').forEach((el) => el.remove());

    const headingEl = doc.querySelector('h1, h2, h3, title');
    const rawHeading = headingEl?.textContent?.replace(/\s+/g, ' ').trim() || '';

    const chunks: string[] = [];
    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const val = (node.textContent || '').replace(/\s+/g, ' ');
        if (val.trim()) chunks.push(val);
        return;
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = (node as Element).tagName.toLowerCase();
        if (tag === 'br') {
          chunks.push('\n');
          return;
        }
        const isBlock = blockTags.has(tag);
        if (isBlock) chunks.push('\n');
        node.childNodes.forEach(walk);
        if (isBlock) chunks.push('\n\n');
      }
    };

    if (doc.body) {
      walk(doc.body);
    } else {
      walk(doc.documentElement);
    }

    const normalized = chunks
      .join('')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n[ \t]+/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return {
      heading: rawHeading,
      text: cleanWatermarksFromText(normalized),
    };
  }

  // Fallback for Node/non-DOM execution (used in automated checks)
  const headingMatch = xhtml.match(/<(?:h1|h2|h3|title)[^>]*>([\s\S]*?)<\/(?:h1|h2|h3|title)>/i);
  const heading = headingMatch ? headingMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : '';
  const stripped = xhtml
    .replace(/<(script|style|noscript|svg)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<\/(p|div|h[1-6]|li|blockquote|section|article|tr)>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return {
    heading,
    text: cleanWatermarksFromText(stripped),
  };
}

function getTagText(xml: string, tagRegex: RegExp): string {
  const m = xml.match(tagRegex);
  if (!m) return '';
  return m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

export async function extractEpubFromBuffer(
  buffer: ArrayBuffer | Uint8Array,
  filename = 'book.epub'
): Promise<EpubExtractionResult> {
  const zip = await JSZip.loadAsync(buffer);
  const fallbackTitle = filename
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  let opfPath = '';
  const containerFile = zip.file('META-INF/container.xml');
  if (containerFile) {
    const containerXml = await containerFile.async('string');
    const rootfileMatch = containerXml.match(/full-path=["']([^"']+)["']/i);
    if (rootfileMatch) {
      opfPath = rootfileMatch[1];
    }
  }

  if (!opfPath) {
    const foundOpf = Object.keys(zip.files).find((k) => k.toLowerCase().endsWith('.opf'));
    if (foundOpf) opfPath = foundOpf;
  }

  let title = fallbackTitle;
  let author = 'Unknown Author';
  const spineHrefs: string[] = [];

  if (opfPath && zip.file(opfPath)) {
    const opfDir = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/')) : '';
    const opfXml = await zip.file(opfPath)!.async('string');

    const extractedTitle = getTagText(opfXml, /<(?:dc:)?title[^>]*>([\s\S]*?)<\/(?:dc:)?title>/i);
    if (extractedTitle) title = extractedTitle;

    const extractedAuthor = getTagText(opfXml, /<(?:dc:)?creator[^>]*>([\s\S]*?)<\/(?:dc:)?creator>/i);
    if (extractedAuthor) author = extractedAuthor;

    const manifestMap = new Map<string, { href: string; mediaType: string }>();
    const itemRegex = /<item\b([^>]+)\/?>/gi;
    let itemMatch: RegExpExecArray | null;
    while ((itemMatch = itemRegex.exec(opfXml)) !== null) {
      const attrs = itemMatch[1];
      const id = attrs.match(/\bid=["']([^"']+)["']/i)?.[1];
      const href = attrs.match(/\bhref=["']([^"']+)["']/i)?.[1];
      const mediaType = attrs.match(/\bmedia-type=["']([^"']+)["']/i)?.[1] || '';
      if (id && href) {
        manifestMap.set(id, { href: resolveZipPath(opfDir, href), mediaType });
      }
    }

    const itemrefRegex = /<itemref\b([^>]+)\/?>/gi;
    let refMatch: RegExpExecArray | null;
    while ((refMatch = itemrefRegex.exec(opfXml)) !== null) {
      const idref = refMatch[1].match(/\bidref=["']([^"']+)["']/i)?.[1];
      if (idref && manifestMap.has(idref)) {
        const entry = manifestMap.get(idref)!;
        if (!entry.mediaType || /html|xml/i.test(entry.mediaType)) {
          spineHrefs.push(entry.href);
        }
      }
    }
  }

  const candidatePaths =
    spineHrefs.length > 0
      ? spineHrefs
      : Object.keys(zip.files)
          .filter((name) => !zip.files[name].dir && /\.(xhtml|html|htm)$/i.test(name))
          .sort();

  const chapters: Chapter[] = [];
  const textParts: string[] = [];

  for (const filePath of candidatePaths) {
    const zipEntry =
      zip.file(filePath) ||
      zip.file(Object.keys(zip.files).find((k) => k.toLowerCase() === filePath.toLowerCase()) || '');
    if (!zipEntry) continue;

    const rawXhtml = await zipEntry.async('string');
    const { heading, text } = extractTextAndTitleFromXhtml(rawXhtml);
    if (!text) continue;

    const words = calculateWordCount(text);
    // Skip tiny TOC / copyright / cover stub files when book has substantive sections
    if (words < 20 && candidatePaths.length > 3) continue;

    const baseName = filePath.split('/').pop()?.replace(/\.[^/.]+$/, '') || '';
    const chapterTitle =
      heading && heading.length <= 90 && heading.toLowerCase() !== title.toLowerCase()
        ? heading
        : baseName && !/^(index|part|section|split|chapter|text)?[_-]?\d+$/i.test(baseName)
        ? baseName.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        : `Section ${chapters.length + 1}`;

    chapters.push({
      id: `epub-ch-${chapters.length + 1}`,
      title: chapterTitle,
      content: text,
      wordCount: words,
      order: chapters.length + 1,
    });
    textParts.push(text);
  }

  const fullText = textParts.join('\n\n').trim();
  const totalWords = calculateWordCount(fullText);

  if (!fullText || totalWords < 5) {
    throw new Error('No readable text content was found inside this EPUB archive.');
  }

  const finalChapters =
    chapters.length >= 2 ? chapters : parseChaptersFromText(fullText);

  return {
    title,
    author,
    chapters: finalChapters,
    fullText,
    totalWords,
  };
}

export async function extractEpubFile(file: File): Promise<EpubExtractionResult> {
  const arrayBuffer = await file.arrayBuffer();
  return extractEpubFromBuffer(arrayBuffer, file.name);
}
