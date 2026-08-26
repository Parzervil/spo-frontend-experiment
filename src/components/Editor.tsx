'use client';
import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import matter from 'gray-matter';
import { useEffect, useState } from 'react';

import { Markdown } from 'tiptap-markdown';

interface EditorProps {
  initialContent: string;
  onUpdate: (content: string, metadata: any) => void;
}

export default function Editor({ initialContent, onUpdate }: EditorProps) {
  const [metadata, setMetadata] = useState<any>({});
  
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
        class: 'prose prose-sm sm:prose-base dark:prose-invert focus:outline-none max-w-none',
      },
    },
  });

  useEffect(() => {
    if (editor && initialContent) {
      try {
        const parsed = matter(initialContent);
        setMetadata(parsed.data);
        editor.commands.setContent(parsed.content);
        // 强制输出一次初始的 markdown 状态给父组件
        onUpdate(editor.storage.markdown.getMarkdown(), parsed.data);
      } catch (e) {
        editor.commands.setContent(initialContent);
        onUpdate(editor.storage.markdown.getMarkdown(), {});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, initialContent]);

  if (!editor) {
    return null;
  }

  return (
    <div className="w-full flex gap-6">
      {/* 属性面板 */}
      <div className="w-64 bg-gray-50 dark:bg-gray-900 p-4 border-r border-gray-100 dark:border-gray-800 shrink-0">
        <h3 className="font-bold mb-4">文档属性 (YAML)</h3>
        {Object.keys(metadata).map((key) => (
          <div key={key} className="mb-2">
            <label className="text-xs text-gray-500 uppercase">{key}</label>
            <input 
              className="w-full border p-1 text-sm bg-white dark:bg-black" 
              value={metadata[key]} 
              onChange={(e) => setMetadata({ ...metadata, [key]: e.target.value })}
            />
          </div>
        ))}
      </div>
      
      {/* 编辑区 */}
      <div className="flex-1 p-8">
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
        
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
