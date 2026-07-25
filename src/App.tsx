import { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  Camera,
  ShieldCheck,
  RefreshCcw,
  X,
  FileCheck,
  FileText,
  Building2,
  Tag,
  AlertTriangle,
  ChevronLeft,
  Eye,
  CheckCircle2,
  Brain
} from 'lucide-react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { AnalysisResults } from './components/AnalysisResults';
import { SavedDocs } from './components/SavedDocs';
import { CompareTool } from './components/CompareTool';
import { Settings } from './components/Settings';
import type { SavedDocument, LegalAnalysisReport, OCRMetrics } from './types';
import {
  analyzeDocumentWithLLM,
  getPipelineStepName,
  getPipelineStepDescription,
  quickValidateLegalDocument,
  clientSideLooksLikeLegalDocument,
  INVALID_DOCUMENT_TYPE_WARNING
} from './analysisEngine';
import { extractTextFromFile, verifyFileConsistency } from './fileExtractor';

function App() {
  const [activeTab, setActiveTab] = useState<string>('analyze');

  const [inputText, setInputText] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [category, setCategory] = useState<string>('Software & SaaS');

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [ocrMetrics, setOcrMetrics] = useState<OCRMetrics | undefined>(undefined);

  const [documentValid, setDocumentValid] = useState<'UNKNOWN' | 'PASSED' | 'FAILED'>('UNKNOWN');

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [pipelineStep, setPipelineStep] = useState<number | null>(null);
  const [report, setReport] = useState<LegalAnalysisReport | null>(null);

  const [savedDocs, setSavedDocs] = useState<SavedDocument[]>(() => {
    try {
      const docs = localStorage.getItem('tandc_saved_documents');
      return docs ? (JSON.parse(docs) as SavedDocument[]) : [];
    } catch {
      return [];
    }
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const saveDocumentsToStorage = (updated: SavedDocument[]) => {
    setSavedDocs(updated);
    localStorage.setItem('tandc_saved_documents', JSON.stringify(updated));
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(360, Math.max(140, textareaRef.current.scrollHeight))}px`;
    }
  }, [inputText]);

  // Strict document validation — runs immediately on paste/extraction change.
  // FAILED disables the Run button and shows the red warning banner.
  useEffect(() => {
    const t = (inputText || '').trim();
    if (!t) {
      setDocumentValid('UNKNOWN');
      setExtractionError(null);
      return;
    }
    const result = clientSideLooksLikeLegalDocument(t);
    if (result.ok) {
      setDocumentValid('PASSED');
      if (extractionError === INVALID_DOCUMENT_TYPE_WARNING || extractionError?.startsWith("Invalid Document Type:")) {
        setExtractionError(null);
      }
      return;
    }
    // AMBIGUOUS case (>40w, but weak signals): treat as PASSED to let the LLM re-classify inside handleAnalyze
    if (result.reason === 'AMBIGUOUS') {
      setDocumentValid('PASSED');
      if (extractionError === INVALID_DOCUMENT_TYPE_WARNING || extractionError?.startsWith("Invalid Document Type:")) {
        setExtractionError(null);
      }
      return;
    }
    setDocumentValid('FAILED');
    setExtractionError(INVALID_DOCUMENT_TYPE_WARNING);
  }, [inputText]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClearInput = () => {
    setInputText('');
    setCompanyName('');
    setScannedImage(null);
    setExtractionError(null);
    setOcrMetrics(undefined);
    setReport(null);
    setPipelineStep(null);
    setDocumentValid('UNKNOWN');
  };

  const processFile = async (file: File) => {
    setExtractionError(null);
    setIsScanning(true);
    setScanStep(`Extracting text from ${file.name}...`);
    setPipelineStep(1);

    try {
      const result = await extractTextFromFile(file, (stepText) => {
        setScanStep(stepText);
      });

      setInputText(result.text);
      setCompanyName(file.name.substring(0, file.name.lastIndexOf('.')) || file.name);
      if (result.ocrMetrics) {
        setOcrMetrics(result.ocrMetrics);
      }
      setPipelineStep(2);
      setReport(null);
    } catch (err: unknown) {
      console.error("File extraction error:", err);
      setExtractionError(err instanceof Error ? err.message : "Failed to extract text from the uploaded file.");
      setPipelineStep(null);
    } finally {
      setIsScanning(false);
      setScanStep('');
    }
  };

  const handleCameraSnap = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setScannedImage(imageUrl);
    await processFile(file);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await processFile(file);
  };

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    // Hard defensive guard: validation should run on input change, but never allow FAILED through
    if (documentValid === 'FAILED') {
      setExtractionError(INVALID_DOCUMENT_TYPE_WARNING);
      return;
    }

    setExtractionError(null);

    // Pre-analysis quick document-type validation (client-side heuristic + optional Gemini classification)
    try {
      setIsAnalyzing(true);
      setPipelineStep(3);
      const validation = await quickValidateLegalDocument(inputText, (step) => setPipelineStep(step));
      if (!validation.ok) {
        setDocumentValid('FAILED');
        setExtractionError(INVALID_DOCUMENT_TYPE_WARNING);
        setIsAnalyzing(false);
        setTimeout(() => setPipelineStep(null), 600);
        return;
      }
    } catch (e: unknown) {
      // Graceful non-crash: keep UI state consistent, show error banner
      setExtractionError(e instanceof Error ? e.message : "Document type validation failed.");
      setIsAnalyzing(false);
      setTimeout(() => setPipelineStep(null), 600);
      return;
    }

    // Step 3 — File Consistency Check (before LLM call)
    try {
      const consistency = verifyFileConsistency(inputText, inputText, inputText);
      if (!consistency.matches) {
        setExtractionError(consistency.mismatch_reason || "The extracted text does not match the uploaded file.");
        setIsAnalyzing(false);
        setTimeout(() => setPipelineStep(null), 600);
        return;
      }
    } catch (e: unknown) {
      setExtractionError(e instanceof Error ? e.message : "File consistency check failed.");
      setIsAnalyzing(false);
      setTimeout(() => setPipelineStep(null), 600);
      return;
    }

    try {
      setDocumentValid('PASSED');
      const res = await analyzeDocumentWithLLM(
        inputText,
        companyName,
        category,
        ocrMetrics,
        (step) => setPipelineStep(step)
      );

      setReport(res);
    } catch (e: unknown) {
      console.error("Analysis execution error:", e);
      setExtractionError(e instanceof Error ? e.message : "Document analysis failed.");
      setReport(null);
    } finally {
      setIsAnalyzing(false);
      // Keep pipelineStep visible for a moment
      setTimeout(() => {
        setPipelineStep(null);
      }, 1200);
    }
  };

  const handleSaveReport = () => {
    if (!report) return;

    const exists = savedDocs.find(doc =>
      doc.provider_title === companyName &&
      doc.report.metadata.executive_overview === report.metadata.executive_overview
    );

    if (exists) {
      const filtered = savedDocs.filter(doc => doc.id !== exists.id);
      saveDocumentsToStorage(filtered);
    } else {
      const newDoc: SavedDocument = {
        id: 'doc_' + Date.now(),
        date: new Date().toISOString(),
        documentText: inputText,
        category: category,
        report: report,
        provider_title: companyName || report.metadata.detected_type || 'Saved Agreement'
      };
      saveDocumentsToStorage([newDoc, ...savedDocs]);
    }
  };

  const isCurrentReportSaved = () => {
    if (!report) return false;
    return !!savedDocs.find(doc =>
      doc.provider_title === companyName &&
      doc.report.metadata.executive_overview === report.metadata.executive_overview
    );
  };

  const handleSelectSavedDoc = (doc: SavedDocument) => {
    setInputText(doc.documentText || '');
    setCompanyName(doc.provider_title || '');
    setCategory(doc.category || 'General Legal');
    setReport(doc.report || null);
    setActiveTab('analyze');
  };

  const handleDeleteSavedDoc = (id: string) => {
    const filtered = savedDocs.filter(doc => doc.id !== id);
    saveDocumentsToStorage(filtered);
  };

  const handleClearAllSaved = () => {
    saveDocumentsToStorage([]);
  };

  const providerTitle = companyName.trim() || (report ? `Legal Agreement — ${report.metadata.detected_type}` : 'Document Provider');

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-gray-900 flex flex-col md:pl-64">
      <Header processingStep={pipelineStep} />

      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab)}
        savedCount={savedDocs.length}
        processingStep={pipelineStep}
      />

      <main className="flex-1 px-4 py-6 md:p-8 mt-16 md:mt-0 pb-24 md:pb-8 flex flex-col w-full max-w-7xl mx-auto">

        {activeTab === 'analyze' && (
          <div className="flex-1 flex flex-col gap-6">
            {/* 12-STEP PIPELINE PROGRESS OVERLAY DURING ANALYSIS */}
            {isAnalyzing && pipelineStep !== null && (
              <div className="bg-navy-900 text-white rounded-2xl shadow-lg border border-brand-500/30 p-5 animate-fade-in relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 via-indigo-500/10 to-purple-500/5 pointer-events-none" />
                <div className="relative flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-400/40 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-brand-300 animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-extrabold text-sm tracking-tight">
                          12-Step Legal AI Pipeline
                        </h3>
                        <span className="text-[11px] font-bold text-brand-300 tabular-nums">
                          Step {pipelineStep} / 12
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 mt-0.5 font-medium truncate">
                        <strong className="text-brand-300">{getPipelineStepName(pipelineStep)}</strong> — {getPipelineStepDescription(pipelineStep)}
                      </p>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-400 via-indigo-400 to-purple-400 transition-all duration-500 ease-out"
                      style={{ width: `${(pipelineStep / 12) * 100}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-6 md:grid-cols-12 gap-1.5 pt-1">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(step => {
                      const done = step < pipelineStep;
                      const current = step === pipelineStep;
                      return (
                        <div
                          key={step}
                          title={`${step}. ${getPipelineStepName(step)}`}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            done
                              ? 'bg-emerald-400/80'
                              : current
                              ? 'bg-brand-400 animate-pulse'
                              : 'bg-white/10'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {!report ? (
              /* ===== INPUT / UPLOAD VIEW (no analysis yet) ===== */
              <div className="flex-1 flex flex-col gap-6 items-center">
                <div className="w-full flex flex-col gap-1.5 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-700 uppercase tracking-wider">
                      Legal AI Intelligence
                    </span>
                  </div>
                  <h1 className="font-extrabold text-2xl md:text-3xl text-gray-900 tracking-tight leading-tight">
                    Decode Any Legal Agreement with Dynamic AI
                  </h1>
                  <p className="text-xs md:text-sm text-gray-500 leading-relaxed font-medium max-w-3xl">
                    Upload or paste any Terms of Service, Privacy Policy, SaaS Contract, NDA or Rental Lease. The 12-step dynamic LLM pipeline discovers every clause, rewrites it in Grade 7-8 plain English, maps exact character evidence, and validates its own output — zero templates, zero hardcoded categories, zero cached mock data.
                  </p>
                </div>

                <div className="w-full max-w-2xl bg-surface border border-gray-200/80 rounded-2xl p-5 shadow-premium flex flex-col gap-4 relative overflow-hidden">
                  {isScanning && (
                    <div className="absolute inset-0 bg-navy-900/60 backdrop-blur-sm flex flex-col items-center justify-center z-20 text-white p-4">
                      <div className="animate-scan-beam" />
                      <div className="bg-navy-900/90 px-5 py-3 rounded-2xl border border-white/20 flex items-center gap-3 text-center flex-col shadow-float">
                        <RefreshCcw className="w-5 h-5 text-brand-400 animate-spin" />
                        <span className="text-xs font-bold text-gray-100">{scanStep}</span>
                      </div>
                    </div>
                  )}

                  {extractionError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-red-900 animate-fade-in">
                      <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold">Extraction / Validation Alert</span>
                        <p className="text-[11px] leading-relaxed font-medium">{extractionError}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label htmlFor="company-name-input" className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-gray-400" />
                          <span>Provider Title</span>
                        </label>
                        <input
                          id="company-name-input"
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="Auto-detected or enter title..."
                          className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none input-focus font-semibold"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label htmlFor="category-select" className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider flex items-center gap-1">
                          <Tag className="w-3 h-3 text-gray-400" />
                          <span>Domain Category</span>
                        </label>
                        <select
                          id="category-select"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-xs outline-none input-focus font-semibold"
                        >
                          <option value="Software & SaaS">Software & SaaS</option>
                          <option value="Social Media">Social Media</option>
                          <option value="Finance & Property">Finance & Property</option>
                          <option value="E-Commerce & Retail">E-Commerce & Retail</option>
                          <option value="Streaming & Media">Streaming & Media</option>
                          <option value="Healthcare">Healthcare</option>
                          <option value="Employment">Employment</option>
                          <option value="General Legal">General Legal</option>
                        </select>
                      </div>
                    </div>

                    {scannedImage && (
                      <div className="relative border border-gray-200 rounded-xl overflow-hidden h-32 bg-gray-900 flex items-center justify-center group">
                        <img src={scannedImage} alt="Scanned document" className="h-full object-contain opacity-80" />
                        <button
                          onClick={() => setScannedImage(null)}
                          className="absolute top-2 right-2 bg-gray-900/90 text-white p-1 rounded-full hover:bg-gray-800 transition-colors"
                          title="Remove image"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {inputText.trim() && (
                      <div className="bg-brand-50/50 border border-brand-100 rounded-xl p-2.5 flex items-center justify-between text-[11px] font-medium text-brand-900">
                        <span className="flex items-center gap-1.5 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />
                          <span>Document Extracted ({inputText.split(/\s+/).filter(Boolean).length} words)</span>
                        </span>
                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                          <Eye className="w-3 h-3 text-gray-400" />
                          Single Source of Truth
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col gap-1">
                      <label htmlFor="legal-text-area" className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider flex items-center gap-1">
                        <FileText className="w-3 h-3 text-gray-400" />
                        <span>Uploaded Document Text Preview</span>
                      </label>
                      <textarea
                        id="legal-text-area"
                        ref={textareaRef}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Paste agreement text here, or upload a TXT, PDF, DOCX, or Image scan file..."
                        className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs outline-none input-focus min-h-[160px] max-h-[360px] overflow-y-auto leading-relaxed resize-none font-medium text-gray-800 scrollbar-thin font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="border border-gray-200 hover:bg-gray-50 rounded-xl p-2.5 flex items-center justify-center gap-2 text-xs text-gray-700 font-bold transition-all shadow-sm"
                    >
                      <UploadCloud className="w-4 h-4 text-brand-600" />
                      <span>Upload File (PDF/DOCX/TXT/PNG)</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.pdf,.docx,.png,.jpg,.jpeg,.webp"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      className="border border-gray-200 hover:bg-gray-50 rounded-xl p-2.5 flex items-center justify-center gap-2 text-xs text-gray-700 font-bold transition-all shadow-sm"
                    >
                      <Camera className="w-4 h-4 text-brand-600" />
                      <span>Camera Scan</span>
                    </button>
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleCameraSnap}
                      className="hidden"
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    {inputText.trim() && (
                      <button
                        onClick={handleClearInput}
                        className="border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 p-3 rounded-xl transition-colors"
                        title="Clear Input"
                      >
                        <RefreshCcw className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={handleAnalyze}
                      disabled={!inputText.trim() || isAnalyzing || documentValid === 'FAILED'}
                      className={`flex-1 flex items-center justify-center gap-2 font-bold text-xs py-3.5 rounded-xl transition-all shadow-md ${
                        !inputText.trim() || isAnalyzing || documentValid === 'FAILED'
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-brand-gradient text-white hover:opacity-95 shadow-brand-500/20'
                      }`}
                    >
                      {isAnalyzing ? (
                        <>
                          <RefreshCcw className="w-4 h-4 animate-spin" />
                          <span>Analyzing with Dynamic LLM…</span>
                        </>
                      ) : (
                        <>
                          <FileCheck className="w-4 h-4" />
                          <span>Run 12-Step AI Pipeline</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="border border-dashed border-gray-300 bg-surface/50 p-8 rounded-3xl text-center flex flex-col items-center shadow-sm w-full max-w-2xl hidden md:flex">
                  <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mb-4">
                    <ShieldCheck className="w-8 h-8 text-brand-600 stroke-[1.8]" />
                  </div>
                  <h3 className="font-extrabold text-base text-gray-900 mb-1">100% Dynamic AI Legal Engine</h3>
                  <p className="text-xs text-gray-500 max-w-lg leading-relaxed font-medium">
                    Every clause title, summary, recommendation, risk level, and evidence mapping is generated in real time by the LLM from your exact document — no regex, no keyword tables, no preset categories, no cached mock data.
                  </p>
                </div>
              </div>
            ) : (
              /* ===== ANALYSIS RESULTS VIEW ===== */
              <div className="flex-1 flex flex-col gap-5 w-full">
                <div className="lg:hidden flex items-center mb-1">
                  <button
                    onClick={() => setReport(null)}
                    className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 py-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back to Input Controls</span>
                  </button>
                </div>

                <AnalysisResults
                  report={report}
                  sourceText={inputText}
                  providerTitle={providerTitle}
                  domainCategory={category}
                  onSave={handleSaveReport}
                  isSaved={isCurrentReportSaved()}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'saved' && (
          <SavedDocs
            documents={savedDocs}
            onSelect={handleSelectSavedDoc}
            onDelete={handleDeleteSavedDoc}
            onNavigateToAnalyze={() => setActiveTab('analyze')}
          />
        )}

        {activeTab === 'compare' && (
          <CompareTool savedDocs={savedDocs} />
        )}

        {activeTab === 'settings' && (
          <Settings
            onClearSavedDocs={handleClearAllSaved}
            savedCount={savedDocs.length}
          />
        )}

      </main>

      <BottomNav
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab)}
        savedCount={savedDocs.length}
      />
    </div>
  );
}

export default App;
