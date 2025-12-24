import { useState, useCallback } from 'react';
import { open, save } from '@tauri-apps/plugin-dialog';
import { readFile, writeFile } from '@tauri-apps/plugin-fs';
import mammoth from 'mammoth';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak } from 'docx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface UseFileOpsResult {
    isLoading: boolean;
    error: string | null;
    openDocument: () => Promise<{ content: string; path: string } | null>;
    saveDocument: (content: string, currentPath: string | null) => Promise<string | null>;
    saveDocumentAs: (content: string) => Promise<string | null>;
    exportPDF: (content: string) => Promise<void>;
    clearError: () => void;
}

export function useFileOps(): UseFileOpsResult {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const clearError = useCallback(() => setError(null), []);

    // Open a .docx file and convert to HTML
    const openDocument = useCallback(async (): Promise<{ content: string; path: string } | null> => {
        try {
            setIsLoading(true);
            setError(null);

            const filePath = await open({
                multiple: false,
                filters: [
                    { name: 'Word Documents', extensions: ['docx'] },
                    { name: 'Text Files', extensions: ['txt'] },
                    { name: 'All Files', extensions: ['*'] },
                ],
            });

            if (!filePath) {
                setIsLoading(false);
                return null;
            }

            console.log('Opening file:', filePath);

            // Read file using Tauri API
            const fileBytes = await readFile(filePath);
            console.log('File read, bytes:', fileBytes.byteLength);

            const extension = filePath.split('.').pop()?.toLowerCase();
            let content: string;

            if (extension === 'docx') {
                // Create a clean ArrayBuffer for mammoth
                const arrayBuffer = new ArrayBuffer(fileBytes.byteLength);
                const view = new Uint8Array(arrayBuffer);
                view.set(fileBytes);

                console.log('Converting docx with mammoth...');
                const result = await mammoth.convertToHtml({ arrayBuffer });
                content = result.value;
                console.log('Mammoth result:', content.substring(0, 100));

                if (result.messages.length > 0) {
                    console.warn('Mammoth warnings:', result.messages);
                }

                if (!content || content.trim() === '') {
                    content = '<p>Document opened (appears to be empty or contains unsupported content)</p>';
                }
            } else if (extension === 'txt') {
                const decoder = new TextDecoder('utf-8');
                const text = decoder.decode(fileBytes);
                content = text.split('\n').map(line => `<p>${line || '&nbsp;'}</p>`).join('');
            } else {
                const decoder = new TextDecoder('utf-8');
                content = `<p>${decoder.decode(fileBytes)}</p>`;
            }

            return { content, path: filePath };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to open file';
            console.error('Error opening file:', err);
            setError(message);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Convert HTML to docx and save
    const saveDocument = useCallback(async (content: string, currentPath: string | null): Promise<string | null> => {
        try {
            setIsLoading(true);
            setError(null);

            let filePath = currentPath;

            if (!filePath) {
                filePath = await save({
                    filters: [
                        { name: 'Word Documents', extensions: ['docx'] },
                    ],
                    defaultPath: 'document.docx',
                });
            }

            if (!filePath) {
                setIsLoading(false);
                return null;
            }

            if (!filePath.toLowerCase().endsWith('.docx')) {
                filePath += '.docx';
            }

            console.log('Saving to:', filePath);

            const docxBuffer = await htmlToDocx(content);
            const uint8Array = new Uint8Array(docxBuffer);
            await writeFile(filePath, uint8Array);

            console.log('File saved successfully');
            return filePath;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to save file';
            console.error('Error saving file:', err);
            setError(message);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Save As (always show dialog)
    const saveDocumentAs = useCallback(async (content: string): Promise<string | null> => {
        try {
            setIsLoading(true);
            setError(null);

            const filePath = await save({
                filters: [
                    { name: 'Word Documents', extensions: ['docx'] },
                ],
                defaultPath: 'document.docx',
            });

            if (!filePath) {
                setIsLoading(false);
                return null;
            }

            let finalPath = filePath;
            if (!finalPath.toLowerCase().endsWith('.docx')) {
                finalPath += '.docx';
            }

            console.log('Saving as:', finalPath);

            const docxBuffer = await htmlToDocx(content);
            const uint8Array = new Uint8Array(docxBuffer);
            await writeFile(finalPath, uint8Array);

            console.log('File saved successfully');
            return finalPath;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to save file';
            console.error('Error saving file:', err);
            setError(message);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Export to PDF using jsPDF + html2canvas (no browser headers/footers!)
    const exportPDF = useCallback(async (content: string): Promise<void> => {
        try {
            setIsLoading(true);
            setError(null);

            // Ask user where to save the PDF
            const filePath = await save({
                filters: [
                    { name: 'PDF Documents', extensions: ['pdf'] },
                ],
                defaultPath: 'document.pdf',
            });

            if (!filePath) {
                setIsLoading(false);
                return;
            }

            let finalPath = filePath;
            if (!finalPath.toLowerCase().endsWith('.pdf')) {
                finalPath += '.pdf';
            }

            // Create a hidden container for rendering
            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            container.style.top = '0';
            container.style.width = '8.5in';  // Letter width
            container.style.background = 'white';
            container.style.padding = '0.75in';
            container.style.fontFamily = 'Times New Roman, Times, serif';
            container.style.fontSize = '12pt';
            container.style.lineHeight = '1.5';
            container.style.color = 'black';
            container.innerHTML = content;
            document.body.appendChild(container);

            // Style the content for PDF
            const styleEl = document.createElement('style');
            styleEl.textContent = `
                h1 { font-size: 20pt; font-weight: bold; margin: 0 0 12pt 0; }
                h2 { font-size: 16pt; font-weight: bold; margin: 0 0 10pt 0; }
                h3 { font-size: 14pt; font-weight: bold; margin: 0 0 8pt 0; }
                p { margin: 0 0 10pt 0; }
                ul, ol { margin: 0 0 10pt 0; padding-left: 24pt; }
                li { margin-bottom: 4pt; }
                table { border-collapse: collapse; width: 100%; margin: 10pt 0; }
                td, th { border: 1px solid #333; padding: 6px 10px; }
                img { max-width: 100%; }
            `;
            container.appendChild(styleEl);

            // Wait for images to load
            const images = container.querySelectorAll('img');
            await Promise.all(
                Array.from(images).map(
                    img => new Promise((resolve) => {
                        if (img.complete) resolve(null);
                        else {
                            img.onload = () => resolve(null);
                            img.onerror = () => resolve(null);
                        }
                    })
                )
            );

            // Convert to canvas
            const canvas = await html2canvas(container, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
            });

            // Create PDF (Letter size: 8.5 x 11 inches)
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'in',
                format: 'letter',
            });

            const imgWidth = 8.5;
            const pageHeight = 11;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            // Add image to first page
            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // Add more pages if needed
            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            // Get PDF as array buffer and save
            const pdfBlob = pdf.output('arraybuffer');
            const uint8Array = new Uint8Array(pdfBlob);
            await writeFile(finalPath, uint8Array);

            // Cleanup
            document.body.removeChild(container);

            console.log('PDF saved to:', finalPath);

        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to export PDF';
            console.error('Error exporting PDF:', err);
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        isLoading,
        error,
        openDocument,
        saveDocument,
        saveDocumentAs,
        exportPDF,
        clearError,
    };
}

// Helper: Strip HTML style attributes and normalize for Word
function stripStylesForWord(html: string): string {
    // Create a temporary container
    const container = document.createElement('div');
    container.innerHTML = html;

    // Remove all style attributes
    container.querySelectorAll('[style]').forEach(el => {
        el.removeAttribute('style');
    });

    // Remove all class attributes (they often carry dark theme styling)
    container.querySelectorAll('[class]').forEach(el => {
        el.removeAttribute('class');
    });

    // Remove color and background from any inline styles that might remain
    container.querySelectorAll('*').forEach(el => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.style) {
            htmlEl.style.color = '';
            htmlEl.style.backgroundColor = '';
            htmlEl.style.background = '';
        }
    });

    return container.innerHTML;
}

// Helper: Convert HTML content to docx buffer
async function htmlToDocx(html: string): Promise<ArrayBuffer> {
    // STEP 1: Strip all UI/theme styles before processing
    const cleanHtml = stripStylesForWord(html);

    const parser = new DOMParser();
    const doc = parser.parseFromString(cleanHtml, 'text/html');
    const children: Paragraph[] = [];

    // Track list context for proper numbering
    let bulletLevel = 0;
    let numberLevel = 0;

    function processNode(node: Node): void {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent?.trim();
            if (text) {
                children.push(new Paragraph({
                    children: [new TextRun({
                        text,
                        font: 'Calibri',
                        size: 22, // 11pt = 22 half-points
                        color: '000000', // Force black text
                    })],
                }));
            }
            return;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) return;

        const element = node as Element;
        const tagName = element.tagName.toLowerCase();

        switch (tagName) {
            case 'h1':
                children.push(new Paragraph({
                    children: [new TextRun({
                        text: element.textContent || '',
                        bold: true,
                        font: 'Calibri Light',
                        size: 32, // 16pt
                        color: '2E74B5',
                    })],
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 240, after: 120 },
                }));
                break;
            case 'h2':
                children.push(new Paragraph({
                    children: [new TextRun({
                        text: element.textContent || '',
                        bold: true,
                        font: 'Calibri Light',
                        size: 26, // 13pt
                        color: '2E74B5',
                    })],
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 200, after: 80 },
                }));
                break;
            case 'h3':
                children.push(new Paragraph({
                    children: [new TextRun({
                        text: element.textContent || '',
                        bold: true,
                        font: 'Calibri',
                        size: 24, // 12pt
                        color: '1F4D78',
                    })],
                    heading: HeadingLevel.HEADING_3,
                    spacing: { before: 160, after: 60 },
                }));
                break;
            case 'p':
                children.push(new Paragraph({
                    children: parseInlineElements(element),
                    spacing: { after: 160 }, // 8pt after
                }));
                break;
            case 'ul':
                bulletLevel++;
                element.childNodes.forEach(child => {
                    if ((child as Element).tagName?.toLowerCase() === 'li') {
                        children.push(new Paragraph({
                            children: parseInlineElements(child as Element),
                            bullet: { level: bulletLevel - 1 },
                            spacing: { after: 40 },
                        }));
                    }
                });
                bulletLevel--;
                break;
            case 'ol':
                numberLevel++;
                element.childNodes.forEach(child => {
                    if ((child as Element).tagName?.toLowerCase() === 'li') {
                        children.push(new Paragraph({
                            children: parseInlineElements(child as Element),
                            numbering: { reference: 'default-numbering', level: numberLevel - 1 },
                            spacing: { after: 40 },
                        }));
                    }
                });
                numberLevel--;
                break;
            case 'blockquote':
                children.push(new Paragraph({
                    children: [new TextRun({
                        text: element.textContent || '',
                        italics: true,
                        font: 'Calibri',
                        size: 22,
                        color: '666666',
                    })],
                    indent: { left: 720 },
                    spacing: { after: 160 },
                }));
                break;
            case 'br':
                children.push(new Paragraph({ children: [] }));
                break;
            case 'hr':
            case 'div':
                // Check for page break (CKEditor outputs: <div class="page-break" style="page-break-after:always;">)
                if (element.classList?.contains('page-break') ||
                    element.className?.includes('page-break') ||
                    element.innerHTML?.includes('page-break') ||
                    (element as HTMLElement).style?.pageBreakAfter === 'always') {
                    // Insert a real Word page break: <w:br w:type="page"/>
                    children.push(new Paragraph({
                        children: [new PageBreak()],
                    }));
                } else {
                    element.childNodes.forEach(child => processNode(child));
                }
                break;
            default:
                element.childNodes.forEach(child => processNode(child));
        }
    }

    function parseInlineElements(element: Element): TextRun[] {
        const runs: TextRun[] = [];

        element.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent;
                if (text) {
                    runs.push(new TextRun({
                        text,
                        font: 'Calibri',
                        size: 22,
                        color: '000000',
                    }));
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as Element;
                const tagName = el.tagName.toLowerCase();
                const text = el.textContent || '';

                if (tagName === 'strong' || tagName === 'b') {
                    runs.push(new TextRun({
                        text,
                        bold: true,
                        font: 'Calibri',
                        size: 22,
                        color: '000000',
                    }));
                } else if (tagName === 'em' || tagName === 'i') {
                    runs.push(new TextRun({
                        text,
                        italics: true,
                        font: 'Calibri',
                        size: 22,
                        color: '000000',
                    }));
                } else if (tagName === 'u') {
                    runs.push(new TextRun({
                        text,
                        underline: {},
                        font: 'Calibri',
                        size: 22,
                        color: '000000',
                    }));
                } else if (tagName === 's' || tagName === 'strike' || tagName === 'del') {
                    runs.push(new TextRun({
                        text,
                        strike: true,
                        font: 'Calibri',
                        size: 22,
                        color: '000000',
                    }));
                } else if (tagName === 'sub') {
                    runs.push(new TextRun({
                        text,
                        subScript: true,
                        font: 'Calibri',
                        size: 22,
                        color: '000000',
                    }));
                } else if (tagName === 'sup') {
                    runs.push(new TextRun({
                        text,
                        superScript: true,
                        font: 'Calibri',
                        size: 22,
                        color: '000000',
                    }));
                } else {
                    runs.push(new TextRun({
                        text,
                        font: 'Calibri',
                        size: 22,
                        color: '000000',
                    }));
                }
            }
        });

        return runs.length > 0 ? runs : [new TextRun({
            text: '',
            font: 'Calibri',
            size: 22,
            color: '000000',
        })];
    }

    doc.body.childNodes.forEach(node => processNode(node));

    // Create document with proper defaults
    const document = new Document({
        styles: {
            default: {
                document: {
                    run: {
                        font: 'Calibri',
                        size: 22,
                        color: '000000',
                    },
                    paragraph: {
                        spacing: { line: 276 }, // 1.15 line spacing
                    },
                },
            },
        },
        numbering: {
            config: [{
                reference: 'default-numbering',
                levels: [
                    { level: 0, format: 'decimal', text: '%1.', alignment: 'start' },
                    { level: 1, format: 'lowerLetter', text: '%2.', alignment: 'start' },
                    { level: 2, format: 'lowerRoman', text: '%3.', alignment: 'start' },
                ],
            }],
        },
        sections: [{
            properties: {
                page: {
                    margin: {
                        top: 1440,    // 1 inch = 1440 twips
                        right: 1440,
                        bottom: 1440,
                        left: 1440,
                    },
                },
            },
            children: children.length > 0
                ? children
                : [new Paragraph({
                    children: [new TextRun({ text: '', font: 'Calibri', size: 22 })]
                })],
        }],
    });

    const blob = await Packer.toBlob(document);
    return await blob.arrayBuffer();
}
