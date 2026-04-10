import Upload from '@/components/Upload';
import PDFMerger from '@/components/PDFMerger';

export default function Home() {
  return (
    <main className="max-w-5xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">Invoice Extraction v1</h1>
      <section>
        <h2 className="text-xl font-semibold mb-4">Ingest Document</h2>
        <Upload />
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-4">Merge PDFs</h2>
        <PDFMerger />
      </section>
    </main>
  );
}
