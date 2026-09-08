/* ==========================================================================
   StudyHub — app.js
   Estado da aplicação, roteamento, modais (CRUD) e ligação de eventos.
   ========================================================================== */

(function () {
  'use strict';

  const mainEl = document.getElementById('main-content');

  const State = {
    route: 'dashboard',
    params: {},
    filters: {
      notes: { subjectId: '' },
      tasks: { subjectId: '', status: '', priority: '' },
      links: { subjectId: '' },
      videos: { subjectId: '', status: '' },
    },
  };

  // ------------------------------------------------------------------
  // Roteamento
  // ------------------------------------------------------------------
  function setRoute(route, params) {
    State.route = route;
    State.params = params || {};
    renderView();
    updateActiveNav(route);
    closeMobileDrawer();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function updateActiveNav(route) {
    document.querySelectorAll('.nav-item[data-route]').forEach(btn => {
      const isActive = btn.dataset.route === route || (route === 'subject-detail' && btn.dataset.route === 'subjects');
      btn.classList.toggle('active', isActive);
      if (isActive) btn.setAttribute('aria-current', 'page'); else btn.removeAttribute('aria-current');
    });
  }

  function renderView() {
    const data = Storage.getData();
    let html = '';
    switch (State.route) {
      case 'dashboard': html = Render.dashboard(data); break;
      case 'subjects': html = Render.subjectsView(data); break;
      case 'subject-detail': html = Render.subjectDetail(data, State.params.id); break;
      case 'notes': html = Render.notesView(data, State.filters.notes); break;
      case 'tasks': html = Render.tasksView(data, State.filters.tasks); break;
      case 'links': html = Render.linksView(data, State.filters.links); break;
      case 'videos': html = Render.videosView(data, State.filters.videos); break;
      case 'highlights': html = Render.highlightsView(data); break;
      case 'agenda': html = Render.agendaView(data); break;
      case 'settings': html = Render.settingsView(data); break;
      case 'search': html = Render.searchResultsView(data, State.params.query || ''); break;
      default: html = Render.dashboard(data);
    }
    mainEl.innerHTML = html;
  }

  function refresh() { renderView(); }

  // ------------------------------------------------------------------
  // Modal genérico
  // ------------------------------------------------------------------
  const overlay = document.getElementById('modalOverlay');
  const modalRoot = document.getElementById('modalRoot');
  let lastFocused = null;

  function openModal(title, bodyHtml, onMount) {
    lastFocused = document.activeElement;
    modalRoot.innerHTML = `
      <div class="modal-head">
        <h2 class="modal-title">${title}</h2>
        <button class="modal-close" data-action="close-modal" aria-label="Fechar">✕</button>
      </div>
      ${bodyHtml}
    `;
    overlay.hidden = false;
    const firstInput = modalRoot.querySelector('input, textarea, select, [contenteditable]');
    if (firstInput) firstInput.focus();
    if (typeof onMount === 'function') onMount(modalRoot);
  }

  function closeModal() {
    overlay.hidden = true;
    modalRoot.innerHTML = '';
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!overlay.hidden) closeModal();
      if (!quickAddMenu.hidden) hideQuickAddMenu();
      closeMobileDrawer();
    }
  });

  // ------------------------------------------------------------------
  // Formulário: Matéria
  // ------------------------------------------------------------------
  const ICON_CHOICES = ['📚', '💻', '🧪', '📐', '⚡', '📖', '🌎', '🎨', '🎵', '🧠', '⚖️', '💰', '🏛️', '🔬'];

  function openSubjectModal(existing) {
    const isEdit = !!existing;
    const body = `
      <form id="subjectForm">
        <div class="form-group">
          <label for="subjectName">Nome da matéria</label>
          <input type="text" id="subjectName" required maxlength="40" value="${existing ? Utils.escapeHtml(existing.name) : ''}" placeholder="Ex: Química Orgânica">
        </div>
        <div class="form-group">
          <label>Ícone</label>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;">
            ${ICON_CHOICES.map(ic => `<button type="button" class="btn btn-sm" data-icon-choice="${ic}" style="font-size:1.1rem;padding:6px 10px;">${ic}</button>`).join('')}
          </div>
          <input type="text" id="subjectIcon" maxlength="4" value="${existing ? existing.icon : '📚'}" aria-label="Ícone escolhido">
        </div>
        <div class="form-footer">
          <button type="button" class="btn" data-action="close-modal">Cancelar</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Salvar alterações' : 'Criar matéria'}</button>
        </div>
      </form>
    `;
    openModal(isEdit ? 'Renomear matéria' : 'Nova matéria', body, (root) => {
      root.querySelectorAll('[data-icon-choice]').forEach(btn => {
        btn.addEventListener('click', () => { root.querySelector('#subjectIcon').value = btn.dataset.iconChoice; });
      });
      root.querySelector('#subjectForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = root.querySelector('#subjectName').value.trim();
        const icon = root.querySelector('#subjectIcon').value.trim() || '📚';
        if (!name) return;
        const data = Storage.getData();
        if (isEdit) {
          existing.name = name;
          existing.icon = icon;
          Utils.toast('Matéria atualizada!', 'success');
        } else {
          data.subjects.push({ id: Utils.uid('subj'), name, icon, createdAt: Utils.nowISO() });
          Utils.toast('Matéria criada!', 'success');
        }
        Storage.save();
        closeModal();
        refresh();
      });
    });
  }

  function deleteSubject(id) {
    if (!Utils.confirmAction('Excluir esta matéria? Notas, tarefas, links e vídeos associados NÃO serão excluídos, apenas deixarão de estar vinculados a ela.')) return;
    const data = Storage.getData();
    data.subjects = data.subjects.filter(s => s.id !== id);
    [data.notes, data.tasks, data.links, data.videos].forEach(list => {
      list.forEach(item => { if (item.subjectId === id) item.subjectId = ''; });
    });
    Storage.save();
    Utils.toast('Matéria excluída.', 'success');
    setRoute('subjects');
  }

  // ------------------------------------------------------------------
  // Formulário: Nota
  // ------------------------------------------------------------------
  function openNoteModal(existing, presetSubjectId) {
    const isEdit = !!existing;
    const data = Storage.getData();
    const body = `
      <form id="noteForm">
        <div class="form-group">
          <label for="noteTitle">Título</label>
          <input type="text" id="noteTitle" required maxlength="120" value="${existing ? Utils.escapeHtml(existing.title) : ''}" placeholder="Ex: Resumo do capítulo 3">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="noteSubject">Matéria</label>
            <select id="noteSubject">
              <option value="">Sem matéria</option>
              ${Render.subjectOptions(data, existing ? existing.subjectId : presetSubjectId)}
            </select>
          </div>
          <div class="form-group">
            <label for="noteTags">Etiquetas</label>
            <input type="text" id="noteTags" placeholder="separadas, por, vírgula" value="${existing ? (existing.tags || []).join(', ') : ''}">
          </div>
        </div>
        <div class="form-group">
          <label>Conteúdo</label>
          <div class="editor-toolbar" role="toolbar" aria-label="Formatação de texto">
            <button type="button" data-cmd="bold" title="Negrito"><b>B</b></button>
            <button type="button" data-cmd="italic" title="Itálico"><i>I</i></button>
            <button type="button" data-cmd="insertUnorderedList" title="Lista">•≡</button>
            <button type="button" data-cmd="formatBlock" data-value="H3" title="Título">H</button>
            <button type="button" data-cmd="createLinkCustom" title="Inserir link">🔗</button>
            <button type="button" data-cmd="hiliteCustom" title="Destacar texto">🖍</button>
            <button type="button" data-cmd="formatBlock" data-value="PRE" title="Bloco de código">&lt;/&gt;</button>
          </div>
          <div id="noteEditor" class="editor-content" contenteditable="true" aria-label="Conteúdo da anotação">${existing ? existing.content : ''}</div>
        </div>
        <div class="form-row">
          <div class="checkbox-row form-group">
            <input type="checkbox" id="notePinned" ${existing && existing.pinned ? 'checked' : ''}>
            <label for="notePinned" style="margin:0;">Fixar no topo</label>
          </div>
          <div class="checkbox-row form-group">
            <input type="checkbox" id="noteHighlighted" ${existing && existing.highlighted ? 'checked' : ''}>
            <label for="noteHighlighted" style="margin:0;">⭐ Destacar</label>
          </div>
        </div>
        <div class="form-footer">
          <button type="button" class="btn" data-action="close-modal">Cancelar</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Salvar alterações' : 'Criar anotação'}</button>
        </div>
      </form>
    `;
    openModal(isEdit ? 'Editar anotação' : 'Nova anotação', body, (root) => {
      const editor = root.querySelector('#noteEditor');
      root.querySelectorAll('[data-cmd]').forEach(btn => {
        btn.addEventListener('click', () => {
          editor.focus();
          const cmd = btn.dataset.cmd;
          if (cmd === 'createLinkCustom') {
            const url = window.prompt('Cole o endereço do link (https://...)');
            if (url && Utils.isValidUrl(url)) document.execCommand('createLink', false, url);
            else if (url) Utils.toast('Link inválido — use um endereço completo (https://...)', 'error');
          } else if (cmd === 'hiliteCustom') {
            document.execCommand('hiliteColor', false, 'transparent');
            document.execCommand('backColor', false, '#f2a65a55');
          } else if (cmd === 'formatBlock') {
            document.execCommand('formatBlock', false, btn.dataset.value);
          } else {
            document.execCommand(cmd, false, null);
          }
        });
      });

      root.querySelector('#noteForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const title = root.querySelector('#noteTitle').value.trim();
        if (!title) return;
        const subjectId = root.querySelector('#noteSubject').value;
        const tags = Utils.parseTags(root.querySelector('#noteTags').value);
        const content = Utils.sanitizeEditorHtml(editor.innerHTML);
        const pinned = root.querySelector('#notePinned').checked;
        const highlighted = root.querySelector('#noteHighlighted').checked;
        const d = Storage.getData();
        if (isEdit) {
          Object.assign(existing, { title, subjectId, tags, content, pinned, highlighted, updatedAt: Utils.nowISO() });
          Utils.toast('Anotação salva!', 'success');
        } else {
          d.notes.push({ id: Utils.uid('note'), title, subjectId, tags, content, pinned, highlighted, createdAt: Utils.nowISO(), updatedAt: Utils.nowISO() });
          Utils.toast('Anotação salva!', 'success');
        }
        Storage.save();
        closeModal();
        refresh();
      });
    });
  }

  function deleteNote(id) {
    if (!Utils.confirmAction('Excluir esta anotação? Essa ação não pode ser desfeita.')) return;
    const data = Storage.getData();
    data.notes = data.notes.filter(n => n.id !== id);
    Storage.save();
    Utils.toast('Anotação excluída.', 'success');
    refresh();
  }

  // ------------------------------------------------------------------
  // Formulário: Tarefa
  // ------------------------------------------------------------------
  function openTaskModal(existing, presetSubjectId) {
    const isEdit = !!existing;
    const data = Storage.getData();
    const body = `
      <form id="taskForm">
        <div class="form-group">
          <label for="taskTitle">Título</label>
          <input type="text" id="taskTitle" required maxlength="120" value="${existing ? Utils.escapeHtml(existing.title) : ''}" placeholder="Ex: Estudar para a prova">
        </div>
        <div class="form-group">
          <label for="taskDesc">Descrição</label>
          <textarea id="taskDesc" placeholder="Detalhes da tarefa (opcional)">${existing ? Utils.escapeHtml(existing.description || '') : ''}</textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="taskSubject">Matéria</label>
            <select id="taskSubject"><option value="">Sem matéria</option>${Render.subjectOptions(data, existing ? existing.subjectId : presetSubjectId)}</select>
          </div>
          <div class="form-group">
            <label for="taskPriority">Prioridade</label>
            <select id="taskPriority">
              <option value="baixa" ${existing && existing.priority === 'baixa' ? 'selected' : ''}>🟢 Baixa</option>
              <option value="media" ${!existing || existing.priority === 'media' ? 'selected' : ''}>🟡 Média</option>
              <option value="alta" ${existing && existing.priority === 'alta' ? 'selected' : ''}>🔴 Alta</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="taskDue">Prazo</label>
            <input type="date" id="taskDue" value="${existing && existing.dueDate ? existing.dueDate : ''}">
          </div>
          <div class="form-group">
            <label for="taskTags">Etiquetas</label>
            <input type="text" id="taskTags" placeholder="separadas, por, vírgula" value="${existing ? (existing.tags || []).join(', ') : ''}">
          </div>
        </div>
        <div class="checkbox-row form-group">
          <input type="checkbox" id="taskHighlighted" ${existing && existing.highlighted ? 'checked' : ''}>
          <label for="taskHighlighted" style="margin:0;">⭐ Destacar</label>
        </div>
        <div class="form-footer">
          <button type="button" class="btn" data-action="close-modal">Cancelar</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Salvar alterações' : 'Criar tarefa'}</button>
        </div>
      </form>
    `;
    openModal(isEdit ? 'Editar tarefa' : 'Nova tarefa', body, (root) => {
      root.querySelector('#taskForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const title = root.querySelector('#taskTitle').value.trim();
        if (!title) return;
        const description = root.querySelector('#taskDesc').value.trim();
        const subjectId = root.querySelector('#taskSubject').value;
        const priority = root.querySelector('#taskPriority').value;
        const dueDate = root.querySelector('#taskDue').value;
        const tags = Utils.parseTags(root.querySelector('#taskTags').value);
        const highlighted = root.querySelector('#taskHighlighted').checked;
        const d = Storage.getData();
        if (isEdit) {
          Object.assign(existing, { title, description, subjectId, priority, dueDate, tags, highlighted });
          Utils.toast('Tarefa atualizada!', 'success');
        } else {
          d.tasks.push({ id: Utils.uid('task'), title, description, subjectId, priority, dueDate, tags, highlighted, status: 'pendente', createdAt: Utils.nowISO() });
          Utils.toast('Tarefa criada!', 'success');
        }
        Storage.save();
        closeModal();
        refresh();
      });
    });
  }

  function deleteTask(id) {
    if (!Utils.confirmAction('Excluir esta tarefa?')) return;
    const data = Storage.getData();
    data.tasks = data.tasks.filter(t => t.id !== id);
    Storage.save();
    Utils.toast('Tarefa excluída.', 'success');
    refresh();
  }

  function toggleTask(id) {
    const data = Storage.getData();
    const t = data.tasks.find(x => x.id === id);
    if (!t) return;
    t.status = t.status === 'concluida' ? 'pendente' : 'concluida';
    Storage.save();
    if (t.status === 'concluida') Utils.toast('Tarefa concluída! 🎉', 'success');
    refresh();
  }

  // ------------------------------------------------------------------
  // Formulário: Link
  // ------------------------------------------------------------------
  function openLinkModal(existing, presetSubjectId) {
    const isEdit = !!existing;
    const data = Storage.getData();
    const body = `
      <form id="linkForm">
        <div class="form-group">
          <label for="linkUrl">Endereço (URL)</label>
          <input type="url" id="linkUrl" required placeholder="https://..." value="${existing ? Utils.escapeHtml(existing.url) : ''}">
        </div>
        <div class="form-group">
          <label for="linkTitle">Título</label>
          <input type="text" id="linkTitle" required maxlength="120" value="${existing ? Utils.escapeHtml(existing.title) : ''}" placeholder="Ex: Documentação oficial">
        </div>
        <div class="form-group">
          <label for="linkDesc">Descrição</label>
          <textarea id="linkDesc" placeholder="Do que se trata esse link? (opcional)">${existing ? Utils.escapeHtml(existing.description || '') : ''}</textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="linkSubject">Matéria</label>
            <select id="linkSubject"><option value="">Sem matéria</option>${Render.subjectOptions(data, existing ? existing.subjectId : presetSubjectId)}</select>
          </div>
          <div class="form-group">
            <label for="linkCategory">Categoria</label>
            <input type="text" id="linkCategory" placeholder="Ex: Documentação" value="${existing ? Utils.escapeHtml(existing.category || '') : ''}">
          </div>
        </div>
        <div class="form-group">
          <label for="linkTags">Etiquetas</label>
          <input type="text" id="linkTags" placeholder="separadas, por, vírgula" value="${existing ? (existing.tags || []).join(', ') : ''}">
        </div>
        <div class="checkbox-row form-group">
          <input type="checkbox" id="linkHighlighted" ${existing && existing.highlighted ? 'checked' : ''}>
          <label for="linkHighlighted" style="margin:0;">⭐ Destacar</label>
        </div>
        <div class="form-footer">
          <button type="button" class="btn" data-action="close-modal">Cancelar</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Salvar alterações' : 'Salvar link'}</button>
        </div>
      </form>
    `;
    openModal(isEdit ? 'Editar link' : 'Novo link', body, (root) => {
      root.querySelector('#linkForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const url = root.querySelector('#linkUrl').value.trim();
        const title = root.querySelector('#linkTitle').value.trim();
        if (!title || !Utils.isValidUrl(url)) {
          Utils.toast('Informe um título e uma URL válida (https://...)', 'error');
          return;
        }
        const description = root.querySelector('#linkDesc').value.trim();
        const subjectId = root.querySelector('#linkSubject').value;
        const category = root.querySelector('#linkCategory').value.trim();
        const tags = Utils.parseTags(root.querySelector('#linkTags').value);
        const highlighted = root.querySelector('#linkHighlighted').checked;
        const d = Storage.getData();
        if (isEdit) {
          Object.assign(existing, { url, title, description, subjectId, category, tags, highlighted });
          Utils.toast('Link atualizado!', 'success');
        } else {
          d.links.push({ id: Utils.uid('link'), url, title, description, subjectId, category, tags, highlighted, createdAt: Utils.nowISO() });
          Utils.toast('Link adicionado!', 'success');
        }
        Storage.save();
        closeModal();
        refresh();
      });
    });
  }

  function deleteLink(id) {
    if (!Utils.confirmAction('Excluir este link?')) return;
    const data = Storage.getData();
    data.links = data.links.filter(l => l.id !== id);
    Storage.save();
    Utils.toast('Link excluído.', 'success');
    refresh();
  }

  // ------------------------------------------------------------------
  // Formulário: Vídeo
  // ------------------------------------------------------------------
  function openVideoModal(existing, presetSubjectId) {
    const isEdit = !!existing;
    const data = Storage.getData();
    const body = `
      <form id="videoForm">
        <div class="form-group">
          <label for="videoUrl">Endereço do vídeo</label>
          <input type="url" id="videoUrl" required placeholder="https://www.youtube.com/watch?v=..." value="${existing ? Utils.escapeHtml(existing.url) : ''}">
          <div id="videoPreview" style="margin-top:10px;"></div>
        </div>
        <div class="form-group">
          <label for="videoTitle">Título</label>
          <input type="text" id="videoTitle" required maxlength="120" value="${existing ? Utils.escapeHtml(existing.title) : ''}" placeholder="Ex: Aula de Introdução a CSS Grid">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="videoSubject">Matéria</label>
            <select id="videoSubject"><option value="">Sem matéria</option>${Render.subjectOptions(data, existing ? existing.subjectId : presetSubjectId)}</select>
          </div>
          <div class="form-group">
            <label for="videoCategory">Categoria</label>
            <input type="text" id="videoCategory" placeholder="Ex: Aula" value="${existing ? Utils.escapeHtml(existing.category || '') : ''}">
          </div>
        </div>
        <div class="form-group">
          <label for="videoStatusSel">Status</label>
          <select id="videoStatusSel">
            <option value="nao" ${!existing || existing.status === 'nao' ? 'selected' : ''}>☐ Não assistido</option>
            <option value="assistindo" ${existing && existing.status === 'assistindo' ? 'selected' : ''}>◐ Assistindo</option>
            <option value="concluido" ${existing && existing.status === 'concluido' ? 'selected' : ''}>✓ Concluído</option>
          </select>
        </div>
        <div class="checkbox-row form-group">
          <input type="checkbox" id="videoHighlighted" ${existing && existing.highlighted ? 'checked' : ''}>
          <label for="videoHighlighted" style="margin:0;">⭐ Destacar</label>
        </div>
        <div class="form-footer">
          <button type="button" class="btn" data-action="close-modal">Cancelar</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Salvar alterações' : 'Salvar vídeo'}</button>
        </div>
      </form>
    `;
    openModal(isEdit ? 'Editar vídeo' : 'Novo vídeo', body, (root) => {
      const urlInput = root.querySelector('#videoUrl');
      const preview = root.querySelector('#videoPreview');
      function updatePreview() {
        const vid = Utils.extractYouTubeId(urlInput.value.trim());
        preview.innerHTML = vid ? `<img src="https://img.youtube.com/vi/${vid}/mqdefault.jpg" alt="Pré-visualização da miniatura" style="border-radius:8px;max-width:220px;">` : '';
      }
      urlInput.addEventListener('input', Utils.debounce(updatePreview, 200));
      updatePreview();

      root.querySelector('#videoForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const url = urlInput.value.trim();
        const title = root.querySelector('#videoTitle').value.trim();
        if (!title || !Utils.isValidUrl(url)) {
          Utils.toast('Informe um título e uma URL válida (https://...)', 'error');
          return;
        }
        const subjectId = root.querySelector('#videoSubject').value;
        const category = root.querySelector('#videoCategory').value.trim();
        const status = root.querySelector('#videoStatusSel').value;
        const highlighted = root.querySelector('#videoHighlighted').checked;
        const videoId = Utils.extractYouTubeId(url);
        const platform = Utils.detectPlatform(url);
        const d = Storage.getData();
        if (isEdit) {
          Object.assign(existing, { url, title, subjectId, category, status, highlighted, videoId, platform });
          Utils.toast('Vídeo atualizado!', 'success');
        } else {
          d.videos.push({ id: Utils.uid('video'), url, title, subjectId, category, status, highlighted, videoId, platform, createdAt: Utils.nowISO() });
          Utils.toast('Vídeo salvo!', 'success');
        }
        Storage.save();
        closeModal();
        refresh();
      });
    });
  }

  function deleteVideo(id) {
    if (!Utils.confirmAction('Excluir este vídeo?')) return;
    const data = Storage.getData();
    data.videos = data.videos.filter(v => v.id !== id);
    Storage.save();
    Utils.toast('Vídeo excluído.', 'success');
    refresh();
  }

  function setVideoStatus(id, status) {
    const data = Storage.getData();
    const v = data.videos.find(x => x.id === id);
    if (!v) return;
    v.status = status;
    Storage.save();
    refresh();
  }

  // ------------------------------------------------------------------
  // Destaques (genérico para os 4 tipos)
  // ------------------------------------------------------------------
  function toggleHighlight(type, id) {
    const data = Storage.getData();
    const map = { note: data.notes, task: data.tasks, link: data.links, video: data.videos };
    const list = map[type];
    const item = list && list.find(i => i.id === id);
    if (!item) return;
    item.highlighted = !item.highlighted;
    Storage.save();
    refresh();
  }

  function togglePinNote(id) {
    const data = Storage.getData();
    const n = data.notes.find(x => x.id === id);
    if (!n) return;
    n.pinned = !n.pinned;
    Storage.save();
    refresh();
  }

  // ------------------------------------------------------------------
  // Quick add: abre o modal certo, com matéria pré-selecionada quando houver
  // ------------------------------------------------------------------
  function quickNew(type, presetSubjectId) {
    if (type === 'note') return openNoteModal(null, presetSubjectId);
    if (type === 'task') return openTaskModal(null, presetSubjectId);
    if (type === 'link') return openLinkModal(null, presetSubjectId);
    if (type === 'video') return openVideoModal(null, presetSubjectId);
    if (type === 'subject') return openSubjectModal(null);
  }

  // ------------------------------------------------------------------
  // Quick-add menu (botão "＋ Novo" da topbar)
  // ------------------------------------------------------------------
  const quickAddBtn = document.getElementById('quickAddBtn');
  const quickAddMenu = document.getElementById('quickAddMenu');

  function showQuickAddMenu() {
    const rect = quickAddBtn.getBoundingClientRect();
    quickAddMenu.hidden = false;
    const menuWidth = quickAddMenu.offsetWidth || 190;
    let left = rect.right - menuWidth;
    left = Math.max(10, Math.min(left, window.innerWidth - menuWidth - 10));
    quickAddMenu.style.top = (rect.bottom + 8) + 'px';
    quickAddMenu.style.left = left + 'px';
  }
  function hideQuickAddMenu() { quickAddMenu.hidden = true; }

  quickAddBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    quickAddMenu.hidden ? showQuickAddMenu() : hideQuickAddMenu();
  });
  document.addEventListener('click', (e) => {
    if (!quickAddMenu.hidden && !quickAddMenu.contains(e.target) && e.target !== quickAddBtn) hideQuickAddMenu();
  });
  quickAddMenu.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-quick]');
    if (!btn) return;
    hideQuickAddMenu();
    quickNew(btn.dataset.quick);
  });

  // ------------------------------------------------------------------
  // Tema
  // ------------------------------------------------------------------
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const icon = theme === 'dark' ? '🌙' : '☀️';
    const btnIcon = document.getElementById('themeIcon');
    if (btnIcon) btnIcon.textContent = icon;
    const mobileBtn = document.getElementById('mobileThemeBtn');
    if (mobileBtn) mobileBtn.querySelector('span').textContent = icon;
  }

  function toggleTheme() {
    const current = Storage.getTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    Storage.setTheme(next);
    applyTheme(next);
    if (State.route === 'settings') refresh();
  }

  document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);
  document.getElementById('mobileThemeBtn').addEventListener('click', toggleTheme);

  // ------------------------------------------------------------------
  // Menu mobile (drawer)
  // ------------------------------------------------------------------
  const drawer = document.getElementById('mobileDrawer');
  const drawerOverlay = document.getElementById('drawerOverlay');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');

  function openMobileDrawer() {
    drawer.hidden = false;
    drawerOverlay.hidden = false;
    requestAnimationFrame(() => drawer.classList.add('open'));
    mobileMenuBtn.setAttribute('aria-expanded', 'true');
  }
  function closeMobileDrawer() {
    drawer.classList.remove('open');
    mobileMenuBtn.setAttribute('aria-expanded', 'false');
    setTimeout(() => { drawer.hidden = true; drawerOverlay.hidden = true; }, 200);
  }
  mobileMenuBtn.addEventListener('click', () => {
    drawer.hidden ? openMobileDrawer() : closeMobileDrawer();
  });
  drawerOverlay.addEventListener('click', closeMobileDrawer);

  // ------------------------------------------------------------------
  // Busca global
  // ------------------------------------------------------------------
  const searchInput = document.getElementById('globalSearch');
  let previousRouteBeforeSearch = 'dashboard';

  searchInput.addEventListener('input', Utils.debounce(() => {
    const q = searchInput.value;
    if (q.trim()) {
      if (State.route !== 'search') previousRouteBeforeSearch = State.route;
      setRoute('search', { query: q });
    } else if (State.route === 'search') {
      setRoute(previousRouteBeforeSearch);
    }
  }, 250));

  // ------------------------------------------------------------------
  // Navegação (sidebar + drawer)
  // ------------------------------------------------------------------
  document.querySelectorAll('.nav-item[data-route]').forEach(btn => {
    btn.addEventListener('click', () => {
      searchInput.value = '';
      setRoute(btn.dataset.route);
    });
  });

  // ------------------------------------------------------------------
  // Delegação de eventos dentro do conteúdo principal e dos modais
  // ------------------------------------------------------------------
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;
    const id = el.dataset.id;
    const data = Storage.getData();

    switch (action) {
      case 'close-modal': closeModal(); break;

      case 'navigate': setRoute(el.dataset.route); break;

      case 'open-subject': setRoute('subject-detail', { id }); break;
      case 'new-subject': openSubjectModal(null); break;
      case 'edit-subject': openSubjectModal(data.subjects.find(s => s.id === id)); break;
      case 'delete-subject': deleteSubject(id); break;

      case 'quick-new': quickNew(el.dataset.type, el.dataset.subject || ''); break;

      case 'edit-note': openNoteModal(data.notes.find(n => n.id === id)); break;
      case 'delete-note': deleteNote(id); break;
      case 'pin-note': togglePinNote(id); break;

      case 'edit-task': openTaskModal(data.tasks.find(t => t.id === id)); break;
      case 'delete-task': deleteTask(id); break;
      case 'toggle-task': toggleTask(id); break;

      case 'edit-link': openLinkModal(data.links.find(l => l.id === id)); break;
      case 'delete-link': deleteLink(id); break;

      case 'edit-video': openVideoModal(data.videos.find(v => v.id === id)); break;
      case 'delete-video': deleteVideo(id); break;

      case 'toggle-highlight': toggleHighlight(el.dataset.type, id); break;

      case 'filter-subject':
        State.filters[el.dataset.type].subjectId = id;
        renderView();
        break;
      case 'filter-status':
        State.filters.tasks.status = State.filters.tasks.status === id ? '' : id;
        renderView();
        break;
      case 'filter-priority':
        State.filters.tasks.priority = State.filters.tasks.priority === id ? '' : id;
        renderView();
        break;
      case 'filter-video-status':
        State.filters.videos.status = id;
        renderView();
        break;

      case 'set-theme': Storage.setTheme(id); applyTheme(id); refresh(); break;
      case 'export-data': exportData(); break;
      case 'trigger-import': document.getElementById('importFileInput').click(); break;
      case 'clear-data': clearAllData(); break;
    }
  });

  document.addEventListener('change', (e) => {
    if (e.target.matches('[data-action="video-status"]')) {
      setVideoStatus(e.target.dataset.id, e.target.value);
    }
    if (e.target.id === 'importFileInput') {
      importDataFromFile(e.target.files[0]);
      e.target.value = '';
    }
  });

  // ------------------------------------------------------------------
  // Exportar / Importar / Limpar
  // ------------------------------------------------------------------
  function exportData() {
    const json = Storage.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `studyhub-backup-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    Utils.toast('Dados exportados com sucesso!', 'success');
  }

  function importDataFromFile(file) {
    if (!file) return;
    if (!Utils.confirmAction('Importar este arquivo substituirá TODOS os dados atuais do StudyHub. Deseja continuar?')) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        Storage.importJSON(reader.result);
        Utils.toast('Dados importados com sucesso!', 'success');
        setRoute('dashboard');
      } catch (err) {
        Utils.toast(err.message || 'Não foi possível importar o arquivo.', 'error');
      }
    };
    reader.onerror = () => Utils.toast('Erro ao ler o arquivo selecionado.', 'error');
    reader.readAsText(file);
  }

  function clearAllData() {
    if (!Utils.confirmAction('Isso apagará PERMANENTEMENTE todas as matérias, notas, tarefas, links e vídeos. Esta ação não pode ser desfeita. Continuar?')) return;
    Storage.clearAll();
    Utils.toast('Todos os dados foram apagados.', 'success');
    setRoute('dashboard');
  }

  // ------------------------------------------------------------------
  // Inicialização
  // ------------------------------------------------------------------
  function init() {
    applyTheme(Storage.getTheme());
    Storage.getData(); // garante seed na primeira execução
    setRoute('dashboard');

    // Atualiza a saudação e datas relativas periodicamente
    setInterval(() => { if (State.route === 'dashboard') refresh(); }, 60000);

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {
          /* silencioso: app funciona normalmente sem PWA */
        });
      });
    }
  }

  init();
})();
