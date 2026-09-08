/* ==========================================================================
   StudyHub — utils.js
   Funções auxiliares genéricas, sem dependência do estado da aplicação.
   ========================================================================== */

const Utils = (function () {

  function uid(prefix) {
    return (prefix ? prefix + '_' : '') + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Sanitização simples para o HTML gerado pelo editor de notas:
  // permite um conjunto pequeno de tags e remove o resto.
  function sanitizeEditorHtml(html) {
    if (!html) return '';
    const allowed = ['B', 'STRONG', 'I', 'EM', 'U', 'UL', 'OL', 'LI', 'BR', 'P', 'DIV', 'A', 'MARK', 'PRE', 'CODE', 'H3', 'H4', 'SPAN'];
    const template = document.createElement('template');
    template.innerHTML = html;

    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.ELEMENT_NODE) {
          if (!allowed.includes(child.tagName)) {
            // substitui elemento não permitido pelo seu conteúdo de texto
            const text = document.createTextNode(child.textContent);
            child.replaceWith(text);
            return;
          }
          // remove atributos perigosos, mantém apenas href em <a>
          [...child.attributes].forEach((attr) => {
            if (child.tagName === 'A' && attr.name === 'href') {
              const val = child.getAttribute('href') || '';
              if (!/^https?:\/\//i.test(val)) child.removeAttribute('href');
              else {
                child.setAttribute('target', '_blank');
                child.setAttribute('rel', 'noopener noreferrer');
              }
            } else {
              child.removeAttribute(attr.name);
            }
          });
          walk(child);
        } else if (child.nodeType !== Node.TEXT_NODE) {
          child.remove();
        }
      });
    };
    walk(template.content);
    return template.innerHTML;
  }

  function stripHtml(html) {
    const d = document.createElement('div');
    d.innerHTML = html || '';
    return d.textContent || '';
  }

  function formatDate(iso, opts) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('pt-BR', opts || { day: '2-digit', month: 'short' });
  }

  function formatDateTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function startOfDay(d) {
    const c = new Date(d);
    c.setHours(0, 0, 0, 0);
    return c;
  }

  function daysUntil(iso) {
    if (!iso) return null;
    const target = startOfDay(new Date(iso));
    const today = startOfDay(new Date());
    return Math.round((target - today) / 86400000);
  }

  function dueLabel(iso) {
    const n = daysUntil(iso);
    if (n === null) return '';
    if (n < 0) return `Atrasado (${formatDate(iso)})`;
    if (n === 0) return 'Hoje';
    if (n === 1) return 'Amanhã';
    if (n <= 7) return `Em ${n} dias`;
    return formatDate(iso);
  }

  function debounce(fn, wait) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function parseTags(str) {
    if (!str) return [];
    return [...new Set(
      str.split(',')
        .map(t => t.trim().replace(/^#/, ''))
        .filter(Boolean)
    )];
  }

  // Extrai o ID de um vídeo do YouTube a partir de vários formatos de URL.
  function extractYouTubeId(url) {
    if (!url) return null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
      /(?:youtu\.be\/)([\w-]{11})/,
      /(?:youtube\.com\/embed\/)([\w-]{11})/,
      /(?:youtube\.com\/shorts\/)([\w-]{11})/,
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m) return m[1];
    }
    return null;
  }

  function detectPlatform(url) {
    if (!url) return 'Outro';
    if (/youtube\.com|youtu\.be/i.test(url)) return 'YouTube';
    if (/vimeo\.com/i.test(url)) return 'Vimeo';
    return 'Outro';
  }

  function isValidUrl(str) {
    try {
      const u = new URL(str);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch (e) {
      return false;
    }
  }

  function faviconFor(url) {
    try {
      const u = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`;
    } catch (e) {
      return '';
    }
  }

  // ---- Toasts ----
  let toastTimer = null;
  function toast(message, type) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `toast toast-${type || 'info'}`;
    const icon = type === 'success' ? '✓' : type === 'error' ? '⚠' : 'ℹ';
    el.innerHTML = `<span aria-hidden="true">${icon}</span><span>${escapeHtml(message)}</span>`;
    container.appendChild(el);
    setTimeout(() => {
      el.classList.add('toast-out');
      setTimeout(() => el.remove(), 220);
    }, 3200);
  }

  // ---- Confirmação para ações destrutivas ----
  function confirmAction(message) {
    return window.confirm(message);
  }

  return {
    uid, nowISO, escapeHtml, sanitizeEditorHtml, stripHtml,
    formatDate, formatDateTime, daysUntil, dueLabel, isSameDay, startOfDay,
    debounce, parseTags, extractYouTubeId, detectPlatform, isValidUrl, faviconFor,
    toast, confirmAction,
  };
})();
