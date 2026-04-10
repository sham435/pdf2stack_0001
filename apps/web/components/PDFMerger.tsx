'use client';
import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';

export default function PDFMerger() {
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setFiles([...files, ...Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf')]);
  };

  const move = (idx: number, dir: -1 | 1) => {
    const newFiles = [...files];
    const [item] = newFiles.splice(idx, 1);
    newFiles.splice(idx + dir, 0, item);
    setFiles(newFiles);
  };

  const merge = async () => {
    const mergedPdf = await PDFDocument.create();
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const pageIndices = pdf.getPageIndices();
      const pages = await mergedPdf.copyPages(pdf, pageIndices);
      for (const page of pages) {
        mergedPdf.addPage(page);
      }
    }
    const mergedBytes = await mergedPdf.save();
    const blob = new Blob([new Uint8Array(mergedBytes)], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'merged.pdf';
    a.click();
  };

  return (
    <div className="p-4 border-2 border-dashed bg-white" onDrop={onDrop} onDragOver={e => e.preventDefault()}>
      <p className="mb-2">Drag PDFs here to stack</p>
      <div className="space-y-1 mb-4">
        {files.map((f, i) => (
          <div key={i} className="flex gap-2 items-center">
            <span className="flex-1">{f.name}</span>
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="px-2 border">Up</button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === files.length - 1} className="px-2 border">Down</button>
            <button type="button" onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="px-2 border">Remove</button>
          </div>
        ))}
      </div>
      <button type="button" onClick={merge} disabled={!files.length} className="bg-black text-white px-4 py-2 rounded disabled:opacity-50">
        Merge & Save
      </button>
    </div>
  );
}
