'use client';
import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import matter from 'gray-matter';
import { useEffect, useState } from 'react';

import { Markdown } from 'tiptap-markdown';

import { useAuthStore } from '@/store/useAuthStore';

interface EditorProps {
  initialContent: string;
  onUpdate: (content: string, metadata: any) => void;
}

export default function Editor({ initialContent, onUpdate }: EditorProps) {
  const [metadata, setMetadata] = useState<any>({});
  const [newKey, setNewKey] = useState('');
  const { user } = useAuthStore();
  
  // Parse frontmatter
  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
    ],
    content: '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      // 转换为 markdown 输出
      const md = editor.storage.markdown.getMarkdown();
      onUpdate(md, metadata);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base dark:prose-invert focus:outline-none min-h-[500px]',
      },
    },
  });

  useEffect(() => {
    if (editor && initialContent !== undefined) {
      // Only set initial content once to avoid cursor jumping
      if (editor.isEmpty && initialContent) {
        try {
          const parsed = matter(initialContent);
          
          // 如果是新文件，提供默认的属性结构
          const defaultMeta = parsed.data && Object.keys(parsed.data).length > 0 
            ? parsed.data 
            : { 
                '标题': '', 
                '类型': '世界观', 
                '摘要': '',
                '作者': user?.name || user?.login || '',
                '状态': '草稿',
                '标签': ''
              };
            
          setMetadata(defaultMeta);
          editor.commands.setContent(parsed.content);
          onUpdate(editor.storage.markdown.getMarkdown(), defaultMeta);
        } catch (e) {
          editor.commands.setContent(initialContent);
          onUpdate(editor.storage.markdown.getMarkdown(), {});
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, initialContent]);

  if (!editor) {
    return null;
  }

  const handleAddProperty = () => {
    if (newKey && !metadata[newKey]) {
      const updated = { ...metadata, [newKey]: '' };
      setMetadata(updated);
      setNewKey('');
      onUpdate(editor.storage.markdown.getMarkdown(), updated);
    }
  };

  const handleUpdateProperty = (key: string, value: string) => {
    const updated = { ...metadata, [key]: value };
    setMetadata(updated);
    onUpdate(editor.storage.markdown.getMarkdown(), updated);
  };

  const handleDeleteProperty = (key: string) => {
    const updated = { ...metadata };
    delete updated[key];
    setMetadata(updated);
    onUpdate(editor.storage.markdown.getMarkdown(), updated);
  };

  return (
    <div className="w-full flex h-full">
      {/* 编辑区 */}
      <div className="flex-1 overflow-auto flex justify-center bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="w-full max-w-3xl my-8 p-12 bg-white dark:bg-[#1a1a1a] shadow-sm border border-gray-200 dark:border-gray-800 rounded-xl">
          <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
            <div className="bg-white dark:bg-[#2a2a2a] shadow-lg border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex text-sm">
              <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 ${editor.isActive('bold') ? 'bg-gray-100 dark:bg-gray-800 font-bold' : ''}`}
              >
                加粗
              </button>
              <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 ${editor.isActive('italic') ? 'bg-gray-100 dark:bg-gray-800 font-bold' : ''}`}
              >
                斜体
              </button>
              <button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={`px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 ${editor.isActive('strike') ? 'bg-gray-100 dark:bg-gray-800 font-bold' : ''}`}
              >
                删除线
              </button>
            </div>
          </BubbleMenu>
          
          <FloatingMenu editor={editor} tippyOptions={{ duration: 100 }}>
            <div className="bg-white dark:bg-[#2a2a2a] shadow-lg border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col text-sm w-32">
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-100 dark:bg-gray-800 font-bold' : ''}`}
              >
                标题 1
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-100 dark:bg-gray-800 font-bold' : ''}`}
              >
                标题 2
              </button>
              <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 ${editor.isActive('bulletList') ? 'bg-gray-100 dark:bg-gray-800 font-bold' : ''}`}
              >
                无序列表
              </button>
              <button
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={`px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 ${editor.isActive('blockquote') ? 'bg-gray-100 dark:bg-gray-800 font-bold' : ''}`}
              >
                引用
              </button>
            </div>
          </FloatingMenu>
          
          {/* 文档占位符，提示输入 */}
          {editor.isEmpty && (
            <div className="text-gray-400 absolute pointer-events-none mt-1">开始撰写世界观设定 (输入 / 调出菜单)...</div>
          )}
          <EditorContent editor={editor} />
        </div>
      </div>
      
      {/* 属性面板 (右侧边栏) */}
      <div className="w-80 bg-white dark:bg-[#111] p-6 border-l border-gray-200 dark:border-gray-800 shrink-0 overflow-y-auto">
        <h3 className="font-bold mb-6 text-sm flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-database"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
          元数据属性 (YAML)
        </h3>
        
        <div className="space-y-4 mb-8">
          {Object.keys(metadata).map((key) => (
            <div key={key} className="group relative">
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">{key}</label>
              <div className="flex gap-2">
                <input 
                  className="w-full border border-gray-200 dark:border-gray-800 p-2 rounded-lg text-sm bg-gray-50 dark:bg-black focus:outline-none focus:ring-1 focus:ring-blue-500 transition-shadow" 
                  value={metadata[key]} 
                  onChange={(e) => handleUpdateProperty(key, e.target.value)}
                  placeholder={`输入 ${key}...`}
                />
                <button 
                  onClick={() => handleDeleteProperty(key)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-2"
                  title="删除属性"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
          <p className="text-xs text-gray-500 mb-2">添加新属性</p>
          <div className="flex gap-2">
            <input 
              className="flex-1 border border-gray-200 dark:border-gray-800 p-2 rounded-lg text-sm bg-white dark:bg-black focus:outline-none" 
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="如: tags, author"
              onKeyDown={(e) => e.key === 'Enter' && handleAddProperty()}
            />
            <button 
              onClick={handleAddProperty}
              disabled={!newKey}
              className="bg-gray-100 dark:bg-gray-800 text-black dark:text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              添加
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
