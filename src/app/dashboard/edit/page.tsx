'use client';
import Editor from '@/components/Editor';
import { fetchFileContent, saveFileContent, fetchRepoAndCategories, createDiscussion } from '@/lib/github';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense, useMemo } from 'react';
import matter from 'gray-matter';
import { toast } from 'sonner';

function EditContent() {
  const { token, user, isGuest } = useAuthStore();
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
  
  // 用于重命名的状态
  const [currentPath, setCurrentPath] = useState(path || '');
  const [editPath, setEditPath] = useState(path || '');
  const [isEditingPath, setIsEditingPath] = useState(false);
  const [showMetadata, setShowMetadata] = useState(true);

  // 简单的基于文件夹的权限控制
  const canEdit = useMemo(() => {
    if (isGuest || !token) return false;
    if (!currentPath || !user) return false;
    
    // 提取真正的归属文件夹名称
    const parts = currentPath.split('/');
    let folderName = parts[0];
    
    // 如果路径是 knowledge_base/文件夹/文件.md，我们要判断的拥有者其实是第二个层级
    if (folderName === 'knowledge_base' && parts.length > 2) {
      folderName = parts[1];
    } else if (folderName === 'knowledge_base' && parts.length <= 2) {
      // 根目录下直接建的文件，所有人可编辑
      return true;
    }
    
    // 如果没有放在任何文件夹里，或者是自己的文件夹
    if (!currentPath.includes('/') || folderName === user.login) {
      return true;
    }
    
    // 00_白皮书：核心底层设定，仅创始人有权直接修改
    if (folderName === '00_白皮书') {
      const founders = ['Parzervil'];
      return founders.includes(user.login);
    }

    // 预设的公共与共创分区允许所有人编辑
    const publicFolders = ['knowledge_base', 'docs', 'wiki', 'public', 'materials', '01_星途百科', '02_星途志异', '03_沙盒区'];
    if (publicFolders.includes(folderName) || folderName.toLowerCase().includes('public')) {
      return true;
    }
    
    // 允许自定义带自己名字后缀的文件夹（例如：我的项目（Parzervil））
    if (folderName.includes(`(${user.login})`) || folderName.includes(`（${user.login}）`)) {
      return true;
    }
    
    // 其他情况视为“他人的私人文件夹”
    return false;
  }, [currentPath, user, isGuest, token]);

  useEffect(() => {
    if ((!token && !isGuest) || !path) return;
    
    const loadContent = async () => {
      try {
        if (isImport) {
          const importedContent = sessionStorage.getItem('draft_import') || '';
          setContent(importedContent);
          setSha(''); // 新文件没有 sha
        } else {
          const file = await fetchFileContent(token, path);
          setContent(file.content);
          setSha(file.sha);
        }
      } catch (error: any) {
        console.error(error);
        if (error.status === 404) {
          setContent('');
          setSha('');
        } else {
          toast.error('加载文件失败');
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadContent();
  }, [token, path, isImport]);

  const handleSave = async () => {
    if (!token || !currentPath || !canEdit || saving) return;
    setSaving(true);
    try {
      const rawFile = matter.stringify(draftContent, draftMetadata);
      
      let finalPath = currentPath;
      const isNewFile = !sha; // 记录是否为全新创建的文件

      if (editPath !== currentPath && editPath.trim().endsWith('.md')) {
        finalPath = editPath.trim();
        // 如果重命名了，保存新文件并删除旧文件
        const res = await saveFileContent(token, finalPath, rawFile, '');
        if (sha) {
          const { deleteFileContent } = await import('@/lib/github');
          await deleteFileContent(token, currentPath, sha);
        }
        setSha(res.content?.sha || '');
        setCurrentPath(finalPath);
        router.replace(`/dashboard/edit?path=${encodeURIComponent(finalPath)}`);
      } else {
        // 直接更新当前文件
        const res = await saveFileContent(token, currentPath, rawFile, sha);
        setSha(res.content?.sha || '');
      }
      
      setIsEditingPath(false);
      toast.success('保存成功');

      // === 协同工作流 (触发自动审核帖) ===
      // 仅在“沙盒区”第一次新建文件时触发
      if (isNewFile && finalPath.startsWith('03_沙盒区/')) {
        toast.info('正在为您创建沙盒讨论帖...');
        try {
          const repoData = await fetchRepoAndCategories(token);
          const repoId = repoData.id;
          const categories = repoData.discussionCategories.nodes;
          const targetCategory = 
            categories.find((c: any) => c.name === 'Ideas' || c.name === 'Show and tell' || c.name === 'General') || 
            categories[0];
            
          if (repoId && targetCategory) {
            const fileName = finalPath.split('/').pop()?.replace('.md', '') || '未命名设定';
            const author = user?.login || '未知作者';
            const title = `【新设定审核请求】${fileName}`;
            const body = `**作者**：@${author}\n**文件路径**：\`${finalPath}\`\n\n请管理团队与社区成员在此讨论该沙盒草稿是否符合白皮书规范，并给出“转正”或“修改”的建议。\n\n> 预览链接：[点击前往平台查看](${window.location.origin}/dashboard/edit?path=${encodeURIComponent(finalPath)})`;
            
            await createDiscussion(token, repoId, targetCategory.id, title, body);
            toast.success('审核讨论帖创建成功！团队成员现可前往 Discussions 参与讨论。');
          }
        } catch (discError) {
          console.error('自动发帖失败:', discError);
          toast.warning('文件已保存，但自动发起讨论失败，请稍后手动前往 GitHub 发起讨论。');
        }
      }
    } catch (error: any) {
      toast.error(error.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 监听 Ctrl+S 或 Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  if (!path) return <div>缺少 path 参数</div>;
  if (loading) return (
    <div className="flex flex-col h-full bg-white dark:bg-black animate-pulse">
      <header className="flex justify-between items-center p-4 border-b">
        <div className="flex gap-2 items-center">
          <div className="w-16 h-5 bg-gray-200 dark:bg-gray-800 rounded"></div>
          <div className="w-32 h-5 bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
        <div className="flex gap-4">
          <div className="w-10 h-6 bg-gray-200 dark:bg-gray-800 rounded"></div>
          <div className="w-20 h-6 bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-12 max-w-4xl mx-auto w-full">
        <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mb-8"></div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-4/5 mt-8"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
        </div>
      </main>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <header className="flex justify-between items-center p-4 border-b bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-gray-800">
        <div className="flex items-center">
          <span className="text-gray-500 mr-2">正在查看:</span> 
          {isEditingPath && canEdit ? (
            <input
              autoFocus
              value={editPath}
              onChange={(e) => setEditPath(e.target.value)}
              onBlur={() => {
                if (editPath === currentPath || !editPath.trim().endsWith('.md')) {
                  setEditPath(currentPath);
                  setIsEditingPath(false);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') {
                  setEditPath(currentPath);
                  setIsEditingPath(false);
                }
              }}
              className="font-mono text-sm px-2 py-1 bg-gray-100 dark:bg-gray-800 border-none rounded min-w-[300px] outline-none ring-2 ring-accent"
            />
          ) : (
            <span 
              className={`font-mono text-sm font-bold ${canEdit ? 'cursor-pointer hover:text-accent hover:underline' : ''}`}
              onClick={() => canEdit && setIsEditingPath(true)}
              title={canEdit ? '点击重命名文件路径' : ''}
            >
              {currentPath}
            </span>
          )}
          {!canEdit && (
            <span className="ml-3 px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60 text-xs rounded-full font-medium">
              {isGuest ? '只读预览模式 (游客)' : '只读模式 (无修改权限)'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {isGuest && (
            <button
              onClick={() => router.push('/')}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              登录参与编辑 &rarr;
            </button>
          )}
          <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-black dark:hover:text-white cursor-pointer">返回</button>
          
          <button 
            onClick={() => setShowMetadata(!showMetadata)} 
            className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${showMetadata ? 'bg-accent/10 text-accent dark:bg-accent/20 dark:text-accent' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-[#222]'}`}
            title="显示/隐藏侧边属性面板"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="15" x2="15" y1="3" y2="21"/></svg>
          </button>
          
          {canEdit && (
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-accent text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={saving ? 'animate-spin' : ''}><path d={saving ? "M21 12a9 9 0 1 1-6.219-8.56" : "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"}/><polyline points={saving ? "" : "17 21 17 13 7 13 7 21"}/><polyline points={saving ? "" : "7 3 7 8 15 8"}/></svg>
              {saving ? '保存中...' : '保存更改 (Ctrl+S)'}
            </button>
          )}
        </div>
      </header>
      
      {/* 如果没有权限，可以加一个遮罩或者仅仅是让组件内部知道，但目前组件内部没有接收 disabled，
          我们可以简单地用 pointer-events-none 禁用交互，或者让 Editor 组件接收 readonly prop。
          由于 Editor 组件暂时没有 readonly 属性，我们在外层包一个 div 拦截点击 */}
      <main className={`flex-1 overflow-hidden ${!canEdit ? 'opacity-80 pointer-events-none' : ''}`}>
        <Editor 
          initialContent={content} 
          showMetadata={showMetadata}
          onUpdate={(md, meta) => {
            if (canEdit) {
              setDraftContent(md);
              setDraftMetadata(meta);
            }
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
