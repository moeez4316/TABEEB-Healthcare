'use client';

import React, { useRef, useEffect, useState } from 'react';
import { 
  Bold, Italic, List, ListOrdered, Link as LinkIcon, 
  Heading2, Quote, X
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  value, 
  onChange,
  placeholder = 'Start writing your blog content...'
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const insertHeading = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const heading = document.createElement('h2');
      heading.textContent = selection.toString() || 'Heading';
      
      range.deleteContents();
      range.insertNode(heading);
      
      // Move cursor after heading
      range.setStartAfter(heading);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      
      handleInput();
      editorRef.current?.focus();
    }
  };

  const insertList = (ordered: boolean) => {
    execCommand(ordered ? 'insertOrderedList' : 'insertUnorderedList');
  };

  const insertQuote = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const blockquote = document.createElement('blockquote');
      blockquote.style.borderLeft = '4px solid #14b8a6';
      blockquote.style.paddingLeft = '1rem';
      blockquote.style.fontStyle = 'italic';
      blockquote.style.marginLeft = '0';
      blockquote.style.marginRight = '0';
      blockquote.textContent = selection.toString() || 'Quote';
      
      range.deleteContents();
      range.insertNode(blockquote);
      
      range.setStartAfter(blockquote);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      
      handleInput();
      editorRef.current?.focus();
    }
  };

  const openLinkModal = () => {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      setLinkText(selection.toString());
    }
    setShowLinkModal(true);
  };

  const insertLink = () => {
    if (!linkUrl) return;
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const link = document.createElement('a');
      link.href = linkUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.color = '#14b8a6';
      link.style.textDecoration = 'underline';
      link.textContent = linkText || linkUrl;
      
      range.deleteContents();
      range.insertNode(link);
      
      range.setStartAfter(link);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      
      handleInput();
      editorRef.current?.focus();
    }
    
    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
  };

  const toolbarButtons = [
    { icon: Bold, action: () => execCommand('bold'), title: 'Bold (Ctrl+B)' },
    { icon: Italic, action: () => execCommand('italic'), title: 'Italic (Ctrl+I)' },
    { icon: Heading2, action: insertHeading, title: 'Heading' },
    { icon: List, action: () => insertList(false), title: 'Bullet List' },
    { icon: ListOrdered, action: () => insertList(true), title: 'Numbered List' },
    { icon: Quote, action: insertQuote, title: 'Quote' },
    { icon: LinkIcon, action: openLinkModal, title: 'Insert Link' },
  ];

  return (
    <>
      <div className="border border-gray-300 dark:border-slate-600 rounded-lg overflow-hidden bg-white dark:bg-slate-700">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-1 p-2 bg-gray-50 dark:bg-slate-800 border-b border-gray-300 dark:border-slate-600">
          {toolbarButtons.map((btn, index) => {
            const Icon = btn.icon;
            return (
              <button
                key={index}
                type="button"
                onClick={btn.action}
                title={btn.title}
                className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded transition-colors text-gray-700 dark:text-gray-300"
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>

        {/* Editor */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="min-h-[400px] p-4 focus:outline-none prose prose-sm dark:prose-invert max-w-none overflow-auto custom-scrollbar"
          style={{ 
            maxHeight: '600px',
            color: 'inherit'
          }}
          data-placeholder={placeholder}
        />

        <style jsx>{`
          [contenteditable][data-placeholder]:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
            position: absolute;
          }
          
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
          
          :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #475569;
          }
          
          :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #64748b;
          }
        `}</style>
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 max-w-md w-full border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Insert Link
              </h3>
              <button
                onClick={() => {
                  setShowLinkModal(false);
                  setLinkUrl('');
                  setLinkText('');
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Link Text
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Enter link text..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  onKeyPress={(e) => e.key === 'Enter' && insertLink()}
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowLinkModal(false);
                  setLinkUrl('');
                  setLinkText('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={insertLink}
                disabled={!linkUrl}
                className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

