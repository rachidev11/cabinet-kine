'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Download,
  Trash2,
  ZoomIn,
  X,
  Plus,
  FileCheck,
  AlertCircle,
  FileText,
  Activity,
  Layers,
  Sparkles,
  Lock,
} from 'lucide-react';

export type MedicalDocCategory =
  | 'Radio'
  | 'IRM'
  | 'Scanner'
  | 'Échographie'
  | 'Ordonnance'
  | 'Compte-rendu';

export interface MedicalDocument {
  id: string;
  patient_id: string;
  title: string;
  category: MedicalDocCategory;
  date: string;
  imageDataUrl: string;
  fileSizeKb: number;
  originalSizeKb?: number;
  notes?: string;
  uploaded_at: string;
}

interface MedicalDocumentsGalleryProps {
  patientId: string;
  patientName: string;
  medicalDocs: MedicalDocument[];
  onAddDocument: (doc: MedicalDocument) => void;
  onDeleteDocument: (docId: string) => void;
  isKine: boolean;
}

export const CATEGORIES: { key: string; label: string; color: string; badge: string }[] = [
  { key: 'Tous', label: 'Tous les documents', color: 'bg-slate-100 text-slate-700', badge: 'bg-slate-200' },
  { key: 'Radio', label: 'Radiographies', color: 'bg-sky-50 text-sky-700 border-sky-200', badge: 'bg-sky-600' },
  { key: 'IRM', label: 'IRM', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', badge: 'bg-indigo-600' },
  { key: 'Scanner', label: 'Scanner / TDM', color: 'bg-purple-50 text-purple-700 border-purple-200', badge: 'bg-purple-600' },
  { key: 'Échographie', label: 'Échographies', color: 'bg-teal-50 text-teal-700 border-teal-200', badge: 'bg-teal-600' },
  { key: 'Ordonnance', label: 'Ordonnances', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', badge: 'bg-emerald-600' },
  { key: 'Compte-rendu', label: 'Comptes-rendus', color: 'bg-amber-50 text-amber-700 border-amber-200', badge: 'bg-amber-600' },
];

export default function MedicalDocumentsGallery({
  patientId,
  patientName,
  medicalDocs,
  onAddDocument,
  onDeleteDocument,
  isKine,
}: MedicalDocumentsGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [lightboxDoc, setLightboxDoc] = useState<MedicalDocument | null>(null);

  // Upload Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MedicalDocCategory>('Radio');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressedDataUrl, setCompressedDataUrl] = useState<string | null>(null);
  const [originalSizeKb, setOriginalSizeKb] = useState<number>(0);
  const [compressedSizeKb, setCompressedSizeKb] = useState<number>(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionRatio, setCompressionRatio] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Client-side image compression using HTML5 Canvas
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setSelectedFile(file);
    const origKb = Math.max(1, Math.round(file.size / 1024));
    setOriginalSizeKb(origKb);
    setIsCompressing(true);

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const maxWidth = 1280;
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setUploadError('Canvas non supporté par ce navigateur.');
            setIsCompressing(false);
            return;
          }

          // Smooth rendering
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
          const compKb = Math.max(1, Math.round((dataUrl.length * 3) / 4 / 1024));
          const gain = Math.max(0, Math.round(((origKb - compKb) / origKb) * 100));

          setCompressedDataUrl(dataUrl);
          setCompressedSizeKb(compKb);
          setCompressionRatio(gain);
          setIsCompressing(false);

          if (!title) {
            const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
            setTitle(fileNameWithoutExt);
          }
        };
        img.onerror = () => {
          setUploadError("Impossible de charger l'image.");
          setIsCompressing(false);
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = () => {
        setUploadError('Erreur de lecture du fichier.');
        setIsCompressing(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setUploadError('Erreur lors de la compression.');
      setIsCompressing(false);
    }
  };

  const handleSaveDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setUploadError('Veuillez renseigner un titre pour le document.');
      return;
    }
    if (!compressedDataUrl) {
      setUploadError('Veuillez sélectionner une image à téléverser.');
      return;
    }

    const newDoc: MedicalDocument = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      patient_id: patientId,
      title: title.trim(),
      category,
      date,
      imageDataUrl: compressedDataUrl,
      fileSizeKb: compressedSizeKb,
      originalSizeKb: originalSizeKb,
      notes: notes.trim(),
      uploaded_at: new Date().toISOString(),
    };

    onAddDocument(newDoc);

    // Reset Form
    setTitle('');
    setCategory('Radio');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setSelectedFile(null);
    setCompressedDataUrl(null);
    setOriginalSizeKb(0);
    setCompressedSizeKb(0);
    setCompressionRatio(0);
    setUploadError(null);
    setIsUploadModalOpen(false);
  };

  const handleDownload = (doc: MedicalDocument) => {
    const link = document.createElement('a');
    link.href = doc.imageDataUrl;
    link.download = `${doc.category}_${patientName.replace(/\s+/g, '_')}_${doc.date}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredDocs = medicalDocs.filter((doc) => {
    if (selectedCategory === 'Tous') return true;
    return doc.category === selectedCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Upload Action */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#0B57D0]" />
              <span>Galerie des Radios & Documents Médicaux</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-[#0B57D0] text-xs font-bold">
              {medicalDocs.length} document{medicalDocs.length > 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Imagerie médicale, clichés radiographiques, scanners, ordonnances et comptes-rendus avec compression haute performance.
          </p>
        </div>

        {isKine && (
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0B57D0] to-[#0D47A1] hover:brightness-110 text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer shrink-0"
          >
            <UploadCloud className="w-4 h-4 text-[#FF7A45]" />
            <span>Ajouter Radio / Document</span>
          </button>
        )}
      </div>

      {/* Compression Feature Badge */}
      <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-blue-50/80 border border-blue-200/70 rounded-2xl p-4 flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-[#0B57D0] text-white flex items-center justify-center shrink-0 shadow-xs">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="text-xs text-slate-700 leading-relaxed">
          <span className="font-bold text-[#0D47A1] block text-sm">
            Compression Automatique Haute Définition
          </span>
          Les photos et scanners haute résolution (2MB - 10MB) sont automatiquement optimisés côté client en JPEG léger (~75KB - 150KB) sans perte diagnostique visible, garantissant un chargement instantané.
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => {
          const count =
            cat.key === 'Tous'
              ? medicalDocs.length
              : medicalDocs.filter((d) => d.category === cat.key).length;
          const isActive = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-2 border ${
                isActive
                  ? 'bg-[#0B57D0] text-white border-[#0B57D0] shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Documents Grid */}
      {filteredDocs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0B57D0] flex items-center justify-center mx-auto">
            <ImageIcon className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Aucun document médical</h3>
          <p className="text-xs text-slate-500">
            {selectedCategory === 'Tous'
              ? 'Aucune radiographie ou ordonnance enregistrée pour ce patient.'
              : `Aucun document dans la catégorie "${selectedCategory}".`}
          </p>
          {isKine && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#0B57D0] hover:bg-[#0D47A1] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Téléverser le premier document</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocs.map((doc) => {
            const catInfo = CATEGORIES.find((c) => c.key === doc.category);
            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
              >
                {/* Thumbnail Preview with Lightbox Trigger */}
                <div
                  onClick={() => setLightboxDoc(doc)}
                  className="relative aspect-video bg-slate-950 overflow-hidden cursor-pointer flex items-center justify-center"
                >
                  <img
                    src={doc.imageDataUrl}
                    alt={doc.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Category Pill */}
                  <span
                    className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border shadow-xs ${
                      catInfo?.color || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {doc.category}
                  </span>

                  {/* Size & Gain Badge */}
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-md">
                    {doc.fileSizeKb} KB
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <span className="p-2.5 rounded-xl bg-white/90 text-slate-900 shadow-md transform scale-90 group-hover:scale-100 transition-transform">
                      <ZoomIn className="w-5 h-5" />
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-1">
                      <span>Date : {doc.date}</span>
                      {doc.originalSizeKb && doc.originalSizeKb > doc.fileSizeKb && (
                        <span className="text-emerald-600 font-bold">
                          Gain -{Math.round(((doc.originalSizeKb - doc.fileSizeKb) / doc.originalSizeKb) * 100)}%
                        </span>
                      )}
                    </div>
                    <h3
                      onClick={() => setLightboxDoc(doc)}
                      className="font-bold text-slate-900 text-sm hover:text-[#0B57D0] transition-colors cursor-pointer line-clamp-1"
                      title={doc.title}
                    >
                      {doc.title}
                    </h3>
                    {doc.notes && (
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {doc.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => setLightboxDoc(doc)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B57D0] hover:text-[#0D47A1] transition-colors cursor-pointer"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>Agrandir</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDownload(doc)}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                        title="Télécharger l'image"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      {isKine && (
                        <button
                          onClick={() => onDeleteDocument(doc.id)}
                          className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                          title="Supprimer le document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#0B57D0] flex items-center justify-center font-bold">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Ajouter un Document Médical
                  </h3>
                  <p className="text-xs text-slate-500">Dossier de {patientName}</p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDocument} className="space-y-4">
              {/* File Selector Dropzone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Fichier Image / Radiographie *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                {!compressedDataUrl ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-[#0B57D0] bg-slate-50/60 hover:bg-blue-50/40 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#0B57D0] flex items-center justify-center mx-auto">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-700">
                      Cliquez pour sélectionner une photo ou un fichier
                    </p>
                    <p className="text-[11px] text-slate-400">
                      JPG, PNG, WEBP (compression automatique immédiate)
                    </p>
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 p-2">
                    <img
                      src={compressedDataUrl}
                      alt="Aperçu"
                      className="max-h-48 mx-auto object-contain rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCompressedDataUrl(null);
                        setSelectedFile(null);
                      }}
                      className="absolute top-4 right-4 p-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-700 shadow-md cursor-pointer"
                      title="Changer de fichier"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {/* Compression Feedback Banner */}
                    <div className="mt-2 p-2 bg-emerald-950/80 rounded-xl border border-emerald-500/40 text-[11px] text-emerald-200 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Original: {originalSizeKb} KB → Compressé: {compressedSizeKb} KB
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-black font-extrabold text-[10px]">
                        -{compressionRatio}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Titre du document *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Radio Genou Droit Face / Profil"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0]"
                />
              </div>

              {/* Category & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catégorie
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as MedicalDocCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0] bg-white"
                  >
                    <option value="Radio">Radiographie</option>
                    <option value="IRM">IRM</option>
                    <option value="Scanner">Scanner / TDM</option>
                    <option value="Échographie">Échographie</option>
                    <option value="Ordonnance">Ordonnance</option>
                    <option value="Compte-rendu">Compte-rendu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date du cliché
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0]"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observations / Remarques cliniques
                </label>
                <textarea
                  rows={2}
                  placeholder="Observations sur l'examen, médecin prescripteur, détails du cliché..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B57D0] resize-none"
                />
              </div>

              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isCompressing || !compressedDataUrl}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0B57D0] to-[#0D47A1] hover:brightness-110 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isCompressing ? 'Compression en cours...' : 'Enregistrer le Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full-Screen Lightbox Modal */}
      {lightboxDoc && (
        <div
          onClick={() => setLightboxDoc(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in duration-200"
        >
          {/* Lightbox Header */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl flex items-center justify-between text-white pb-3 border-b border-white/10"
          >
            <div>
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-white/20 text-white">
                  {lightboxDoc.category}
                </span>
                <span className="text-xs text-slate-400">Date : {lightboxDoc.date}</span>
                <span className="text-xs text-emerald-400 font-mono font-bold">
                  {lightboxDoc.fileSizeKb} KB
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">{lightboxDoc.title}</h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDownload(lightboxDoc)}
                className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Télécharger</span>
              </button>
              <button
                onClick={() => setLightboxDoc(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Main Image Preview */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex-1 flex items-center justify-center p-2 sm:p-4 max-w-5xl max-h-[75vh] w-full"
          >
            <img
              src={lightboxDoc.imageDataUrl}
              alt={lightboxDoc.title}
              className="max-h-full max-w-full object-contain rounded-xl shadow-2xl border border-white/10"
            />
          </div>

          {/* Lightbox Footer Notes */}
          {lightboxDoc.notes && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-5xl bg-white/10 backdrop-blur-sm p-3.5 rounded-xl text-xs text-slate-300 mt-2 border border-white/10"
            >
              <span className="font-bold text-white block mb-0.5">Observations :</span>
              {lightboxDoc.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
