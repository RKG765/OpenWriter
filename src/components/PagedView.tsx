import { useRef, useEffect, useState, useCallback } from 'react';

// Page dimensions (Letter size at 96 DPI)
const PAGE_WIDTH = 816;        // 8.5 inches
const PAGE_HEIGHT = 1056;      // 11 inches  
const PAGE_MARGIN = 96;        // 1 inch margins
const PAGE_BODY_HEIGHT = PAGE_HEIGHT - (PAGE_MARGIN * 2); // 864px usable

interface PagedViewProps {
    content: string;
}

interface PageData {
    blocks: string[];
}

// Parse HTML content into block elements
function parseBlocks(html: string): string[] {
    if (!html || html.trim() === '') return [];

    const container = document.createElement('div');
    container.innerHTML = html;

    const blocks: string[] = [];
    for (let i = 0; i < container.children.length; i++) {
        const child = container.children[i];
        blocks.push(child.outerHTML);
    }

    return blocks.length > 0 ? blocks : (html.trim() ? [`<p>${html}</p>`] : []);
}

// Check if a block is a hard page break
function isHardPageBreak(blockHtml: string): boolean {
    return blockHtml.includes('page-break') ||
        blockHtml.includes('ck-page-break') ||
        blockHtml.includes('pagebreak');
}

/**
 * PagedView - Read-only paginated view of the document
 * This is the "layout layer" separate from the editor
 */
export default function PagedView({ content }: PagedViewProps) {
    const measureRef = useRef<HTMLDivElement>(null);
    const [pages, setPages] = useState<PageData[]>([{ blocks: [] }]);

    // Measure a single block's height including margins
    const measureBlock = useCallback((blockHtml: string): number => {
        if (!measureRef.current) return 40;

        measureRef.current.innerHTML = blockHtml;
        const element = measureRef.current.firstElementChild as HTMLElement;

        if (!element) {
            measureRef.current.innerHTML = '';
            return 40;
        }

        const style = window.getComputedStyle(element);
        const marginTop = parseFloat(style.marginTop) || 0;
        const marginBottom = parseFloat(style.marginBottom) || 0;
        const rect = element.getBoundingClientRect();

        measureRef.current.innerHTML = '';

        return rect.height + marginTop + marginBottom;
    }, []);

    // Pagination algorithm
    const paginate = useCallback((blocks: string[]): PageData[] => {
        if (blocks.length === 0) {
            return [{ blocks: [] }];
        }

        const result: PageData[] = [];
        let currentPage: PageData = { blocks: [] };
        let currentHeight = 0;

        for (const block of blocks) {
            // Hard page break → force new page
            if (isHardPageBreak(block)) {
                result.push(currentPage);
                currentPage = { blocks: [] };
                currentHeight = 0;
                continue;
            }

            const blockHeight = measureBlock(block);

            // Soft page break → overflow to next page
            if (currentHeight + blockHeight > PAGE_BODY_HEIGHT && currentPage.blocks.length > 0) {
                result.push(currentPage);
                currentPage = { blocks: [] };
                currentHeight = 0;
            }

            // Add block to current page
            currentPage.blocks.push(block);
            currentHeight += blockHeight;
        }

        // Add final page
        if (currentPage.blocks.length > 0 || result.length === 0) {
            result.push(currentPage);
        }

        return result;
    }, [measureBlock]);

    // Re-paginate on content change
    useEffect(() => {
        // Wait for DOM to be ready
        const rafId = requestAnimationFrame(() => {
            const blocks = parseBlocks(content);
            const paginatedPages = paginate(blocks);
            setPages(paginatedPages);
        });

        return () => cancelAnimationFrame(rafId);
    }, [content, paginate]);

    return (
        <>
            {/* Hidden offscreen measurement container */}
            <div
                ref={measureRef}
                style={{
                    position: 'absolute',
                    visibility: 'hidden',
                    width: PAGE_WIDTH - (PAGE_MARGIN * 2),
                    fontFamily: "'Calibri', Arial, sans-serif",
                    fontSize: '11pt',
                    lineHeight: 1.15,
                    left: '-9999px',
                    top: 0,
                }}
            />

            {/* Paginated page view (read-only) */}
            <div className="paged-view">
                {pages.map((page, pageIndex) => (
                    <div
                        key={pageIndex}
                        className="page-container"
                        style={{
                            width: PAGE_WIDTH,
                            minHeight: PAGE_HEIGHT,
                            padding: PAGE_MARGIN,
                        }}
                    >
                        {/* Page content */}
                        <div
                            className="page-body"
                            style={{
                                minHeight: PAGE_BODY_HEIGHT,
                                overflow: 'hidden'
                            }}
                            dangerouslySetInnerHTML={{
                                __html: page.blocks.join('')
                            }}
                        />

                        {/* Page number */}
                        <div className="page-footer">
                            Page {pageIndex + 1} of {pages.length}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
