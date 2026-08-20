'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Check, Download, Heading3, Italic, List, ListOrdered, Save, Code, Quote, Strikethrough } from 'lucide-react';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import { useEncounter } from '@/hooks/useEncounter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const emptySoapTemplate = `
<h3>Subjective</h3><p></p>
<h3>Objective</h3><p></p>
<h3>Assessment</h3><p></p>
<h3>Plan</h3><p></p>
`;

function htmlToMarkdown(html: string) {
  if (typeof window === 'undefined') return html;
  const documentFragment = new DOMParser().parseFromString(html, 'text/html').body;

  const walk = (node: ChildNode): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
    if (!(node instanceof HTMLElement)) return '';

    const children = Array.from(node.childNodes).map(walk).join('');

    switch (node.tagName.toLowerCase()) {
      case 'h1': return `# ${children.trim()}\n\n`;
      case 'h2': return `## ${children.trim()}\n\n`;
      case 'h3': return `### ${children.trim()}\n\n`;
      case 'p': return `${children.trim()}\n\n`;
      case 'strong':
      case 'b': return `**${children}**`;
      case 'em':
      case 'i': return `_${children}_`;
      case 'code': return `\`${children}\``;
      case 'blockquote': return `> ${children.trim()}\n\n`;
      case 's':
      case 'strike':
      case 'del': return `~~${children}~~`;
      case 'ul': return `${children}\n`;
      case 'ol': return `${children}\n`;
      case 'li': return `- ${children.trim()}\n`;
      case 'br': return '\n';
      default: return children;
    }
  };

  return Array.from(documentFragment.childNodes).map(walk).join('').replace(/\n{3,}/g, '\n\n').trim();
}

export function SOAPEditor({ encounterId }: { encounterId: number }) {
  const { data: encounter, isLoading, isError, updateEncounter } = useEncounter(encounterId);
  const [saved, setSaved] = useState(false);
  const [draftHtml, setDraftHtml] = useState(emptySoapTemplate);
  const [autosaveState, setAutosaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  
  const debouncedHtml = useDebounce(draftHtml, 2500);
  const lastSavedHtml = useRef('');
  const hasLoadedEncounter = useRef(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Document subjective, objective, assessment, and plan notes...',
      }),
    ],
    immediatelyRender: false,
    content: emptySoapTemplate,
    editorProps: {
      attributes: {
        class: 'min-h-[460px] max-w-none space-y-4 text-sm leading-7 text-slate-800 outline-none dark:text-slate-200 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-slate-900 dark:[&_h3]:text-slate-100 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_code]:bg-slate-100 [&_code]:dark:bg-slate-800 [&_code]:rounded [&_code]:px-1',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setDraftHtml(html);
      setSaved(false);
      setAutosaveState('idle');
    },
  });

  useEffect(() => {
    if (!editor || !encounter || hasLoadedEncounter.current) return;
    const nextContent = encounter.clinical_notes || emptySoapTemplate;
    editor.commands.setContent(nextContent);
    setDraftHtml(nextContent);
    lastSavedHtml.current = nextContent;
    hasLoadedEncounter.current = true;
  }, [editor, encounter]);

  const saveHtml = useCallback((html: string, showToast = true) => {
    if (!html || html === lastSavedHtml.current || updateEncounter.isPending) return;
    setAutosaveState('saving');
    updateEncounter.mutate(
      { clinical_notes: html },
      {
        onSuccess: () => {
          lastSavedHtml.current = html;
          setSaved(true);
          setAutosaveState('saved');
          setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          if (showToast) toast.success('SOAP note saved');
        },
        onError: () => setAutosaveState('idle'),
      }
    );
  }, [updateEncounter]);

  const handleSave = useCallback(() => {
    if (!editor) return;
    saveHtml(editor.getHTML(), true);
  }, [editor, saveHtml]);

  const exportMarkdown = useCallback(() => {
    if (!editor) return;
    const markdown = htmlToMarkdown(editor.getHTML());
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `encounter-${encounterId}-soap.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [editor, encounterId]);

  useEffect(() => {
    if (!hasLoadedEncounter.current || debouncedHtml === lastSavedHtml.current) return;
    saveHtml(debouncedHtml, false);
  }, [debouncedHtml, saveHtml]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  const jumpToSection = (sectionName: string) => {
    if (!editorRef.current) return;
    const headings = editorRef.current.querySelectorAll('h3');
    for (const heading of Array.from(headings)) {
      if (heading.textContent?.toLowerCase() === sectionName.toLowerCase()) {
        heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Place cursor at the end of the heading's next paragraph if possible
        break;
      }
    }
  };

  if (isLoading) return <Skeleton className="h-[620px] w-full rounded-xl" />;

  if (isError) {
    return <p className="rounded-lg border border-danger/20 bg-danger/5 p-4 text-sm text-danger">Unable to load SOAP notes.</p>;
  }

  return (
    <Card className="min-h-[620px] flex flex-col">
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>SOAP Notes</CardTitle>
            <CardDescription>
              Structured Subjective, Objective, Assessment, and Plan documentation with autosave and Markdown export.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500">
              {autosaveState === 'saving' 
                ? 'Autosaving...' 
                : autosaveState === 'saved' 
                  ? `Last saved at ${lastSavedTime}` 
                  : 'Ctrl+S to save'}
            </span>
            <Button type="button" variant="outline" onClick={exportMarkdown} disabled={!editor}>
              <Download className="size-4" />
              Markdown
            </Button>
            <Button onClick={handleSave} disabled={!editor || updateEncounter.isPending || saved} variant={saved ? 'success' : 'default'}>
              {updateEncounter.isPending ? 'Saving...' : saved ? <><Check className="size-4" /> Saved</> : <><Save className="size-4" /> Save Notes</>}
            </Button>
          </div>
        </div>
        
        {/* Section Jump Navigation */}
        <div className="flex gap-2 pt-2 pb-2">
          {['Subjective', 'Objective', 'Assessment', 'Plan'].map(section => (
            <Button 
              key={section} 
              variant="outline" 
              size="sm" 
              className="text-xs h-7"
              onClick={() => jumpToSection(section)}
            >
              {section}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-slate-50 p-2 dark:bg-slate-900 shrink-0">
            <Button type="button" size="sm" variant={editor?.isActive('bold') ? 'secondary' : 'outline'} onClick={() => editor?.chain().focus().toggleBold().run()}>
              <Bold className="size-4" />
            </Button>
            <Button type="button" size="sm" variant={editor?.isActive('italic') ? 'secondary' : 'outline'} onClick={() => editor?.chain().focus().toggleItalic().run()}>
              <Italic className="size-4" />
            </Button>
            <Button type="button" size="sm" variant={editor?.isActive('strike') ? 'secondary' : 'outline'} onClick={() => editor?.chain().focus().toggleStrike().run()}>
              <Strikethrough className="size-4" />
            </Button>
            <Button type="button" size="sm" variant={editor?.isActive('code') ? 'secondary' : 'outline'} onClick={() => editor?.chain().focus().toggleCode().run()}>
              <Code className="size-4" />
            </Button>
            
            <div className="w-px h-4 bg-slate-300 mx-1" />
            
            <Button type="button" size="sm" variant={editor?.isActive('heading', { level: 3 }) ? 'secondary' : 'outline'} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>
              <Heading3 className="size-4" />
            </Button>
            <Button type="button" size="sm" variant={editor?.isActive('bulletList') ? 'secondary' : 'outline'} onClick={() => editor?.chain().focus().toggleBulletList().run()}>
              <List className="size-4" />
            </Button>
            <Button type="button" size="sm" variant={editor?.isActive('orderedList') ? 'secondary' : 'outline'} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
              <ListOrdered className="size-4" />
            </Button>
            <Button type="button" size="sm" variant={editor?.isActive('blockquote') ? 'secondary' : 'outline'} onClick={() => editor?.chain().focus().toggleBlockquote().run()}>
              <Quote className="size-4" />
            </Button>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto" onClick={() => editor?.commands.focus()} ref={editorRef}>
            <EditorContent editor={editor} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
