'use client';
import { useState, useEffect } from 'react';

export default function Upload() {
  const [docId, setDocId] = useState<string | null>(null);
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!docId || ['validated', 'needs_review', 'failed'].includes(status)) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ingest/status/${docId}`, {
          credentials: 'include'
        });
        const json = await res.json();
        setStatus(json.status);
        setResult(json);
      } catch (e) {
        console.error('Polling failed:', e);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [docId, status]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('uploading');
    const form = e.currentTarget;
    const data = new FormData(form);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ingest`, {
        method: 'POST',
        body: data,
        credentials: 'include'
      });
      const json = await res.json();
      setDocId(json.id);
      setStatus(json.status);
      setResult(json);
    } catch (e) {
      setStatus('Failed to upload');
    }
  };

  const onClear = () => {
    setDocId(null);
    setStatus('idle');
    setResult(null);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="space-y-2">
        <input type="file" name="file" accept=".pdf,.png,.jpg" required className="block" />
        <input type="text" name="customerId" placeholder="Customer ID" className="border p-1" />
        <input type="text" name="source" placeholder="Source" className="border p-1" />
        <div className="flex space-x-2">
          <button type="submit" disabled={status === 'uploading'} className="bg-black disabled:bg-gray-400 text-white px-4 py-2 rounded">
            {status === 'uploading' ? 'Uploading...' : 'Upload'}
          </button>
          <button type="reset" onClick={onClear} className="bg-gray-200 text-black px-4 py-2 rounded hover:bg-gray-300 transition-colors">
            Clear
          </button>
          {status === 'needs_review' && docId && (
            <a href={`/review/${docId}`} className="bg-red-600 text-white px-4 py-2 rounded font-medium hover:bg-red-700 transition">
              Review Document &rarr;
            </a>
          )}
        </div>
      </form>
      <p>Status: <span className="font-semibold">{status}</span></p>
      {result && <pre className="bg-white p-4 text-xs overflow-auto rounded border">{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
