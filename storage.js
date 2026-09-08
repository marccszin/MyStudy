/* ==========================================================================
   StudyHub — storage.js
   Modelo de dados + persistência em LocalStorage.
   Toda leitura/escrita de dados do app passa por aqui.
   ========================================================================== */

const Storage = (function () {

  const DATA_KEY = 'studyhub.data.v1';
  const THEME_KEY = 'studyhub.theme';

  let cache = null; // dados em memória, sincronizados com o LocalStorage

  function emptyData() {
    return {
      version: 1,
      subjects: [],
      notes: [],
      tasks: [],
      links: [],
      videos: [],
      createdAt: Utils.nowISO(),
    };
  }

  function seedData() {
    const subjDev = { id: Utils.uid('subj'), name: 'Desenvolvimento Web', icon: '💻', createdAt: Utils.nowISO(), isSample: true };

    const data = emptyData();
    data.subjects = [subjDev];

    data.tasks = [{
      id: Utils.uid('task'),
      title: 'Praticar exercícios de JavaScript (arrays)',
      description: 'Resolver 10 exercícios sobre métodos de array: map, filter e reduce.',
      subjectId: subjDev.id,
      priority: 'media',
      dueDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
      tags: ['javascript', 'exemplo'],
      status: 'pendente',
      createdAt: Utils.nowISO(),
      highlighted: false,
      isSample: true,
    }];

    data.notes = [{
      id: Utils.uid('note'),
      title: 'Resumo: Arrays em JavaScript',
      content: '<p>Arrays são estruturas usadas para armazenar <b>listas de valores</b>.</p><ul><li>push() adiciona ao final</li><li>map() transforma cada item</li><li>filter() seleciona itens</li></ul>',
      subjectId: subjDev.id,
      tags: ['javascript', 'exemplo'],
      createdAt: Utils.nowISO(),
      updatedAt: Utils.nowISO(),
      pinned: true,
      highlighted: true,
      isSample: true,
    }];

    data.links = [{
      id: Utils.uid('link'),
      title: 'MDN Web Docs',
      description: 'Documentação completa e confiável para desenvolvimento web.',
      url: 'https://developer.mozilla.org/pt-BR/',
      subjectId: subjDev.id,
      category: 'Documentação',
      tags: ['referência', 'exemplo'],
      createdAt: Utils.nowISO(),
      highlighted: false,
      isSample: true,
    }];

    data.videos = [{
      id: Utils.uid('video'),
      title: 'Introdução a Flexbox e Grid',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      videoId: 'dQw4w9WgXcQ',
      platform: 'YouTube',
      subjectId: subjDev.id,
      category: 'Aula',
      status: 'nao',
      createdAt: Utils.nowISO(),
      highlighted: false,
      isSample: true,
    }];

    return data;
  }

  function load() {
    if (cache) return cache;
    try {
      const raw = localStorage.getItem(DATA_KEY);
      if (raw) {
        cache = JSON.parse(raw);
        cache = migrate(cache);
      } else {
        cache = seedData();
        persist();
      }
    } catch (e) {
      console.error('StudyHub: falha ao ler dados salvos, iniciando novo conjunto.', e);
      cache = seedData();
      persist();
    }
    return cache;
  }

  function migrate(data) {
    const base = emptyData();
    return Object.assign(base, data, {
      subjects: Array.isArray(data.subjects) ? data.subjects : [],
      notes: Array.isArray(data.notes) ? data.notes : [],
      tasks: Array.isArray(data.tasks) ? data.tasks : [],
      links: Array.isArray(data.links) ? data.links : [],
      videos: Array.isArray(data.videos) ? data.videos : [],
    });
  }

  function persist() {
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(cache));
      return true;
    } catch (e) {
      console.error('StudyHub: não foi possível salvar os dados.', e);
      Utils.toast('Não foi possível salvar — armazenamento local indisponível ou cheio.', 'error');
      return false;
    }
  }

  function getData() {
    return load();
  }

  function save() {
    return persist();
  }

  // ---- Tema ----
  function getTheme() {
    return localStorage.getItem(THEME_KEY) || 'dark';
  }
  function setTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
  }

  // ---- Exportar / Importar / Limpar ----
  function exportJSON() {
    return JSON.stringify(load(), null, 2);
  }

  function importJSON(jsonString) {
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      throw new Error('Arquivo inválido: não é um JSON válido.');
    }
    const requiredKeys = ['subjects', 'notes', 'tasks', 'links', 'videos'];
    const hasAllKeys = requiredKeys.every(k => Array.isArray(parsed[k]));
    if (!hasAllKeys) {
      throw new Error('Arquivo inválido: estrutura de dados do StudyHub não reconhecida.');
    }
    cache = migrate(parsed);
    persist();
    return cache;
  }

  function clearAll() {
    cache = emptyData();
    persist();
  }

  function estimateSizeBytes() {
    try {
      const raw = localStorage.getItem(DATA_KEY) || '';
      return new Blob([raw]).size;
    } catch (e) {
      return (localStorage.getItem(DATA_KEY) || '').length;
    }
  }

  return {
    getData, save, seedData,
    getTheme, setTheme,
    exportJSON, importJSON, clearAll,
    estimateSizeBytes,
  };
})();
