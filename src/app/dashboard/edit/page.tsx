'use client';
import Editor from '@/components/Editor';
import { fetchFileContent, saveFileContent } from '@/lib/github';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import matter from 'gray-matter';

function EditContent() {
  const { token } = useAuthStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const path = searchParams.get('path');
  const isImport = searchParams.get('import') === 'true';

  const [content, setContent] = useState('');
  const [sha, setSha] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draftContent, setDraftContent] = useState('');
  const [draftMetadata, setDraftMetadata] = useState<any>({});

  useEffect(() => {
    if (!token || !path) return;
    
    const loadContent = async () => {
      try {
        if (isImport) {
          const importedContent = sessionStorage.getItem('draft_import') || '';
          setContent(importedContent);
          setSha(''); // 新文件没有 sha
          // sessionStorage.removeItem('draft_import'); 移除这行，避免 React Strict Mode 下第二次执行将其清空
        } else {
          const file = await fetchFileContent(token, path);
          setContent(file.content);
          setSha(file.sha);
        }
      } catch (error: any) {
        console.error(error);
        // 如果是 404 找不到文件，说明是新建的普通文件
        if (error.status === 404) {
          setContent('');
          setSha('');
        } else {
          alert('加载文件失败');
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadContent();
  }, [token, path, isImport]);

  const handleSave = async () => {
    if (!token || !path) return;
    setSaving(true);
    try {
      // 重新拼装 frontmatter
      const rawFile = matter.stringify(draftContent, draftMetadata);
      const res = await saveFileContent(token, path, rawFile, sha);
      setSha(res.content?.sha || '');
      alert('保存成功');
    } catch (error: any) {
      alert(error.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (!path) return <div>缺少 path 参数</div>;
  if (loading) return <div>加载中...</div>;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black">
      <header className="flex justify-between items-center p-4 border-b">
        <div>
          <span className="text-gray-500">正在编辑:</span> 
          <span className="ml-2 font-bold">{path}</span>
        </div>
        <div className="flex gap-4">
          <button onClick={() => router.back()} className="text-sm">返回</button>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-black dark:bg-white text-white dark:text-black px-4 py-1 rounded-md text-sm"
          >
            {saving ? '保存中...' : '保存更改'}
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-auto">
        <Editor 
          initialContent={content} 
          onUpdate={(md, meta) => {
            setDraftContent(md);
            setDraftMetadata(meta);
          }} 
        />
      </main>
    </div>
  );
}

export default function EditPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditContent />
    </Suspense>
  );
}
