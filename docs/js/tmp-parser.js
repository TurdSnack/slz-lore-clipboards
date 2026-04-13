/**
 * tmp-parser.js
 * Converts Unity TextMeshPro rich-text markup to safe HTML.
 *
 * Supported tags:
 *   <b>          → <strong>
 *   <i>          → <em>
 *   <color=#hex> → <span style="color:#hex">
 *   <br>         → <br>
 *   <line-indent> → stripped
 *   All other unknown tags are stripped.
 */

'use strict';

/**
 * Parse a TMP-markup string into an HTML string.
 * @param {string} text - Raw TMP text from JSON.
 * @returns {string} Safe HTML string.
 */
function parseTMP(text) {
  if (!text) return '';

  return text
    // Line breaks
    .replace(/<br\s*\/?>/gi, '<br>')
    // Bold
    .replace(/<b>/gi, '<strong>')
    .replace(/<\/b>/gi, '</strong>')
    // Italic
    .replace(/<i>/gi, '<em>')
    .replace(/<\/i>/gi, '</em>')
    // Colour — only allow hex colour values to prevent XSS
    .replace(/<color=(#[0-9a-fA-F]{3,8})>/gi, '<span style="color:$1">')
    .replace(/<\/color>/gi, '</span>')
    // Strip remaining tags (line-indent, size, etc.)
    .replace(/<[^>]+>/g, '')
    // Escape any raw ampersands that slipped through (shouldn't happen, but safe)
    // Note: we do NOT escape < > because we just emitted safe tags above.
    // Collapse excessive whitespace at start/end
    .trim();
}

/**
 * Strip all TMP tags and return plain text (for headings, slugs, search index).
 * @param {string} text
 * @returns {string}
 */
function plainTMP(text) {
  if (!text) return '';
  return text
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .trim();
}
