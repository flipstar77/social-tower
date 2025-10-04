// Content extraction utilities for Tower Wiki scraper
// Handles extracting clean content, tables, and info boxes from scraped HTML

const cheerio = require('cheerio');

class ContentExtractor {
    /**
     * Extract clean text content from parsed HTML
     * @param {CheerioStatic} $ - Cheerio instance with loaded HTML
     * @returns {string} Clean text content
     */
    extractCleanContent($) {
        // Remove unwanted elements
        $(
            'script, style, .navbox, .toc, .mw-editsection, .thumbcaption, ' +
            '.mw-references-wrap, sup.reference, .mw-cite-backlink, ' +
            '.printfooter, .catlinks, #footer'
        ).remove();

        // Get main content area
        let content = $('.mw-parser-output').text() || $('body').text();

        // Clean up whitespace and formatting
        content = content
            .replace(/\[\d+\]/g, '') // Remove reference numbers
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
            .trim();

        return content;
    }

    /**
     * Extract tables as structured data
     * @param {CheerioStatic} $ - Cheerio instance with loaded HTML
     * @returns {Array} Array of table objects with headers and rows
     */
    extractTables($) {
        const tables = [];

        $('table').each((i, table) => {
            const $table = $(table);

            // Skip navigation tables
            if ($table.hasClass('navbox') || $table.hasClass('infobox')) {
                return;
            }

            const rows = [];
            let headers = [];

            $table.find('tr').each((j, row) => {
                const $row = $(row);
                const cells = [];

                $row.find('td, th').each((k, cell) => {
                    const $cell = $(cell);
                    let cellText = $cell.text().trim();

                    // Clean up cell content
                    cellText = cellText.replace(/\s+/g, ' ').trim();

                    if (cellText) {
                        cells.push(cellText);
                    }
                });

                if (cells.length > 0) {
                    if (j === 0 && $row.find('th').length > 0) {
                        headers = cells;
                    } else {
                        rows.push(cells);
                    }
                }
            });

            if (rows.length > 0) {
                tables.push({
                    index: i,
                    headers: headers,
                    rows: rows,
                    caption: $table.find('caption').text().trim() || '',
                    rowCount: rows.length
                });
            }
        });

        return tables;
    }

    /**
     * Extract info boxes from the HTML
     * @param {CheerioStatic} $ - Cheerio instance with loaded HTML
     * @returns {Array} Array of info box objects
     */
    extractInfoBoxes($) {
        const infoBoxes = [];

        $('.infobox').each((i, box) => {
            const $box = $(box);
            const data = {};

            $box.find('tr').each((j, row) => {
                const $row = $(row);
                const label = $row.find('th').text().trim();
                const value = $row.find('td').text().trim();

                if (label && value) {
                    data[label] = value;
                }
            });

            if (Object.keys(data).length > 0) {
                infoBoxes.push({
                    index: i,
                    data: data
                });
            }
        });

        return infoBoxes;
    }

    /**
     * Process raw page data into structured format
     * @param {Object} rawPageData - Raw data from wiki API
     * @param {string} title - Page title
     * @param {string} baseUrl - Base URL for the wiki
     * @returns {Object|null} Structured page data or null if processing fails
     */
    processPageData(rawPageData, title, baseUrl) {
        try {
            const data = rawPageData;

            if (data.error) {
                console.log(`❌ Error processing ${title}: ${data.error.info}`);
                return null;
            }

            const $ = cheerio.load(data.parse.text['*']);

            // Extract clean text content
            const content = this.extractCleanContent($);

            // Extract tables and structured data
            const tables = this.extractTables($);

            // Extract info boxes
            const infoBoxes = this.extractInfoBoxes($);

            // Extract categories
            const categories = data.parse.categories?.map(cat => cat['*']) || [];

            // Extract internal links
            const links = data.parse.links?.filter(link =>
                !link['*'].includes(':') &&
                !link['*'].startsWith('Category:')
            ).map(link => link['*']) || [];

            // Extract sections
            const sections = data.parse.sections?.map(section => ({
                title: section.line,
                level: section.level,
                index: section.index
            })) || [];

            return {
                title,
                url: `${baseUrl}/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
                content,
                tables,
                infoBoxes,
                categories,
                links,
                sections,
                wordCount: content.split(/\s+/).filter(word => word.length > 0).length,
                scrapedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error(`❌ Error processing page data for ${title}:`, error.message);
            return null;
        }
    }
}

module.exports = ContentExtractor;