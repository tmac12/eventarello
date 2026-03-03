import { useState } from 'react';
import type { GeminiExtraction } from '../lib/types';

interface Props {
  imageUrl: string;
  imagePath: string;
  extraction: GeminiExtraction | null;
  onCancel: () => void;
  onSaved: () => void;
}

export default function ReviewForm({ imageUrl, imagePath, extraction, onCancel, onSaved }: Props) {
  const [title, setTitle] = useState(extraction?.title || '');
  const [eventDate, setEventDate] = useState(
    extraction?.event_date ? extraction.event_date.slice(0, 16) : '',
  );
  const [location, setLocation] = useState(extraction?.location || '');
  const [description, setDescription] = useState(extraction?.description || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(status: 'draft' | 'published') {
    setError('');
    setSaving(true);

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          event_date: new Date(eventDate).toISOString(),
          location,
          description: description || undefined,
          image_url: imageUrl,
          image_path: imagePath,
          status,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Errore nel salvataggio');
        return;
      }

      onSaved();
    } catch {
      setError('Errore di connessione');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Rivedi dati evento</h2>
        {extraction && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
            Dati estratti da AI
          </span>
        )}
        {!extraction && (
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
            Estrazione AI fallita - compila manualmente
          </span>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <img
            src={imageUrl}
            alt="Locandina caricata"
            className="w-full rounded-lg shadow-md object-cover max-h-80"
          />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Titolo *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Data e ora *</label>
            <input
              type="datetime-local"
              required
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Luogo *</label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descrizione</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Annulla
        </button>
        <button
          type="button"
          onClick={() => handleSubmit('draft')}
          disabled={saving || !title || !eventDate || !location}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
        >
          Salva bozza
        </button>
        <button
          type="button"
          onClick={() => handleSubmit('published')}
          disabled={saving || !title || !eventDate || !location}
          className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
        >
          {saving ? 'Salvataggio...' : 'Pubblica'}
        </button>
      </div>
    </div>
  );
}
