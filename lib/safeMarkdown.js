import { marked } from 'marked';

const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const isSafeUrl = (href = '') => {
    const value = String(href).trim();
    if (!value) return false;
    if (value.startsWith('/') || value.startsWith('#')) return true;

    try {
        const url = new URL(value);
        return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol);
    } catch {
        return false;
    }
};

export const renderSafeMarkdown = (markdown = '') => {
    const renderer = new marked.Renderer();

    renderer.html = ({ text }) => escapeHtml(text);

    renderer.link = function link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        if (!isSafeUrl(href)) return text;

        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
        return `<a href="${escapeHtml(href)}"${titleAttr} rel="noopener noreferrer">${text}</a>`;
    };

    renderer.image = ({ text }) => escapeHtml(text);

    return marked.parse(String(markdown), {
        async: false,
        renderer,
    });
};
