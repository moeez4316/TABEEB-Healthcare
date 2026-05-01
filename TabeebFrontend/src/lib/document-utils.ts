export function detectFileType(fileType?: string | null, url?: string): 'pdf' | 'image' | 'unsupported' {
  if (fileType) {
    const typeLower = fileType.toLowerCase();
    if (typeLower.includes('pdf')) return 'pdf';
    if (typeLower.startsWith('image/')) return 'image';
  }

  if (url) {
    const urlLower = url.toLowerCase();
    
    // 1. Check extensions first
    if (urlLower.endsWith('.pdf')) return 'pdf';
    if (urlLower.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)$/i)) return 'image';
    if (urlLower.match(/\.(doc|docx|xls|xlsx|txt|rtf|csv|ppt|pptx)$/i)) return 'unsupported';
    
    // 2. Check Cloudinary paths
    if (urlLower.includes('/image/upload/')) return 'image';
    if (urlLower.includes('/raw/upload/')) return 'pdf'; // Legacy code assumed raw uploads are PDFs
    
    // 3. Fallback for backwards compatibility
    return 'image';
  }

  return 'unsupported';
}

export function isViewableInBrowser(type: 'pdf' | 'image' | 'unsupported'): boolean {
  return type === 'pdf' || type === 'image';
}

export function getFileIcon(fileType: string): 'pdf' | 'image' | 'document' {
  const type = detectFileType(fileType);
  if (type === 'pdf') return 'pdf';
  if (type === 'image') return 'image';
  return 'document';
}
