import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  FileText,
  BookOpen,
  Sparkles,
  X,
  Check,
  ArrowRight,
  Loader2,
  FileCheck,
  AlertCircle,
  Eye,
  Eraser,
  StopCircle,
  Play,
} from 'lucide-react';
import { Book, Chapter } from '../types';
import {
  calculateWordCount,
  estimateReadingTime,
  parseChaptersFromText,
  cleanWatermarksFromText,
} from '../utils/textParser';
import { inspectPdfDocument, openPdfSession } from '../utils/pdfExtractor';
import { extractEpubFile } from '../utils/epubExtractor';
import { apiExtractPdf, apiOcrPdfPages } from '../services/api';
import { SAMPLE_BOOKS } from '../data/sampleBooks';

interface BookImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onImportBook: (book: Book) => void;
}

const OCR_BATCH_SIZE = 5;

export const BookImporter: React.FC<BookImporterProps> = ({ isOpen, onClose, onImportBook }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'classics'>('upload');

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [sourceFormat, setSourceFormat] = useState<'pdf' | 'epub' | 'txt' | 'classic'>('txt');
  const [customChapters, setCustomChapters] = useState<Chapter[] | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiThemes, setAiThemes] = useState<string[] | null>(null);

  const [forceVisionOcr, setForceVisionOcr] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string | null>(null);
  const [ocrProgress, setOcrProgress] = useState<{ done: number; total: number } | null>(null);
  const [pdfPageMeta, setPdfPageMeta] = useState<{
    totalPages: number;
    remainingPages: number[];
    transcribedPages: number;
  } | null>(null);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [detectedPdfFile, setDetectedPdfFile] = useState<File | null>(null);

  const cancelOcrRef = useRef(false);
  const pageMapRef = useRef<Map<number, string>>(new Map());

  const resetImporterState = () => {
    setActiveTab('upload');
    setTitle('');
    setAuthor('');
    setContent('');
    setSourceFormat('txt');
    setCustomChapters(null);
    setAiSummary(null);
    setAiThemes(null);
    setForceVisionOcr(false);
    setProcessingStep(null);
    setOcrProgress(null);
    setPdfPageMeta(null);
    setUploadFeedback(null);
    setErrorFeedback(null);
    setDetectedPdfFile(null);
    pageMapRef.current = new Map();
    cancelOcrRef.current = false;
  };

  useEffect(() => {
    if (!isOpen && !isProcessing) {
      resetImporterState();
    }
  }, [isOpen, isProcessing]);

  if (!isOpen) return null;

  const assemblePagesInOrder = (pageMap: Map<number, string>): string => {
    return Array.from(pageMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([pageNum, txt]) => {
        const cleaned = cleanWatermarksFromText(txt).trim();
        if (!cleaned) return '';
        if (/^---\s*Page\s+\d+\s*---/i.test(cleaned)) {
          return cleaned;
        }
        return `--- Page ${pageNum} ---\n${cleaned}`;
      })
      .filter(Boolean)
      .join('\n\n');
  };

  const splitOcrResponseByPage = (ocrText: string, batchPages: number[]): Array<[number, string]> => {
    const cleaned = cleanWatermarksFromText(ocrText);
    if (!cleaned) return [];

    const markerRegex = /(?:^|\n)---\s*Page\s+(\d+)\s*---\s*(?:\n|$)/gi;
    const markers: Array<{ pageNum: number; start: number; contentStart: number }> = [];
    let m: RegExpExecArray | null;
    while ((m = markerRegex.exec(cleaned)) !== null) {
      markers.push({
        pageNum: Number(m[1]),
        start: m.index,
        contentStart: m.index + m[0].length,
      });
    }

    if (markers.length > 0) {
      const results: Array<[number, string]> = [];
      for (let i = 0; i < markers.length; i++) {
        const end = i + 1 < markers.length ? markers[i + 1].start : cleaned.length;
        const body = cleaned.slice(markers[i].contentStart, end).trim();
        if (body) {
          results.push([markers[i].pageNum, body]);
        }
      }
      if (results.length > 0) return results;
    }

    return [[batchPages[0], cleaned]];
  };

  const ocrBatchWithRetry = async (
    rendered: Array<{ pageNumber: number; imageBase64: string }>,
    filename: string
  ) => {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await apiOcrPdfPages(rendered, filename);
      } catch (err) {
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 900));
        } else {
          throw err;
        }
      }
    }
    throw new Error('OCR batch failed after retry');
  };

  const runBatchedVisionOcr = async (
    file: File,
    pageNumbers: number[],
    totalBookPages: number,
    initialPageMap?: Map<number, string>
  ) => {
    cancelOcrRef.current = false;
    const workingMap = new Map<number, string>(initialPageMap || pageMapRef.current);
    let completed = 0;
    let consecutiveBatchFailures = 0;
    const processedSet = new Set<number>();

    setOcrProgress({ done: 0, total: pageNumbers.length });
    setProcessingStep(`Opening "${file.name}" for full-book Vision OCR (${pageNumbers.length} pages)...`);

    const session = await openPdfSession(file);

    try {
      for (let i = 0; i < pageNumbers.length; i += OCR_BATCH_SIZE) {
        if (cancelOcrRef.current) break;

        const batch = pageNumbers.slice(i, i + OCR_BATCH_SIZE);
        const startP = batch[0];
        const endP = batch[batch.length - 1];

        setProcessingStep(
          `Transcribing pages ${startP}–${endP} of ${totalBookPages} via Vision OCR (${completed}/${pageNumbers.length} done)...`
        );

        const rendered = await session.renderPages(batch);
        if (rendered.length > 0) {
          try {
            const ocrResult = await ocrBatchWithRetry(rendered, file.name);
            const entries = splitOcrResponseByPage(ocrResult.text || '', batch);
            for (const [pNum, pText] of entries) {
              workingMap.set(pNum, pText);
            }
            batch.forEach((p) => processedSet.add(p));
            consecutiveBatchFailures = 0;

            const assembled = assemblePagesInOrder(workingMap);
            pageMapRef.current = workingMap;
            setContent(assembled);
          } catch (batchErr: any) {
            console.warn(`OCR batch ${startP}-${endP} failed, falling back to single-page OCR:`, batchErr);
            let anyPageSucceeded = false;
            for (const singlePage of rendered) {
              if (cancelOcrRef.current) break;
              try {
                const singleRes = await ocrBatchWithRetry([singlePage], file.name);
                const entries = splitOcrResponseByPage(singleRes.text || '', [singlePage.pageNumber]);
                for (const [pNum, pText] of entries) {
                  workingMap.set(pNum, pText);
                }
                processedSet.add(singlePage.pageNumber);
                anyPageSucceeded = true;
                pageMapRef.current = workingMap;
                setContent(assemblePagesInOrder(workingMap));
              } catch (singleErr) {
                console.warn(`Single-page OCR failed on page ${singlePage.pageNumber}:`, singleErr);
              }
            }
            if (anyPageSucceeded) {
              consecutiveBatchFailures = 0;
            } else {
              consecutiveBatchFailures++;
              if (consecutiveBatchFailures >= 3 && workingMap.size === 0) {
                throw batchErr;
              }
            }
          }
        }

        completed += batch.length;
        setOcrProgress({ done: Math.min(completed, pageNumbers.length), total: pageNumbers.length });
      }
    } finally {
      await session.close();
    }

    const remainingPages = pageNumbers.filter((p) => !processedSet.has(p));
    const finalText = assemblePagesInOrder(workingMap);
    pageMapRef.current = workingMap;

    return {
      text: finalText,
      remainingPages,
      transcribedPages: workingMap.size,
      wasCancelled: cancelOcrRef.current,
    };
  };

  // Process PDF, EPUB, TXT, MD, JSON
  const processFile = async (file: File, forceOcrMode = forceVisionOcr) => {
    setIsProcessing(true);
    setErrorFeedback(null);
    setUploadFeedback(null);
    setCustomChapters(null);
    setAiSummary(null);
    setOcrProgress(null);
    setPdfPageMeta(null);
    setContent('');
    pageMapRef.current = new Map();

    const lowerName = file.name.toLowerCase();
    const isPdf = file.type === 'application/pdf' || lowerName.endsWith('.pdf');
    const isEpub = file.type === 'application/epub+zip' || lowerName.endsWith('.epub');
    const cleanFileName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    const inferredTitle = cleanFileName.replace(/\b\w/g, (c) => c.toUpperCase());

    if (isEpub) {
      setSourceFormat('epub');
      setDetectedPdfFile(null);
      setProcessingStep(`Unpacking EPUB archive and organizing chapters from "${file.name}"...`);

      try {
        const epubData = await extractEpubFile(file);
        setTitle(epubData.title || inferredTitle);
        setAuthor(epubData.author || 'Unknown Author');
        setContent(epubData.fullText);
        setCustomChapters(epubData.chapters);
        setUploadFeedback(
          `Extracted ${epubData.chapters.length} chapters (${epubData.totalWords.toLocaleString()} words) from EPUB "${file.name}".`
        );
        setActiveTab('paste');
      } catch (epubErr: any) {
        console.error('EPUB extraction error:', epubErr);
        setErrorFeedback(`EPUB extraction error: ${epubErr.message || 'Could not parse EPUB archive.'}`);
      } finally {
        setIsProcessing(false);
        setProcessingStep(null);
      }
      return;
    }

    if (isPdf) {
      setSourceFormat('pdf');
      setDetectedPdfFile(file);
      setProcessingStep(`Inspecting all pages of "${file.name}"...`);

      let finalTitle = inferredTitle;
      let finalAuthor = 'Unknown Author';

      try {
        let inspection = null;
        try {
          inspection = await inspectPdfDocument(file);
          if (inspection.metadataTitle) finalTitle = inspection.metadataTitle;
          if (inspection.metadataAuthor) finalAuthor = inspection.metadataAuthor;
        } catch (inspectErr) {
          console.warn('Browser PDF inspection failed, using server fallback:', inspectErr);
        }

        if (inspection) {
          setTitle(finalTitle);
          setAuthor(finalAuthor);

          const initialMap = new Map<number, string>();
          if (!forceOcrMode) {
            for (const p of inspection.pages) {
              if (!p.needsOcr && p.cleanText.trim()) {
                initialMap.set(p.pageNumber, p.cleanText);
              }
            }
          }
          pageMapRef.current = initialMap;

          const isPredominantlyDigital =
            !forceOcrMode &&
            inspection.totalCleanWords >= 50 &&
            inspection.digitalPagesCount >= Math.max(1, Math.ceil(inspection.pageCount * 0.9));

          if (isPredominantlyDigital) {
            const fullDigitalText = assemblePagesInOrder(initialMap);
            const skippedPages = inspection.pages.filter((p) => p.needsOcr).map((p) => p.pageNumber);
            setContent(fullDigitalText);
            setPdfPageMeta({
              totalPages: inspection.pageCount,
              remainingPages: skippedPages,
              transcribedPages: inspection.digitalPagesCount,
            });
            setUploadFeedback(
              `Extracted ${inspection.digitalPagesCount} of ${inspection.pageCount} pages (${inspection.totalCleanWords.toLocaleString()} clean words) from "${file.name}".`
            );
            setActiveTab('paste');
            setIsProcessing(false);
            setProcessingStep(null);
            return;
          }

          const pagesToOcr = forceOcrMode
            ? inspection.pages.map((p) => p.pageNumber)
            : inspection.pages.filter((p) => p.needsOcr).map((p) => p.pageNumber);

          setActiveTab('paste');
          if (initialMap.size > 0) {
            setContent(assemblePagesInOrder(initialMap));
          }

          const ocrOutcome = await runBatchedVisionOcr(
            file,
            pagesToOcr,
            inspection.pageCount,
            initialMap
          );

          if (ocrOutcome.text && calculateWordCount(ocrOutcome.text) > 0) {
            setContent(ocrOutcome.text);
            setPdfPageMeta({
              totalPages: inspection.pageCount,
              remainingPages: ocrOutcome.remainingPages,
              transcribedPages: ocrOutcome.transcribedPages,
            });
            const wordCount = calculateWordCount(ocrOutcome.text);
            if (ocrOutcome.wasCancelled) {
              setUploadFeedback(
                `Paused OCR with ${ocrOutcome.transcribedPages} of ${inspection.pageCount} pages extracted (${wordCount.toLocaleString()} words). Click "OCR Remaining" to continue.`
              );
            } else if (ocrOutcome.remainingPages.length > 0) {
              setErrorFeedback(
                `Transcribed ${ocrOutcome.transcribedPages} of ${inspection.pageCount} pages (${wordCount.toLocaleString()} words), but ${ocrOutcome.remainingPages.length} pages failed. Click "OCR Remaining" above to retry them.`
              );
            } else {
              setUploadFeedback(
                `Full book transcribed: ${ocrOutcome.transcribedPages} of ${inspection.pageCount} pages (${wordCount.toLocaleString()} words) from "${file.name}".`
              );
            }
          } else {
            throw new Error(
              'Vision OCR did not find readable book text on those pages. Check that the pages are legible or try again.'
            );
          }
        } else {
          setProcessingStep('Uploading PDF to ZENOXIS server extraction engine...');
          const base64 = await fileToBase64(file);
          const serverResult = await apiExtractPdf(base64, file.name, forceOcrMode);

          if (serverResult.text && serverResult.text.trim().length > 0) {
            const cleaned = cleanWatermarksFromText(serverResult.text);
            setTitle(serverResult.title || finalTitle);
            setAuthor(serverResult.author || finalAuthor);
            setContent(cleaned);
            if (serverResult.summary) setAiSummary(serverResult.summary);
            if (serverResult.themes) setAiThemes(serverResult.themes);

            const wordCount = calculateWordCount(cleaned);
            setUploadFeedback(
              `Extracted ${serverResult.pageCount || 1} pages (${wordCount.toLocaleString()} words) from "${file.name}".`
            );
            setActiveTab('paste');
          } else {
            throw new Error('No readable text could be extracted from this PDF.');
          }
        }
      } catch (err: any) {
        console.error('PDF extraction error:', err);
        setErrorFeedback(
          `PDF extraction notice: ${err.message || 'Unknown error'}. You can retry Vision OCR or paste text directly below.`
        );
      } finally {
        setIsProcessing(false);
        setProcessingStep(null);
        setOcrProgress(null);
      }
      return;
    }

    // Standard text file (txt, md, json, text)
    setSourceFormat('txt');
    setDetectedPdfFile(null);
    setProcessingStep(`Reading text file "${file.name}"...`);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const cleaned = cleanWatermarksFromText(text);
        setTitle(inferredTitle);
        setContent(cleaned);
        setUploadFeedback(`Loaded ${calculateWordCount(cleaned).toLocaleString()} words from "${file.name}".`);
        setActiveTab('paste');
      } catch (err: any) {
        setErrorFeedback(`Error reading file: ${err.message}`);
      } finally {
        setIsProcessing(false);
        setProcessingStep(null);
      }
    };
    reader.onerror = () => {
      setErrorFeedback('Failed to read file from disk.');
      setIsProcessing(false);
      setProcessingStep(null);
    };
    reader.readAsText(file);
  };

  const handleOcrRemainingPages = async () => {
    if (!detectedPdfFile || !pdfPageMeta || isProcessing || pdfPageMeta.remainingPages.length === 0) return;

    setIsProcessing(true);
    setErrorFeedback(null);

    try {
      const outcome = await runBatchedVisionOcr(
        detectedPdfFile,
        pdfPageMeta.remainingPages,
        pdfPageMeta.totalPages
      );
      setPdfPageMeta({
        totalPages: pdfPageMeta.totalPages,
        remainingPages: outcome.remainingPages,
        transcribedPages: outcome.transcribedPages,
      });
      setUploadFeedback(
        `Updated book transcript: ${outcome.transcribedPages} of ${pdfPageMeta.totalPages} pages (${calculateWordCount(outcome.text).toLocaleString()} total words).`
      );
    } catch (err: any) {
      setErrorFeedback(err.message || 'Failed to transcribe remaining pages.');
    } finally {
      setIsProcessing(false);
      setProcessingStep(null);
      setOcrProgress(null);
    }
  };

  const handleStopOcr = () => {
    cancelOcrRef.current = true;
    setProcessingStep('Stopping after current batch and keeping transcribed pages...');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleRunDeepVisionOcr = async () => {
    if (!detectedPdfFile) return;
    processFile(detectedPdfFile, true);
  };

  const handleCleanWatermarks = () => {
    const cleaned = cleanWatermarksFromText(content);
    setContent(cleaned);
    setUploadFeedback('Purged website links, download banners, and repeating stamps.');
  };

  const handleSaveImportedBook = () => {
    if (!title.trim() || !content.trim()) return;

    const chapters = customChapters && customChapters.length > 0 ? customChapters : parseChaptersFromText(content);
    const totalWords = calculateWordCount(content);

    const gradientPresets = [
      'from-[#111D3B] via-[#1D356B] to-[#3978E8]',
      'from-[#111D3B] via-[#194A4D] to-[#51BCA6]',
      'from-[#111D3B] via-[#3A3176] to-[#8174D5]',
    ];
    const randomGradient = gradientPresets[Math.floor(Math.random() * gradientPresets.length)];

    const newBook: Book = {
      id: 'book-' + Date.now(),
      title: title.trim(),
      author: author.trim() || 'Unknown Author',
      coverGradient: randomGradient,
      sourceFormat,
      totalWords,
      chapters,
      createdAt: new Date().toISOString(),
      ...(aiSummary
        ? {
            analysis: {
              summary: aiSummary,
              themes: aiThemes || ['Critical Inquiry', 'Conceptual Analysis'],
              characters: [],
              keyQuotes: [],
              suggestedAudiences: ['Grades 4–10', 'Independent Thinkers'],
            },
          }
        : {}),
    };

    onImportBook(newBook);
    resetImporterState();
    onClose();
  };

  const handleSelectSample = (sample: Book) => {
    onImportBook(sample);
    resetImporterState();
    onClose();
  };

  const currentWords = calculateWordCount(content);
  const detectedChapters = customChapters || (content ? parseChaptersFromText(content) : []);
  const isLikelyWatermarkOnly =
    content.trim().length > 0 &&
    (currentWords < 30 ||
      (currentWords < 150 &&
        (/^(https?:\/\/|www\.)/im.test(content.trim()) || /downloaded from/i.test(content))));
  const hasRemainingPages =
    pdfPageMeta !== null && pdfPageMeta.remainingPages.length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#111D3B]/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-[#A9B9D3]/60 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-[#EDF1FA]/70 border-b border-[#A9B9D3]/50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#111D3B] text-[#51BCA6] flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#111D3B]">Import Book to ZENOXIS Library</h2>
              <p className="text-xs text-[#111D3B]/65">
                Supports digital &amp; scanned PDFs (Vision OCR), EPUB archives, TXT, and Markdown
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#111D3B]/50 hover:text-[#111D3B] p-1.5 rounded-lg hover:bg-[#A9B9D3]/25 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#A9B9D3]/45 px-6 pt-2 bg-white">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'upload'
                ? 'border-[#3978E8] text-[#111D3B] font-semibold'
                : 'border-transparent text-[#111D3B]/55 hover:text-[#111D3B]'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload PDF / EPUB / TXT</span>
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'paste'
                ? 'border-[#3978E8] text-[#111D3B] font-semibold'
                : 'border-transparent text-[#111D3B]/55 hover:text-[#111D3B]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Review &amp; Chapters</span>
          </button>
          <button
            onClick={() => setActiveTab('classics')}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'classics'
                ? 'border-[#3978E8] text-[#111D3B] font-semibold'
                : 'border-transparent text-[#111D3B]/55 hover:text-[#111D3B]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#8174D5]" />
            <span>Curated Volumes</span>
          </button>
        </div>

        {/* Content area */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {isProcessing && (
            <div className="mb-4 p-4 bg-[#EDF1FA] border border-[#3978E8]/40 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Loader2 className="w-4 h-4 text-[#3978E8] animate-spin shrink-0" />
                  <span className="text-xs font-semibold text-[#111D3B]">
                    {processingStep || 'Processing...'}
                  </span>
                </div>
                {ocrProgress && (
                  <button
                    onClick={handleStopOcr}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-white text-[#111D3B] hover:bg-[#EDF1FA] border border-[#A9B9D3] rounded-lg flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <StopCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Stop &amp; Keep Text</span>
                  </button>
                )}
              </div>
              {ocrProgress && (
                <div className="space-y-1">
                  <div className="w-full h-2 bg-[#A9B9D3]/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#3978E8] transition-all duration-300"
                      style={{
                        width: `${Math.max(5, Math.round((ocrProgress.done / Math.max(1, ocrProgress.total)) * 100))}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-mono tabular-nums text-[#111D3B]/70">
                    <span>
                      Vision OCR: {ocrProgress.done} / {ocrProgress.total} pages
                    </span>
                    <span>{currentWords.toLocaleString()} words extracted</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {errorFeedback && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold block">{errorFeedback}</span>
                {detectedPdfFile && !isProcessing && (
                  <button
                    onClick={handleRunDeepVisionOcr}
                    className="text-rose-900 font-bold underline hover:text-rose-950 inline-flex items-center gap-1 mt-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Retry Page-by-Page Vision OCR</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {uploadFeedback && !isProcessing && (
            <div className="mb-4 p-3 bg-[#51BCA6]/15 border border-[#51BCA6]/40 text-[#111D3B] rounded-xl text-xs flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#51BCA6] shrink-0" />
              <span>{uploadFeedback}</span>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4">
              {!isProcessing && (
                <>
                  {/* OCR Mode Picker */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-[#EDF1FA]/60 border border-[#A9B9D3]/45">
                    <div>
                      <span className="text-xs font-bold text-[#111D3B] block">PDF Extraction Mode</span>
                      <span className="text-[11px] text-[#111D3B]/65">
                        {forceVisionOcr
                          ? 'Renders every page to images and transcribes verbatim via ZENOXIS AI Vision OCR'
                          : 'Auto-detects digital text vs scanned pages & strips website watermarks'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#A9B9D3]/50 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setForceVisionOcr(false)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                          !forceVisionOcr
                            ? 'bg-[#111D3B] text-white'
                            : 'text-[#111D3B]/65 hover:text-[#111D3B]'
                        }`}
                      >
                        Auto-Detect
                      </button>
                      <button
                        type="button"
                        onClick={() => setForceVisionOcr(true)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                          forceVisionOcr
                            ? 'bg-[#3978E8] text-white'
                            : 'text-[#111D3B]/65 hover:text-[#111D3B]'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Force Vision OCR</span>
                      </button>
                    </div>
                  </div>

                  {/* Dropzone */}
                  <label
                    htmlFor="book-file-upload"
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all group ${
                      isDragging
                        ? 'border-[#3978E8] bg-[#EDF1FA]'
                        : 'border-[#A9B9D3] hover:border-[#3978E8] bg-[#EDF1FA]/35 hover:bg-[#EDF1FA]/70'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[#111D3B] text-[#51BCA6] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <Upload className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-bold text-[#111D3B]">
                      Upload PDF, EPUB, or TXT Book
                    </h3>
                    <p className="text-xs text-[#111D3B]/65 mt-1.5 max-w-md">
                      Supports <strong className="text-[#111D3B]">.pdf</strong> (digital or scanned),{' '}
                      <strong className="text-[#111D3B]">.epub</strong>,{' '}
                      <strong className="text-[#111D3B]">.txt</strong>, and{' '}
                      <strong className="text-[#111D3B]">.md</strong>. Chapters and topics are extracted cleanly across the full volume.
                    </p>

                    <div className="mt-4">
                      <span className="inline-flex items-center text-xs font-semibold px-4 py-2 rounded-lg bg-[#3978E8] text-white">
                        Choose Book File
                      </span>
                    </div>

                    <input
                      id="book-file-upload"
                      type="file"
                      accept=".pdf,.epub,.txt,.md,.json,.text,application/pdf,application/epub+zip"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3.5 bg-[#EDF1FA]/45 border border-[#A9B9D3]/45 rounded-xl text-xs space-y-1">
                  <div className="font-semibold text-[#111D3B]">EPUB Chapter Spine</div>
                  <p className="text-[11px] text-[#111D3B]/65 leading-relaxed">
                    Reads OPF metadata and chapter spine directly into organized topics.
                  </p>
                </div>
                <div className="p-3.5 bg-[#EDF1FA]/45 border border-[#A9B9D3]/45 rounded-xl text-xs space-y-1">
                  <div className="font-semibold text-[#111D3B]">Full-Book Vision OCR</div>
                  <p className="text-[11px] text-[#111D3B]/65 leading-relaxed">
                    Renders scanned PDF pages cleanly without 15-page truncation.
                  </p>
                </div>
                <div className="p-3.5 bg-[#EDF1FA]/45 border border-[#A9B9D3]/45 rounded-xl text-xs space-y-1">
                  <div className="font-semibold text-[#111D3B]">Watermark Purging</div>
                  <p className="text-[11px] text-[#111D3B]/65 leading-relaxed">
                    Strips repeating site footers and download stamps automatically.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'paste' && (
            <div className="space-y-4">
              {hasRemainingPages && detectedPdfFile && !isProcessing && (
                <div className="p-3.5 rounded-xl bg-[#EDF1FA] border border-[#3978E8]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-[#111D3B]">
                    <strong className="block">
                      {pdfPageMeta!.remainingPages.length} page{pdfPageMeta!.remainingPages.length === 1 ? '' : 's'} without digital text
                    </strong>
                    <span className="text-[11px] text-[#111D3B]/70 font-mono tabular-nums">
                      {pdfPageMeta!.transcribedPages} / {pdfPageMeta!.totalPages} pages extracted
                    </span>
                  </div>
                  <button
                    onClick={handleOcrRemainingPages}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-[#3978E8] hover:bg-[#2B64CC] rounded-lg flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>OCR Remaining ({pdfPageMeta!.remainingPages.length} pages)</span>
                  </button>
                </div>
              )}

              {isLikelyWatermarkOnly && !isProcessing && (
                <div className="p-4 rounded-xl bg-[#8174D5]/10 border border-[#8174D5]/40 text-[#111D3B] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <AlertCircle className="w-4 h-4 text-[#8174D5]" />
                    <span>Scanned PDF or Website Stamp Detected</span>
                  </div>
                  <p className="text-xs leading-relaxed text-[#111D3B]/75">
                    The extracted text looks too short or contains a website stamp. Run page-by-page Vision OCR to transcribe the full book text.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {detectedPdfFile && (
                      <button
                        onClick={handleRunDeepVisionOcr}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-[#3978E8] hover:bg-[#2B64CC] rounded-lg flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Run Vision OCR</span>
                      </button>
                    )}
                    <button
                      onClick={handleCleanWatermarks}
                      className="px-3 py-1.5 text-xs font-semibold text-[#111D3B] bg-white border border-[#A9B9D3] hover:bg-[#EDF1FA] rounded-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eraser className="w-3.5 h-3.5" />
                      <span>Purge Watermark Lines</span>
                    </button>
                  </div>
                </div>
              )}

              {detectedPdfFile && !isLikelyWatermarkOnly && !isProcessing && (
                <div className="p-3 rounded-xl bg-[#EDF1FA]/55 border border-[#A9B9D3]/45 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-[#111D3B]">
                    <FileText className="w-4 h-4 text-[#3978E8]" />
                    <span>
                      Source: <strong>{detectedPdfFile.name}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCleanWatermarks}
                      className="px-2.5 py-1 text-xs font-semibold text-[#111D3B] bg-white hover:bg-[#EDF1FA] border border-[#A9B9D3]/60 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Eraser className="w-3.5 h-3.5" />
                      <span>Clean Stamps</span>
                    </button>
                    <button
                      onClick={handleRunDeepVisionOcr}
                      className="px-2.5 py-1 text-xs font-semibold text-[#3978E8] bg-white hover:bg-[#3978E8] hover:text-white border border-[#3978E8]/40 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Re-run Vision OCR</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#111D3B] mb-1">
                    Book Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. The Great Gatsby"
                    className="w-full px-3 py-2 text-sm border border-[#A9B9D3] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#3978E8] bg-white text-[#111D3B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111D3B] mb-1">
                    Author
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="e.g. F. Scott Fitzgerald"
                    className="w-full px-3 py-2 text-sm border border-[#A9B9D3] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#3978E8] bg-white text-[#111D3B]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#111D3B]">
                    Extracted Text &amp; Chapters <span className="text-rose-500">*</span>
                  </label>
                  {currentWords > 0 && (
                    <span className="text-xs font-mono tabular-nums text-[#111D3B]/65">
                      {currentWords.toLocaleString()} w · ~{estimateReadingTime(currentWords)}m ·{' '}
                      {detectedChapters.length} chapters
                    </span>
                  )}
                </div>
                <textarea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    setCustomChapters(null);
                  }}
                  rows={8}
                  placeholder="Paste the book text, chapters, or study material here..."
                  className="w-full px-3 py-2 border border-[#A9B9D3] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#3978E8] font-mono text-xs leading-relaxed bg-white text-[#111D3B]"
                />
              </div>

              {detectedChapters.length > 0 && (
                <div className="bg-[#EDF1FA]/50 border border-[#A9B9D3]/45 rounded-xl p-3.5">
                  <div className="text-xs font-bold text-[#111D3B] mb-1.5 flex items-center justify-between">
                    <span>Organized Chapters ({detectedChapters.length})</span>
                    <span className="text-[11px] font-normal text-[#111D3B]/60">
                      Available for chapter-specific assessments
                    </span>
                  </div>
                  <div className="text-xs text-[#111D3B]/75 max-h-24 overflow-y-auto leading-relaxed">
                    {detectedChapters.map((ch, idx) => (
                      <span key={idx}>
                        {idx > 0 && ' · '}
                        <strong className="font-medium text-[#111D3B]">{ch.title}</strong>{' '}
                        <span className="font-mono text-[11px] text-[#111D3B]/55">
                          ({ch.wordCount.toLocaleString()}w)
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'classics' && (
            <div className="space-y-3">
              <p className="text-xs text-[#111D3B]/65 mb-2">
                Load a curated volume to explore ZENOXIS Studio, Assess, Think, and Insight immediately:
              </p>
              <div className="grid grid-cols-1 gap-3">
                {SAMPLE_BOOKS.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => handleSelectSample(b)}
                    className="p-4 rounded-xl border border-[#A9B9D3]/50 hover:border-[#3978E8] cursor-pointer transition-all bg-white flex items-start justify-between group"
                  >
                    <div className="flex items-start space-x-3.5">
                      <div
                        className={`w-12 h-16 rounded-md bg-gradient-to-br ${
                          b.coverGradient || 'from-[#111D3B] to-[#3978E8]'
                        } flex items-center justify-center text-white shrink-0 font-serif font-bold text-lg`}
                      >
                        {b.title[0]}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#111D3B] group-hover:text-[#3978E8] transition-colors">
                          {b.title}
                        </h4>
                        <p className="text-xs text-[#111D3B]/65 font-medium">by {b.author}</p>
                        <p className="font-serif text-sm text-[#111D3B]/75 line-clamp-2 mt-1">
                          {b.analysis?.summary}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-[11px] font-mono tabular-nums text-[#111D3B]/55">
                          <span>{b.chapters.length} ch</span>
                          <span>·</span>
                          <span>{b.totalWords.toLocaleString()} w</span>
                        </div>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 text-xs font-semibold text-[#3978E8] bg-[#EDF1FA] group-hover:bg-[#3978E8] group-hover:text-white rounded-lg transition-colors flex items-center gap-1 shrink-0 mt-2">
                      <span>Load</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#EDF1FA]/60 border-t border-[#A9B9D3]/45 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#111D3B]/70 hover:text-[#111D3B] rounded-lg hover:bg-white transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {activeTab === 'paste' && (
            <button
              onClick={handleSaveImportedBook}
              disabled={!title.trim() || !content.trim() || isProcessing}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#3978E8] hover:bg-[#2B64CC] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save to Library</span>
            </button>
          )}

          {activeTab === 'upload' && content && !isProcessing && (
            <button
              onClick={() => setActiveTab('paste')}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#111D3B] hover:bg-[#1E315E] rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Review Book Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}
