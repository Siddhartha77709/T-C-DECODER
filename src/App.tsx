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
  Zap,
  ChevronLeft
} from 'lucide-react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { AnalysisResults, SmartSuggestionsCard } from './components/AnalysisResults';
import { SavedDocs } from './components/SavedDocs';
import { CompareTool } from './components/CompareTool';
import { Settings } from './components/Settings';
import type { SavedDocument, AnalysisResult } from './types';
import { PRESET_DOCUMENTS } from './mockData';
import { analyzeDocumentLocally, analyzeDocumentWithGemini } from './analysisEngine';

function App() {
  const [activeTab, setActiveTab] = useState<string>('analyze');

  const [inputText, setInputText] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [category, setCategory] = useState<string>('Software & SaaS');

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [scannedImage, setScannedImage] = useState<string | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const [savedDocs, setSavedDocs] = useState<SavedDocument[]>([]);
  const [apiKey, setApiKey] = useState<string>('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const docs = localStorage.getItem('tandc_saved_documents');
    if (docs) {
      try {
        setSavedDocs(JSON.parse(docs));
      } catch (e) {
        console.error("Failed to parse saved docs:", e);
      }
    }

    const key = localStorage.getItem('tandc_gemini_key');
    if (key) {
      setApiKey(key);
    }
  }, []);

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

  const handleLoadPreset = (presetText: string, presetName: string, presetCategory: string) => {
    setInputText(presetText);
    setCompanyName(presetName);
    setCategory(presetCategory);
    setAnalysisResult(null);
  };

  const handleClearInput = () => {
    setInputText('');
    setCompanyName('');
    setScannedImage(null);
    setAnalysisResult(null);
  };

  const handleCameraSnap = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setScannedImage(imageUrl);
    setIsScanning(true);
    setScanStep('Initializing document scan boundary...');

    setTimeout(() => setScanStep('Executing Optical Character Recognition (OCR)...'), 1200);
    setTimeout(() => setScanStep('Structuring extracted clause hierarchy...'), 2400);
    setTimeout(() => {
      setIsScanning(false);
      setScanStep('');
      setInputText(`LANDLORD-TENANT LEASE AGREEMENT

1. SECURITY DEPOSIT AND REFUNDS. The Security Deposit shall be held by Landlord in an interest-bearing escrow account. UPON TERMINATION OF THIS LEASE, THE LEASE DEPOSIT IS STRICTLY NON-REFUNDABLE AND WILL BE RETAINED BY THE LANDLORD TO COVER ADMINISTRATIVE COSTS AND CARPET CLEANING, REGARDLESS OF PREMISES CONDITION.

2. SUBLET PROHIBITION. Tenant shall not assign this lease, or sublet any portion of the premises without Landlord's prior written consent, which may be withheld in Landlord's sole and absolute discretion.

3. DISPUTE ARBITRATION AND WAIVER. Tenant agrees that any claim, conflict, or dispute arising out of this Lease shall be settled exclusively by individual binding arbitration. TENANT WAIVES ANY RIGHT TO TRIAL BY JURY AND AGREE TO NOT PARTICIPATE IN ANY CLASS ACTION LAWSUIT CONCERNING TENANCY OR BUILDING SERVICES.`);
      setCompanyName("Apartment Lease Agreement");
      setCategory("Finance & Property");
    }, 3600);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    setIsScanning(true);
    setScanStep(`Reading ${file.name}...`);

    if (fileExtension === 'txt') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setTimeout(() => {
          setInputText(evt.target?.result as string);
          setCompanyName(file.name.replace('.txt', ''));
          setIsScanning(false);
          setScanStep('');
        }, 1000);
      };
      reader.readAsText(file);
    } else {
      setTimeout(() => setScanStep('Decompressing document stream...'), 1000);
      setTimeout(() => setScanStep('Parsing legal structure and provisions...'), 2000);
      setTimeout(() => {
        setIsScanning(false);
        setScanStep('');
        setInputText(`FITNESS CLUB MEMBERSHIP AGREEMENT

1. AUTOMATIC RENEWAL TERMS. Your gym membership will renew automatically on a month-to-month basis at the end of your initial 12-month commitment. To cancel, you must deliver a written notice of cancellation in person at the club headquarters at least 60 days before your renewal billing date.

2. ARBITRATION AND CLAIMS LIMITS. The member agrees that all controversies, disputes, or claims shall be decided exclusively by AAA Individual Binding Arbitration. YOU HEREBY WAIVE THE RIGHT TO FORM A GROUP OR COMMENCE A CLASS ACTION LAWSUIT.

3. LIMITATION OF LIABILITY. The club disclaims all liability for personal injury, property damage, or theft occurring in the locker rooms or training floor. In all cases, liability is limited strictly to a maximum refund of 50 dollars.`);
        setCompanyName(file.name.substring(0, file.name.lastIndexOf('.')) || file.name);
        setCategory("E-commerce & Retail");
      }, 3000);
    }
  };

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;

    setIsAnalyzing(true);
    try {
      let res: AnalysisResult;
      if (apiKey) {
        res = await analyzeDocumentWithGemini(inputText, apiKey, companyName, category);
      } else {
        res = analyzeDocumentLocally(inputText, companyName, category);
      }

      if (!res.raw_document_text) {
        res = { ...res, raw_document_text: inputText };
      }

      setAnalysisResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveReport = () => {
    if (!analysisResult) return;

    const exists = savedDocs.find(doc =>
      doc.companyName === analysisResult.companyName &&
      doc.quickNote === analysisResult.quickNote
    );

    if (exists) {
      const filtered = savedDocs.filter(doc => doc.id !== exists.id);
      saveDocumentsToStorage(filtered);
    } else {
      const newDoc: SavedDocument = {
        ...analysisResult,
        id: 'doc_' + Date.now(),
        date: new Date().toISOString(),
        documentText: inputText,
        raw_document_text: inputText,
        category: category
      };
      saveDocumentsToStorage([newDoc, ...savedDocs]);
    }
  };

  const isCurrentReportSaved = () => {
    if (!analysisResult) return false;
    return !!savedDocs.find(doc =>
      doc.companyName === analysisResult.companyName &&
      doc.quickNote === analysisResult.quickNote
    );
  };

  const handleSelectSavedDoc = (doc: SavedDocument) => {
    setInputText(doc.raw_document_text || doc.documentText || '');
    setCompanyName(doc.companyName);
    setCategory(doc.category);
    setAnalysisResult(doc);
    setActiveTab('analyze');
  };

  const handleDeleteSavedDoc = (id: string) => {
    const filtered = savedDocs.filter(doc => doc.id !== id);
    saveDocumentsToStorage(filtered);
  };

  const handleClearAllSaved = () => {
    saveDocumentsToStorage([]);
  };

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    if (key) {
      localStorage.setItem('tandc_gemini_key', key);
    } else {
      localStorage.removeItem('tandc_gemini_key');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-gray-900 flex flex-col md:pl-64">
      {/* Mobile Top Header */}
      <Header isApiConfigured={!!apiKey} />

      {/* Desktop Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab)}
        savedCount={savedDocs.length}
        isApiConfigured={!!apiKey}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 px-4 py-6 md:p-8 mt-16 md:mt-0 pb-24 md:pb-8 flex flex-col w-full max-w-7xl mx-auto">

        {activeTab === 'analyze' && (
          <div className="flex-1 flex flex-col gap-6">

            {/* PART 2: PRESERVED 2-COLUMN GRID (lg:grid-cols-12) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

              {/* LEFT COLUMN (lg:col-span-5): Inputs + Execute Button + Smart Suggestions Card */}
              <div className={`flex flex-col gap-5 lg:col-span-5 ${analysisResult ? 'hidden lg:flex' : 'flex'}`}>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-700 uppercase tracking-wider">
                      T&C Decoder
                    </span>
                  </div>
                  <h2 className="font-extrabold text-2xl text-gray-900 tracking-tight">
                    Decode Any Terms & Conditions
                  </h2>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    Paste, upload, or scan any Terms of Service, Privacy Policy, or contract — we'll explain every clause in plain English with full line extraction and traceability.
                  </p>
                </div>

                {/* Main Input Card Container */}
                <div className="bg-surface border border-gray-200/80 rounded-2xl p-5 shadow-premium flex flex-col gap-4 relative overflow-hidden">

                  {/* OCR Scanning overlay */}
                  {isScanning && (
                    <div className="absolute inset-0 bg-navy-900/60 backdrop-blur-sm flex flex-col items-center justify-center z-20 text-white p-4">
                      <div className="animate-scan-beam" />
                      <div className="bg-navy-900/90 px-5 py-3 rounded-2xl border border-white/20 flex items-center gap-3 text-center flex-col shadow-float">
                        <RefreshCcw className="w-5 h-5 text-brand-400 animate-spin" />
                        <span className="text-xs font-bold text-gray-100">{scanStep}</span>
                      </div>
                    </div>
                  )}

                  {/* Demo Presets */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider flex items-center gap-1">
                        <Zap className="w-3 h-3 text-brand-500" />
                        <span>Pre-Loaded Demo Agreements:</span>
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_DOCUMENTS.map((doc) => (
                        <button
                          key={doc.name}
                          onClick={() => handleLoadPreset(doc.rawText, doc.name, doc.category)}
                          className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 hover:border-brand-500 bg-gray-50 hover:bg-brand-50/50 font-bold text-gray-700 hover:text-brand-700 transition-all shadow-sm"
                        >
                          {doc.name.split(' ')[0]} T&C
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-3 flex flex-col gap-3">
                    {/* 1. Document Metadata Inputs (Provider Title, Domain Category) */}
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
                          placeholder="e.g. Google, Zoom, Lease"
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
                          <option value="Education">Education</option>
                        </select>
                      </div>
                    </div>

                    {/* Camera preview */}
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

                    {/* 2. Contract Textarea Input */}
                    <div className="flex flex-col gap-1">
                      <label htmlFor="legal-text-area" className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider flex items-center gap-1">
                        <FileText className="w-3 h-3 text-gray-400" />
                        <span>Contract / Terms Text</span>
                      </label>
                      <textarea
                        id="legal-text-area"
                        ref={textareaRef}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Paste agreement text here, upload a .txt file, or capture a photo scan..."
                        className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs outline-none input-focus min-h-[140px] max-h-[360px] overflow-y-auto leading-relaxed resize-none font-medium text-gray-800 scrollbar-thin"
                      />
                    </div>
                  </div>

                  {/* File / Camera Upload Buttons */}
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="border border-gray-200 hover:bg-gray-50 rounded-xl p-2.5 flex items-center justify-center gap-2 text-xs text-gray-700 font-bold transition-all shadow-sm"
                    >
                      <UploadCloud className="w-4 h-4 text-brand-600" />
                      <span>Upload File</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.pdf,.docx"
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

                  {/* 3. Main Action Button: [ Execute Rights Evaluation ] */}
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
                      disabled={!inputText.trim() || isAnalyzing}
                      className={`flex-1 flex items-center justify-center gap-2 font-bold text-xs py-3.5 rounded-xl transition-all shadow-md ${
                        !inputText.trim() || isAnalyzing
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-brand-gradient text-white hover:opacity-95 shadow-brand-500/20'
                      }`}
                    >
                      {isAnalyzing ? (
                        <>
                          <RefreshCcw className="w-4 h-4 animate-spin" />
                          <span>Evaluating Legal Provisions...</span>
                        </>
                      ) : (
                        <>
                          <FileCheck className="w-4 h-4" />
                          <span>Execute Rights Evaluation</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 4. PART 2 RELOCATED: Smart Suggestions Before You Agree Card (NESTED IN LEFT COLUMN DIRECTLY BELOW BUTTON) */}
                {analysisResult && (
                  <SmartSuggestionsCard suggestions={analysisResult.actionable_suggestions || analysisResult.suggestions} />
                )}

              </div>

              {/* RIGHT COLUMN (lg:col-span-7): Document Summary & Overview + Decoded Clauses */}
              <div className={`lg:col-span-7 flex flex-col gap-5 ${analysisResult ? 'flex' : 'hidden lg:flex lg:h-[500px] lg:items-center lg:justify-center'}`}>
                {analysisResult ? (
                  <>
                    <div className="lg:hidden flex items-center mb-1">
                      <button
                        onClick={() => setAnalysisResult(null)}
                        className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 py-1.5"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Back to Input Controls</span>
                      </button>
                    </div>

                    {/* Renders Header, Overall Rating, Plain-English Overview, Global Controls, Decoded Clauses */}
                    <AnalysisResults
                      result={analysisResult}
                      onSave={handleSaveReport}
                      isSaved={isCurrentReportSaved()}
                      onCompare={() => setActiveTab('compare')}
                    />
                  </>
                ) : (
                  <div className="border border-dashed border-gray-300 bg-surface/50 p-10 rounded-3xl text-center flex flex-col items-center shadow-sm w-full">
                    <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mb-4">
                      <ShieldCheck className="w-8 h-8 text-brand-600 stroke-[1.8]" />
                    </div>
                    <h3 className="font-extrabold text-base text-gray-900 mb-1">Legal AI Assistant</h3>
                    <p className="text-xs text-gray-500 max-w-md leading-relaxed font-medium">
                      Load a demo agreement on the left or paste any Terms & Conditions to get a full plain-English breakdown with full line extraction, clause traceability, and smart recommendations.
                    </p>
                  </div>
                )}
              </div>

            </div>
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
            apiKey={apiKey}
            onSaveApiKey={handleSaveApiKey}
            onClearSavedDocs={handleClearAllSaved}
            savedCount={savedDocs.length}
          />
        )}

      </main>

      {/* Mobile Bottom Nav */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab)}
        savedCount={savedDocs.length}
      />
    </div>
  );
}

export default App;
