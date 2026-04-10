'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ReviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const [doc, setDoc] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchDoc = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ingest/status/${id}`, {
          credentials: 'include'
        });
        const data = await res.json();
        setDoc(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [id]);

  const handleReprocess = async () => {
    try {
      setLoading(true);
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ingest/reprocess/${id}`, {
        method: 'POST',
        credentials: 'include'
      });
      router.push('/');
    } catch (e) {
      console.error('Failed to reprocess', e);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 font-semibold animate-pulse text-lg">Loading document...</div>;
  }

  if (!doc) {
    return <div className="p-8 text-red-500 font-semibold text-lg">Document not found</div>;
  }

  const isFailed = doc.validationErrors && doc.validationErrors.length > 0;

  return (
    <div className="flex h-screen w-full bg-gray-50 text-gray-900 overflow-hidden">
      {/* LEFT PANE - PDF */}
      <div className="w-1/2 h-full border-r border-gray-200 bg-gray-100 flex flex-col">
        <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm">
          <h2 className="font-bold text-lg text-gray-800 truncate">{doc.originalName || 'Document Viewer'}</h2>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isFailed ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {doc.status}
          </span>
        </div>
        <div className="flex-1 overflow-hidden relative">
          <iframe
            src={`${process.env.NEXT_PUBLIC_API_URL}/ingest/file/${id}`}
            className="w-full h-full border-none absolute inset-0"
            title="PDF Viewer"
          />
        </div>
      </div>

      {/* RIGHT PANE - EXTRACTED JSON & ERRORS */}
      <div className="w-1/2 h-full flex flex-col bg-white">
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Extraction Review</h2>
            <button
              type="button"
              onClick={handleReprocess}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-5 rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50"
              disabled={loading}
            >
              Re-extract Document
            </button>
          </div>

          {isFailed && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg mb-2 shadow-sm">
              <h3 className="text-red-800 font-semibold flex items-center mb-2">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><title>Error</title><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                Validation Flags Raised
              </h3>
              <ul className="list-disc pl-5 text-red-700 text-sm space-y-1">
                {doc.validationErrors.map((err: string, i: number) => (
                  <li key={`${err}-${i}`}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex-1 p-6 overflow-auto bg-gray-50/50">
          <div className="bg-gray-900 rounded-xl p-5 shadow-inner">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-400 text-xs font-mono ml-2">extracted_data.json</span>
            </div>
            <pre className="text-green-400 font-mono text-sm leading-relaxed overflow-x-auto whitespace-pre-wrap">
              {doc.extractedJson 
                ? JSON.stringify(doc.extractedJson, null, 2)
                : '// No structured data extracted yet.'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
