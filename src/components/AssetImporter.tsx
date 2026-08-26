'use client';
import { useState, useRef } from 'react';
import mammoth from 'mammoth';
import { toast } from 'sonner';

interface AssetImporterProps {
  onImport: (markdown: string) => void;
}

export default function AssetImporter({ onImport }: AssetImporterProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      let text = await file.text();
      if (file.name.endsWith('.txt')) {
        // 对于纯文本，Markdown 会把单换行视为同段落。将其替换为双换行以强制分段
        text = text.replace(/([^\n])\n([^\n])/g, '$1\n\n$2');
      }
      onImport(text);
    } else if (file.name.endsWith('.docx')) {
      const arrayBuffer = await file.arrayBuffer();
      // mammoth parses the docx to raw text or HTML.
      // We will parse it to HTML, which Tiptap can consume and convert to Markdown.
      const result = await mammoth.convertToHtml({ arrayBuffer });
      // In a real scenario, you might want to sanitize this HTML or convert to MD directly.
      // Tiptap can accept HTML and will format it properly.
      onImport(result.value);
    } else {
      toast.error('仅支持 .txt, .md, .docx 格式');
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      className={`border-2 border-dashed p-8 rounded-xl text-center transition-colors cursor-pointer ${
        isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700'
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        accept=".txt,.md,.docx" 
        onChange={(e) => e.target.files && handleFile(e.target.files[0])}
      />
      <div className="flex flex-col items-center gap-2 text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-up"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 12v6"/><path d="m15 15-3-3-3 3"/></svg>
        <p className="font-medium text-black dark:text-white">点击或拖拽文件导入</p>
        <p className="text-sm">支持 Word (.docx), TXT, Markdown 格式</p>
      </div>
    </div>
  );
}
