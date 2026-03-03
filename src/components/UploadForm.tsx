import { useState, useRef } from 'react';
import ReviewForm from './ReviewForm';
import type { GeminiExtraction } from '../lib/types';

interface UploadResult {
  image_url: string;
  image_path: string;
  extraction: GeminiExtraction | null;
}

export default function UploadForm({ onEventCreated }: { onEventCreated: () => void }) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError('');
    setUploadResult(null);
    setUploading(true);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Errore nel caricamento');
        return;
      }

      setUploadResult(data);
    } catch {
      setError('Errore di connessione');
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleReset() {
    setUploadResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  if (uploadResult) {
    return (
      <ReviewForm
        imageUrl={uploadResult.image_url}
        imagePath={uploadResult.image_path}
        extraction={uploadResult.extraction}
        onCancel={handleReset}
        onSaved={() => {
          handleReset();
          onEventCreated();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Carica locandina</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileInput}
          className="hidden"
        />
        {uploading ? (
          <div className="space-y-2">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-text-muted">Caricamento e analisi AI in corso...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16v-8m0 0l-3 3m3-3l3 3M3 16.5V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18v-1.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-text-muted">
              Trascina qui un'immagine o <span className="text-primary font-medium">sfoglia</span>
            </p>
            <p className="text-sm text-text-muted">JPEG, PNG o WebP - max 5MB</p>
          </div>
        )}
      </div>
    </div>
  );
}
