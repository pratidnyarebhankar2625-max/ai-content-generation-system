"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { CharacterCount } from '@tiptap/extension-character-count';
import { FontFamily } from '@tiptap/extension-font-family';
import { TextStyle } from '@tiptap/extension-text-style';
import { Underline } from '@tiptap/extension-underline';
import { BulletList } from '@tiptap/extension-bullet-list';
import { OrderedList } from '@tiptap/extension-ordered-list';
import { ListItem } from '@tiptap/extension-list-item';
import { useEffect, useState, useRef } from 'react';
import { 
  Bold, Italic, Strikethrough, Heading1, Heading2, 
  Quote as QuoteIcon, Undo, Redo, Save, CheckCircle2,
  Copy, Download, Type, FileText, Underline as UnderlineIcon,
  Quote as QuoteIcon2,
  List as ListIcon
} from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CustomBulletList = BulletList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      listStyleType: {
        default: 'disc',
        parseHTML: element => element.style.listStyleType || 'disc',
        renderHTML: attributes => {
          return { style: `list-style-type: ${attributes.listStyleType}` }
        },
      },
    }
  },
});

const CustomOrderedList = OrderedList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      listStyleType: {
        default: 'decimal',
        parseHTML: element => element.style.listStyleType || 'decimal',
        renderHTML: attributes => {
          return { style: `list-style-type: ${attributes.listStyleType}` }
        },
      },
    }
  },
});

const FONTS = [
  "Arial", "Courier New", "Georgia", "Times New Roman", "Trebuchet MS", 
  "Verdana", "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", 
  "Oswald", "Source Sans Pro", "Slabo 27px", "Raleway"
];

const LIST_STYLES = [
  { label: 'Disc', value: 'disc', type: 'bulletList' },
  { label: 'Circle', value: 'circle', type: 'bulletList' },
  { label: 'Square', value: 'square', type: 'bulletList' },
  { label: 'Decimal (1, 2, 3)', value: 'decimal', type: 'orderedList' },
  { label: 'Lower Alpha (a, b, c)', value: 'lower-alpha', type: 'orderedList' },
];

interface RichTextEditorProps {
  initialContent: string;
  onChange?: (content: string, wordCount: number, charCount: number) => void;
  onSave?: (content: string) => void;
  isStreaming?: boolean;
}

export function RichTextEditor({ initialContent, onChange, onSave, isStreaming }: RichTextEditorProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      ListItem,
      CustomBulletList,
      CustomOrderedList,
      TextStyle,
      FontFamily,
      Underline,
      CharacterCount,
    ],
    content: initialContent,
    editable: !isStreaming,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const words = editor.storage.characterCount.words();
      const chars = editor.storage.characterCount.characters();
      
      onChange?.(html, words, chars);

      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        onSave?.(html);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      }, 2000);
    },
  });

  useEffect(() => {
    if (editor && isStreaming) {
      const currentText = editor.getText();
      if (initialContent !== currentText) {
        const formattedContent = initialContent.split('\n').map(p => p ? `<p>${p}</p>` : '<p></p>').join('');
        editor.commands.setContent(formattedContent, { emitUpdate: false });
      }
    }
  }, [initialContent, isStreaming, editor]);

  useEffect(() => {
    if (editor) editor.setEditable(!isStreaming);
  }, [isStreaming, editor]);

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, []);

  const handleCopy = () => {
    if (editor) {
      navigator.clipboard.writeText(editor.getText());
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (editor) {
      const element = document.createElement("a");
      const file = new Blob([editor.getText()], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `document-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  const handleManualSave = () => {
    if (editor) {
      onSave?.(editor.getHTML());
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const handleListStyleChange = (val: string) => {
    if (!editor) return;
    const style = LIST_STYLES.find(s => s.value === val);
    if (!style) return;
    
    if (style.type === 'bulletList') {
      if (!editor.isActive('bulletList')) {
        editor.chain().focus().toggleBulletList().run();
      }
      editor.chain().focus().updateAttributes('bulletList', { listStyleType: style.value }).run();
    } else {
      if (!editor.isActive('orderedList')) {
        editor.chain().focus().toggleOrderedList().run();
      }
      editor.chain().focus().updateAttributes('orderedList', { listStyleType: style.value }).run();
    }
  };

  const handleQuoteWrap = (val: string) => {
    if (!editor) return;
    const { state } = editor;
    const { from, to } = state.selection;
    let text = state.doc.textBetween(from, to, ' ');
    if (!text) text = " ";
    
    const quote = val === 'single' ? "'" : '"';
    editor.chain().focus().insertContentAt({ from, to }, `${quote}${text}${quote}`).run();
  };

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full rounded-[20px] border border-border bg-card shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between border-b border-border bg-muted/20 px-4 py-2 gap-2">
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Font Selector */}
          <Select 
            value={editor.getAttributes('textStyle').fontFamily || "Inter"}
            onValueChange={(val) => editor.chain().focus().setFontFamily(val).run()}
          >
            <SelectTrigger className="w-[130px] h-8 text-xs bg-card">
              <SelectValue placeholder="Font Family" />
            </SelectTrigger>
            <SelectContent>
              {FONTS.map(font => (
                <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="w-px h-4 bg-border mx-1"></div>

          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={`p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors ${editor.isActive('bold') ? 'bg-muted text-foreground' : ''}`}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors ${editor.isActive('italic') ? 'bg-muted text-foreground' : ''}`}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            disabled={!editor.can().chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors ${editor.isActive('underline') ? 'bg-muted text-foreground' : ''}`}
            title="Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editor.can().chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors ${editor.isActive('strike') ? 'bg-muted text-foreground' : ''}`}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </button>
          
          <div className="w-px h-4 bg-border mx-1"></div>
          
          {/* List Styles Selector */}
          <Select 
            value={editor.isActive('bulletList') ? editor.getAttributes('bulletList').listStyleType || 'disc' : editor.isActive('orderedList') ? editor.getAttributes('orderedList').listStyleType || 'decimal' : ''}
            onValueChange={handleListStyleChange}
          >
            <SelectTrigger className="w-[140px] h-8 text-xs bg-card">
              <SelectValue placeholder="List Style" />
            </SelectTrigger>
            <SelectContent>
              {LIST_STYLES.map(style => (
                <SelectItem key={style.value} value={style.value}>
                  {style.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="w-px h-4 bg-border mx-1"></div>

          {/* Quotes Wrapper */}
          <Select onValueChange={handleQuoteWrap} value="">
            <SelectTrigger className="w-[120px] h-8 text-xs bg-card">
              <SelectValue placeholder="Add Quotes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single (' ')</SelectItem>
              <SelectItem value="double">Double (" ")</SelectItem>
            </SelectContent>
          </Select>

          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors ${editor.isActive('blockquote') ? 'bg-muted text-foreground' : ''}`}
            title="Blockquote"
          >
            <QuoteIcon className="h-4 w-4" />
          </button>

          <div className="w-px h-4 bg-border mx-1"></div>
          
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors disabled:opacity-30"
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors disabled:opacity-30"
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 mt-2 lg:mt-0">
          <button
            onClick={handleManualSave}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
            title="Save"
          >
            {isSaved ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Save className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
          </button>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
            title="Copy"
          >
            {isCopied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">Copy</span>
          </button>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
            title="Download"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-card to-muted/5 relative p-6">
        <EditorContent 
          editor={editor} 
          className="prose prose-sm md:prose-base dark:prose-invert max-w-none focus:outline-none min-h-[300px] [&_ul]:pl-6 [&_ol]:pl-6" 
        />
      </div>

      {/* Footer / Status Bar */}
      <div className="border-t border-border bg-muted/10 px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            {editor.storage.characterCount.words()} words
          </div>
          <div className="flex items-center gap-1.5">
            <Type className="h-3.5 w-3.5" />
            {editor.storage.characterCount.characters()} characters
          </div>
        </div>
        <div>
          {isSaved ? (
            <span className="text-emerald-500 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Auto-saved
            </span>
          ) : (
            <span>Ready</span>
          )}
        </div>
      </div>
    </div>
  );
}
