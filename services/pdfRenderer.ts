import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface PDFPageImage {
  pageNumber: number;
  imageUrl: string;
}

export const renderPDFPagesToImages = async (
  pdfBase64: string,
  pageRange?: { start?: number; end?: number }
): Promise<PDFPageImage[]> => {
  const pdfData = atob(pdfBase64);
  const pdfArray = new Uint8Array(pdfData.length);
  for (let i = 0; i < pdfData.length; i++) {
    pdfArray[i] = pdfData.charCodeAt(i);
  }

  const pdf = await pdfjsLib.getDocument({ data: pdfArray }).promise;
  const totalPages = pdf.numPages;
  
  const startPage = pageRange?.start ?? 1;
  const endPage = Math.min(pageRange?.end ?? totalPages, totalPages);
  
  const pages: PDFPageImage[] = [];
  
  for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
    const page = await pdf.getPage(pageNum);
    
    const scale = 2.5;
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error(`Could not get canvas context for page ${pageNum}`);
    }
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({
      canvasContext: context,
      viewport: viewport,
      canvas: canvas as any
    }).promise;
    
    const imageUrl = canvas.toDataURL('image/png', 0.95);
    
    pages.push({
      pageNumber: pageNum,
      imageUrl
    });
  }
  
  return pages;
};

export const getPDFPageCount = async (pdfBase64: string): Promise<number> => {
  const pdfData = atob(pdfBase64);
  const pdfArray = new Uint8Array(pdfData.length);
  for (let i = 0; i < pdfData.length; i++) {
    pdfArray[i] = pdfData.charCodeAt(i);
  }
  
  const pdf = await pdfjsLib.getDocument({ data: pdfArray }).promise;
  return pdf.numPages;
};
