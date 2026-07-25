import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { createWorker } from 'tesseract.js';
import type { OCRMetrics, FileConsistencyCheck } from './types';

if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  const version = (pdfjsLib.version || '6.1.200').trim();
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
}

export interface ExtractionResult {
  text: string;
  filename: string;
  fileType: string;
  ocrMetrics?: OCRMetrics;
}

/**
 * Normalizes extracted text by standardizing line breaks, whitespace, and special quotes.
 */
export function normalizeLegalText(rawText: string): string {
  if (!rawText) return '';
  return rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\t\f]/g, ' ')
    .replace(/\u00A0/g, ' ') // Non-breaking space
    .replace(/[\u201C\u201D]/g, '"') // Smart double quotes
    .replace(/[\u2018\u2019]/g, "'") // Smart single quotes
    .replace(/\n{3,}/g, '\n\n') // Excess blank lines
    .trim();
}

/**
 * Extracts plain text from TXT file.
 */
export async function extractTextFromTxt(file: File): Promise<ExtractionResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const raw = (e.target?.result as string) || '';
      const text = normalizeLegalText(raw);
      if (!text || text.trim().length === 0) {
        reject(new Error('Extraction failed: TXT file contains no readable text.'));
      } else {
        resolve({ text, filename: file.name, fileType: 'txt' });
      }
    };
    reader.onerror = () => reject(new Error(`Failed to read text file: ${file.name}`));
    reader.readAsText(file);
  });
}

/**
 * Extracts text from PDF file page by page.
 */
export async function extractTextFromPdf(file: File): Promise<ExtractionResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: unknown) => (item as { str: string }).str || '')
        .join(' ');
      fullText += pageText + '\n\n';
    }

    const text = normalizeLegalText(fullText);
    if (!text || text.trim().length === 0) {
      throw new Error('Extraction failed: PDF document contains no selectable text layer.');
    }

    return { text, filename: file.name, fileType: 'pdf' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unable to parse PDF structure.';
    throw new Error(`PDF Extraction Failure: ${msg}`, { cause: error });
  }
}

/**
 * Extracts text from Word DOCX file using mammoth.
 */
export async function extractTextFromDocx(file: File): Promise<ExtractionResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = normalizeLegalText(result.value);

    if (!text || text.trim().length === 0) {
      throw new Error('Extraction failed: DOCX document contains no body text.');
    }

    return { text, filename: file.name, fileType: 'docx' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unable to parse Word document.';
    throw new Error(`DOCX Extraction Failure: ${msg}`, { cause: error });
  }
}

/**
 * Performs OCR on image file / camera scan using tesseract.js and validates OCR confidence >= 90%.
 */
export async function extractTextFromImage(
  file: File | Blob,
  onProgress?: (progressText: string) => void
): Promise<ExtractionResult> {
  let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
  try {
    if (onProgress) onProgress('Initializing OCR engine...');
    worker = await createWorker('eng');
    
    if (onProgress) onProgress('Scanning image character boundaries...');
    const ret = await worker.recognize(file);
    await worker.terminate();
    worker = null;

    const confidence = Math.round(ret.data.confidence || 0);
    const rawText = ret.data.text || '';
    const text = normalizeLegalText(rawText);

    // Prompt requirement: If confidence < 90% display exact error message
    if (confidence < 90) {
      throw new Error(
        'The uploaded image is not clear enough for reliable legal analysis. Please upload a higher-quality image.'
      );
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Extraction failed: OCR could not detect any printable text in the image.');
    }

    const filename = (file as File).name || 'camera_scan.jpg';

    return {
      text,
      filename,
      fileType: 'image',
      ocrMetrics: {
        is_image: true,
        confidence,
        raw_ocr_text: text
      }
    };
  } catch (error: unknown) {
    if (worker) {
      try {
        await worker.terminate();
      } catch {
        // cleanup ignore
      }
    }
    throw error;
  }
}

/**
 * Universal file router for TXT, PDF, DOCX, Image, and Camera Scan.
 */
export async function extractTextFromFile(
  file: File,
  onProgress?: (step: string) => void
): Promise<ExtractionResult> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const type = file.type || '';

  if (ext === 'txt') {
    if (onProgress) onProgress(`Reading text file ${file.name}...`);
    return extractTextFromTxt(file);
  } else if (ext === 'pdf' || type.includes('pdf')) {
    if (onProgress) onProgress(`Parsing PDF document ${file.name}...`);
    return extractTextFromPdf(file);
  } else if (ext === 'docx' || type.includes('word')) {
    if (onProgress) onProgress(`Extracting DOCX content from ${file.name}...`);
    return extractTextFromDocx(file);
  } else if (/^(png|jpe?g|webp|bmp|gif)$/i.test(ext) || type.startsWith('image/')) {
    return extractTextFromImage(file, onProgress);
  } else {
    try {
      if (onProgress) onProgress(`Attempting raw text reader for ${file.name}...`);
      return await extractTextFromTxt(file);
    } catch {
      throw new Error(`Unsupported file type: .${ext}. Supported formats: TXT, PDF, DOCX, PNG, JPG.`);
    }
  }
}

/**
 * Verifies consistency across Uploaded File, Extracted Text, and AI Input.
 */
export function verifyFileConsistency(
  uploadedFileText: string,
  extractedText: string,
  aiInputText: string
): FileConsistencyCheck {
  const normUploaded = normalizeLegalText(uploadedFileText);
  const normExtracted = normalizeLegalText(extractedText);
  const normAiInput = normalizeLegalText(aiInputText);

  if (normExtracted !== normAiInput) {
    return {
      matches: false,
      mismatch_reason: 'The uploaded document could not be analysed because the extracted text does not match the uploaded file.'
    };
  }

  if (normUploaded && normUploaded !== normExtracted) {
    return {
      matches: false,
      mismatch_reason: 'The uploaded document could not be analysed because the extracted text does not match the uploaded file.'
    };
  }

  return { matches: true };
}
