import { useState, useCallback } from 'react';

export interface DocumentViewerOptions {
  url: string;
  title?: string;
  fileType?: string | null;
  fileName?: string | null;
}

export function useDocumentViewer() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<DocumentViewerOptions | null>(null);

  const open = useCallback((docOptions: DocumentViewerOptions) => {
    setOptions(docOptions);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Note: We don't immediately clear options to allow for exit animations if needed,
    // though the modal will unmount quickly.
  }, []);

  return {
    open,
    close,
    modalProps: {
      isOpen,
      onClose: close,
      url: options?.url || '',
      title: options?.title,
      fileType: options?.fileType || undefined,
      fileName: options?.fileName || undefined,
    },
  };
}
