/* ==========================================================================
   StudyHub — render.js
   Funções de renderização (retornam HTML). Não alteram estado.
   ========================================================================== */

const Render = (function () {

  const PRIORITY_LABEL = { alta: 'Alta', media: 'Média', baixa: 'Baixa' };
  const PRIORITY_ICON = { alta: '🔴', media: '🟡', baixa: '🟢' };
  const VIDEO_STATUS_LABEL = { nao: 'Não assistido', assistindo: 'Assistindo', concluido: 'Concluído' };
  const VIDEO_STATUS_ICON = { nao: '☐', assistindo: '◐', concluido: '✓' };

  function subjectById(data, id) {
    return data.subjects.find(s => s.id === id) || null;
  }

  function subjectOptions(data, selectedId) {
    return data.subjects.map(s =>
      `<option value="${s.id}" ${s.id === selectedId ? 'selected' : ''}>${s.icon} ${Utils.escapeHtml(s.name)}</option>`
    ).join('') || '<option value="">Nenhuma matéria criada</option>';
  }

  function tagsHtml(tags) {
    if (!tags || !tags.length) return '';
    return tags.map(t => `<span class="chip chip-tag">${Utils.escapeHtml(t)}</span>`).join('');
  }

  function subjectChip(data, subjectId) {
    const s = subjectById(data, subjectId);
    if (!s) return '';
    return `<span class="chip chip-subject">${s.icon} ${Utils.escapeHtml(s.name)}</span>`;
  }

  function starButton(type, id, active) {
    return `<button class="star-btn ${active ? 'is-active' : ''}" data-action="toggle-highlight" data-type="${type}" data-id="${id}" aria-label="${active ? 'Remover destaque' : 'Destacar'}" title="${active ? 'Remover destaque' : 'Destacar'}">${active ? '⭐' : '☆'}</button>`;
  }

  function emptyState(icon, title, desc, actionLabel, actionAttr) {
    return `<div class="empty-state">
      <div style="font-size:2rem;margin-bottom:10px;" aria-hidden="true">${icon}</div>
      <strong>${title}</strong>
      <p>${desc}</p>
      ${actionLabel ? `<button class="btn btn-primary" style="margin-top:16px;" ${actionAttr}>${actionLabel}</button>` : ''}
    </div>`;
  }

  // ---------------------------------------------------------------------
  // Cards
  // ---------------------------------------------------------------------
  function noteCard(data, note) {
    return `
    <article class="item-card note-card ${note.pinned ? 'is-pinned' : ''}">
      <div class="item-card-top">
        <h3 class="item-title">${note.pinned ? '📌 ' : ''}${Utils.escapeHtml(note.title)}</h3>
        ${starButton('note', note.id, note.highlighted)}
      </div>
      <div class="note-content-preview">${note.content ? note.content : '<em>Sem conteúdo</em>'}</div>
      <div class="item-meta">
        ${subjectChip(data, note.subjectId)}
        ${tagsHtml(note.tags)}
      </div>
      <div class="card-actions">
        <button data-action="edit-note" data-id="${note.id}">Editar</button>
        <button data-action="pin-note" data-id="${note.id}">${note.pinned ? 'Desafixar' : 'Fixar'}</button>
        <button class="danger" data-action="delete-note" data-id="${note.id}">Excluir</button>
      </div>
    </article>`;
  }

  function taskCard(data, task) {
    const done = task.status === 'concluida';
    return `
    <article class="item-card ${done ? 'is-done' : ''}">
      <div class="task-row">
        <button class="task-check ${done ? 'checked' : ''}" data-action="toggle-task" data-id="${task.id}" aria-label="${done ? 'Marcar como pendente' : 'Marcar como concluída'}">${done ? '✓' : ''}</button>
        <div class="task-row-body">
          <div class="item-card-top">
            <h3 class="item-title ${done ? 'strike' : ''}">${Utils.escapeHtml(task.title)}</h3>
            ${starButton('task', task.id, task.highlighted)}
          </div>
          ${task.description ? `<p class="item-desc">${Utils.escapeHtml(task.description)}</p>` : ''}
          <div class="item-meta">
            <span class="chip chip-priority-${task.priority}">${PRIORITY_ICON[task.priority]} ${PRIORITY_LABEL[task.priority]}</span>
            ${subjectChip(data, task.subjectId)}
            ${task.dueDate ? `<span class="chip">📅 ${Utils.dueLabel(task.dueDate)}</span>` : ''}
            ${tagsHtml(task.tags)}
          </div>
          <div class="card-actions">
            <button data-action="edit-task" data-id="${task.id}">Editar</button>
            <button class="danger" data-action="delete-task" data-id="${task.id}">Excluir</button>
          </div>
        </div>
      </div>
    </article>`;
  }

  function linkCard(data, link) {
    const favicon = Utils.faviconFor(link.url);
    return `
    <article class="item-card link-card">
      <div class="item-card-top">
        <h3 class="item-title">${favicon ? `<img src="${favicon}" alt="" width="16" height="16" style="border-radius:4px;vertical-align:-2px;margin-right:6px;" onerror="this.remove()">` : '🌐 '}${Utils.escapeHtml(link.title)}</h3>
        ${starButton('link', link.id, link.highlighted)}
      </div>
      ${link.description ? `<p class="item-desc">${Utils.escapeHtml(link.description)}</p>` : ''}
      <p class="link-url">${Utils.escapeHtml(link.url)}</p>
      <div class="item-meta">
        ${subjectChip(data, link.subjectId)}
        ${link.category ? `<span class="chip">${Utils.escapeHtml(link.category)}</span>` : ''}
        ${tagsHtml(link.tags)}
      </div>
      <div class="card-actions">
        <a href="${Utils.escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer nofollow" class="btn btn-sm btn-ghost" style="text-decoration:none;">Abrir ↗</a>
        <button data-action="edit-link" data-id="${link.id}">Editar</button>
        <button class="danger" data-action="delete-link" data-id="${link.id}">Excluir</button>
      </div>
    </article>`;
  }

  function videoCard(data, video) {
    const thumb = video.videoId
      ? `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`
      : '';
    return `
    <article class="item-card video-card">
      <div class="video-thumb-wrap">
        ${thumb ? `<img src="${thumb}" alt="Miniatura do vídeo: ${Utils.escapeHtml(video.title)}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'video-thumb-fallback',innerHTML:'🎬',style:'display:flex;align-items:center;justify-content:center;height:100%;font-size:2rem;'}))">` : `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:2rem;">🎬</div>`}
        <span class="video-status-badge">${VIDEO_STATUS_ICON[video.status]} ${VIDEO_STATUS_LABEL[video.status]}</span>
      </div>
      <div class="video-body">
        <div class="item-card-top">
          <h3 class="item-title">${Utils.escapeHtml(video.title)}</h3>
          ${starButton('video', video.id, video.highlighted)}
        </div>
        <div class="item-meta">
          <span class="chip">${video.platform}</span>
          ${subjectChip(data, video.subjectId)}
          ${video.category ? `<span class="chip">${Utils.escapeHtml(video.category)}</span>` : ''}
        </div>
        <div class="card-actions">
          <a href="${Utils.escapeHtml(video.url)}" target="_blank" rel="noopener noreferrer nofollow" class="btn btn-sm btn-ghost" style="text-decoration:none;">Assistir ↗</a>
          <select data-action="video-status" data-id="${video.id}" class="btn-sm" style="border-radius:8px;padding:4px 8px;">
            <option value="nao" ${video.status === 'nao' ? 'selected' : ''}>Não assistido</option>
            <option value="assistindo" ${video.status === 'assistindo' ? 'selected' : ''}>Assistindo</option>
            <option value="concluido" ${video.status === 'concluido' ? 'selected' : ''}>Concluído</option>
          </select>
          <button data-action="edit-video" data-id="${video.id}">Editar</button>
          <button class="danger" data-action="delete-video" data-id="${video.id}">Excluir</button>
        </div>
      </div>
    </article>`;
  }

  // ---------------------------------------------------------------------
  // Dashboard
  // ---------------------------------------------------------------------
  function greetingText() {
    const h = new Date().getHours();
    if (h < 6) return 'Boa madrugada';
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  function dashboard(data) {
    const pendingTasks = data.tasks.filter(t => t.status !== 'concluida');
    const doneTasks = data.tasks.filter(t => t.status === 'concluida');
    const pendingVideos = data.videos.filter(v => v.status !== 'concluido');
    const highlightsCount = [...data.notes, ...data.tasks, ...data.links, ...data.videos].filter(i => i.highlighted).length;

    const upcoming = pendingTasks
      .slice()
      .sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'))
      .slice(0, 5);

    const recentVideos = data.videos
      .filter(v => v.status !== 'concluido')
      .slice()
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      .slice(0, 4);

    const highlighted = [...data.notes.map(n => ({ ...n, _type: 'note' })),
      ...data.tasks.map(t => ({ ...t, _type: 'task' })),
      ...data.links.map(l => ({ ...l, _type: 'link' })),
      ...data.videos.map(v => ({ ...v, _type: 'video' }))]
      .filter(i => i.highlighted)
      .slice(0, 4);

    return `
    <div class="greeting">${greetingText()} 👋</div>
    <p class="greeting-sub">Aqui está um resumo do seu progresso hoje.</p>

    <div class="stat-grid">
      <div class="stat-card" data-action="navigate" data-route="tasks">
        <span class="stat-icon">✅</span>
        <span class="stat-value">${pendingTasks.length}</span>
        <span class="stat-label">Tarefas pendentes</span>
      </div>
      <div class="stat-card" data-action="navigate" data-route="tasks">
        <span class="stat-icon">🏁</span>
        <span class="stat-value">${doneTasks.length}</span>
        <span class="stat-label">Tarefas concluídas</span>
      </div>
      <div class="stat-card" data-action="navigate" data-route="notes">
        <span class="stat-icon">📝</span>
        <span class="stat-value">${data.notes.length}</span>
        <span class="stat-label">Anotações</span>
      </div>
      <div class="stat-card" data-action="navigate" data-route="links">
        <span class="stat-icon">🔗</span>
        <span class="stat-value">${data.links.length}</span>
        <span class="stat-label">Links salvos</span>
      </div>
      <div class="stat-card" data-action="navigate" data-route="videos">
        <span class="stat-icon">🎥</span>
        <span class="stat-value">${pendingVideos.length}</span>
        <span class="stat-label">Vídeos pendentes</span>
      </div>
      <div class="stat-card" data-action="navigate" data-route="highlights">
        <span class="stat-icon">⭐</span>
        <span class="stat-value">${highlightsCount}</span>
        <span class="stat-label">Itens destacados</span>
      </div>
    </div>

    <div class="dash-grid">
      <div class="section">
        <div class="section-head">
          <h2 class="section-title">Próximas tarefas</h2>
          <button class="section-link" data-action="navigate" data-route="tasks">Ver todas</button>
        </div>
        ${upcoming.length ? `<div style="display:flex;flex-direction:column;gap:10px;">${upcoming.map(t => taskCard(data, t)).join('')}</div>`
          : emptyState('✅', 'Nenhuma tarefa pendente', 'Crie uma tarefa para começar a organizar seus estudos.', '+ Nova tarefa', 'data-action="quick-new" data-type="task"')}
      </div>

      <div class="section">
        <div class="section-head">
          <h2 class="section-title">Assistir depois</h2>
          <button class="section-link" data-action="navigate" data-route="videos">Ver todos</button>
        </div>
        ${recentVideos.length ? `<div class="card-grid">${recentVideos.map(v => videoCard(data, v)).join('')}</div>`
          : emptyState('🎥', 'Nenhum vídeo pendente', 'Salve vídeos para assistir mais tarde.', '+ Novo vídeo', 'data-action="quick-new" data-type="video"')}
      </div>
    </div>

    <div class="section">
      <div class="section-head">
        <h2 class="section-title">Itens destacados</h2>
        <button class="section-link" data-action="navigate" data-route="highlights">Ver todos</button>
      </div>
      ${highlighted.length ? `<div class="card-grid">${highlighted.map(i => cardForType(data, i._type, i)).join('')}</div>`
        : emptyState('⭐', 'Nada destacado ainda', 'Marque notas, tarefas, links ou vídeos como importantes para vê-los aqui.')}
    </div>
    `;
  }

  function cardForType(data, type, item) {
    if (type === 'note') return noteCard(data, item);
    if (type === 'task') return taskCard(data, item);
    if (type === 'link') return linkCard(data, item);
    if (type === 'video') return videoCard(data, item);
    return '';
  }

  // ---------------------------------------------------------------------
  // Subjects
  // ---------------------------------------------------------------------
  function subjectsView(data) {
    const cards = data.subjects.map(s => {
      const count = data.notes.filter(n => n.subjectId === s.id).length
        + data.tasks.filter(t => t.subjectId === s.id).length
        + data.links.filter(l => l.subjectId === s.id).length
        + data.videos.filter(v => v.subjectId === s.id).length;
      return `
      <div class="subject-card" data-action="open-subject" data-id="${s.id}">
        <span class="subject-icon">${s.icon}</span>
        <span class="subject-name">${Utils.escapeHtml(s.name)}</span>
        <span class="subject-count">${count} ${count === 1 ? 'item' : 'itens'}</span>
      </div>`;
    }).join('');

    return `
    <div class="view-header">
      <div>
        <h1 class="view-title">📚 Estudos</h1>
        <p class="view-subtitle">Organize suas matérias e acesse o conteúdo de cada uma.</p>
      </div>
    </div>
    <div class="subject-grid">
      ${cards}
      <button class="subject-card subject-card-add" data-action="new-subject">
        <span class="subject-icon">＋</span>
        <span class="subject-name">Nova matéria</span>
      </button>
    </div>`;
  }

  function subjectDetail(data, subjectId) {
    const s = subjectById(data, subjectId);
    if (!s) return emptyState('📚', 'Matéria não encontrada', 'Ela pode ter sido excluída.');
    const notes = data.notes.filter(n => n.subjectId === s.id);
    const tasks = data.tasks.filter(t => t.subjectId === s.id);
    const links = data.links.filter(l => l.subjectId === s.id);
    const videos = data.videos.filter(v => v.subjectId === s.id);

    return `
    <div class="view-header">
      <div>
        <button class="btn btn-ghost btn-sm" data-action="navigate" data-route="subjects" style="margin-bottom:10px;">← Voltar</button>
        <h1 class="view-title">${s.icon} ${Utils.escapeHtml(s.name)}</h1>
        <p class="view-subtitle">${notes.length + tasks.length + links.length + videos.length} itens nesta matéria</p>
      </div>
      <div class="view-actions">
        <button class="btn" data-action="edit-subject" data-id="${s.id}">Renomear</button>
        <button class="btn btn-danger" data-action="delete-subject" data-id="${s.id}">Excluir matéria</button>
      </div>
    </div>

    <div class="section">
      <div class="section-head"><h2 class="section-title">✅ Tarefas</h2><button class="section-link" data-action="quick-new" data-type="task" data-subject="${s.id}">+ Adicionar</button></div>
      ${tasks.length ? `<div class="card-grid">${tasks.map(t => taskCard(data, t)).join('')}</div>` : emptyState('✅', 'Sem tarefas', 'Nenhuma tarefa cadastrada nesta matéria.')}
    </div>
    <div class="section">
      <div class="section-head"><h2 class="section-title">📝 Notas</h2><button class="section-link" data-action="quick-new" data-type="note" data-subject="${s.id}">+ Adicionar</button></div>
      ${notes.length ? `<div class="card-grid">${notes.map(n => noteCard(data, n)).join('')}</div>` : emptyState('📝', 'Sem notas', 'Nenhuma anotação cadastrada nesta matéria.')}
    </div>
    <div class="section">
      <div class="section-head"><h2 class="section-title">🔗 Links</h2><button class="section-link" data-action="quick-new" data-type="link" data-subject="${s.id}">+ Adicionar</button></div>
      ${links.length ? `<div class="card-grid">${links.map(l => linkCard(data, l)).join('')}</div>` : emptyState('🔗', 'Sem links', 'Nenhum link cadastrado nesta matéria.')}
    </div>
    <div class="section">
      <div class="section-head"><h2 class="section-title">🎥 Vídeos</h2><button class="section-link" data-action="quick-new" data-type="video" data-subject="${s.id}">+ Adicionar</button></div>
      ${videos.length ? `<div class="card-grid">${videos.map(v => videoCard(data, v)).join('')}</div>` : emptyState('🎥', 'Sem vídeos', 'Nenhum vídeo cadastrado nesta matéria.')}
    </div>
    `;
  }

  // ---------------------------------------------------------------------
  // Notes / Tasks / Links / Videos list views (com filtros)
  // ---------------------------------------------------------------------
  function subjectFilterBar(data, activeId, type) {
    const all = `<button class="filter-pill ${!activeId ? 'active' : ''}" data-action="filter-subject" data-type="${type}" data-id="">Todas</button>`;
    const rest = data.subjects.map(s => `<button class="filter-pill ${activeId === s.id ? 'active' : ''}" data-action="filter-subject" data-type="${type}" data-id="${s.id}">${s.icon} ${Utils.escapeHtml(s.name)}</button>`).join('');
    return `<div class="filter-bar">${all}${rest}</div>`;
  }

  function notesView(data, filter) {
    let list = data.notes.slice();
    if (filter.subjectId) list = list.filter(n => n.subjectId === filter.subjectId);
    list.sort((a, b) => (b.pinned - a.pinned) || (b.updatedAt || '').localeCompare(a.updatedAt || ''));

    return `
    <div class="view-header">
      <div><h1 class="view-title">📝 Notas</h1><p class="view-subtitle">${list.length} anotações</p></div>
      <div class="view-actions"><button class="btn btn-primary" data-action="quick-new" data-type="note">＋ Nova anotação</button></div>
    </div>
    ${subjectFilterBar(data, filter.subjectId, 'notes')}
    ${list.length ? `<div class="card-grid">${list.map(n => noteCard(data, n)).join('')}</div>`
      : emptyState('📝', 'Nenhuma anotação', 'Crie sua primeira anotação para começar a registrar seus estudos.', '+ Nova anotação', 'data-action="quick-new" data-type="note"')}
    `;
  }

  function tasksView(data, filter) {
    let list = data.tasks.slice();
    if (filter.subjectId) list = list.filter(t => t.subjectId === filter.subjectId);
    if (filter.status) list = list.filter(t => t.status === filter.status);
    if (filter.priority) list = list.filter(t => t.priority === filter.priority);
    list.sort((a, b) => (a.status === 'concluida') - (b.status === 'concluida') || (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));

    const statusPills = `<div class="filter-bar">
      <button class="filter-pill ${!filter.status ? 'active' : ''}" data-action="filter-status" data-id="">Todas</button>
      <button class="filter-pill ${filter.status === 'pendente' ? 'active' : ''}" data-action="filter-status" data-id="pendente">Pendentes</button>
      <button class="filter-pill ${filter.status === 'concluida' ? 'active' : ''}" data-action="filter-status" data-id="concluida">Concluídas</button>
      <span style="width:1px;background:var(--border);margin:0 4px;"></span>
      <button class="filter-pill ${filter.priority === 'alta' ? 'active' : ''}" data-action="filter-priority" data-id="alta">🔴 Alta</button>
      <button class="filter-pill ${filter.priority === 'media' ? 'active' : ''}" data-action="filter-priority" data-id="media">🟡 Média</button>
      <button class="filter-pill ${filter.priority === 'baixa' ? 'active' : ''}" data-action="filter-priority" data-id="baixa">🟢 Baixa</button>
    </div>`;

    return `
    <div class="view-header">
      <div><h1 class="view-title">✅ Tarefas</h1><p class="view-subtitle">${list.length} tarefas</p></div>
      <div class="view-actions"><button class="btn btn-primary" data-action="quick-new" data-type="task">＋ Nova tarefa</button></div>
    </div>
    ${subjectFilterBar(data, filter.subjectId, 'tasks')}
    ${statusPills}
    ${list.length ? `<div style="display:flex;flex-direction:column;gap:10px;">${list.map(t => taskCard(data, t)).join('')}</div>`
      : emptyState('✅', 'Nenhuma tarefa encontrada', 'Ajuste os filtros ou crie uma nova tarefa.', '+ Nova tarefa', 'data-action="quick-new" data-type="task"')}
    `;
  }

  function linksView(data, filter) {
    let list = data.links.slice();
    if (filter.subjectId) list = list.filter(l => l.subjectId === filter.subjectId);
    list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    return `
    <div class="view-header">
      <div><h1 class="view-title">🔗 Links</h1><p class="view-subtitle">${list.length} links salvos</p></div>
      <div class="view-actions"><button class="btn btn-primary" data-action="quick-new" data-type="link">＋ Novo link</button></div>
    </div>
    ${subjectFilterBar(data, filter.subjectId, 'links')}
    ${list.length ? `<div class="card-grid">${list.map(l => linkCard(data, l)).join('')}</div>`
      : emptyState('🔗', 'Nenhum link salvo', 'Guarde documentações, artigos e referências úteis.', '+ Novo link', 'data-action="quick-new" data-type="link"')}
    `;
  }

  function videosView(data, filter) {
    let list = data.videos.slice();
    if (filter.subjectId) list = list.filter(v => v.subjectId === filter.subjectId);
    if (filter.status) list = list.filter(v => v.status === filter.status);
    list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    const statusPills = `<div class="filter-bar">
      <button class="filter-pill ${!filter.status ? 'active' : ''}" data-action="filter-video-status" data-id="">Todos</button>
      <button class="filter-pill ${filter.status === 'nao' ? 'active' : ''}" data-action="filter-video-status" data-id="nao">☐ Não assistidos</button>
      <button class="filter-pill ${filter.status === 'assistindo' ? 'active' : ''}" data-action="filter-video-status" data-id="assistindo">◐ Assistindo</button>
      <button class="filter-pill ${filter.status === 'concluido' ? 'active' : ''}" data-action="filter-video-status" data-id="concluido">✓ Concluídos</button>
    </div>`;

    return `
    <div class="view-header">
      <div><h1 class="view-title">🎥 Vídeos</h1><p class="view-subtitle">${list.length} vídeos salvos</p></div>
      <div class="view-actions"><button class="btn btn-primary" data-action="quick-new" data-type="video">＋ Novo vídeo</button></div>
    </div>
    ${subjectFilterBar(data, filter.subjectId, 'videos')}
    ${statusPills}
    ${list.length ? `<div class="card-grid">${list.map(v => videoCard(data, v)).join('')}</div>`
      : emptyState('🎥', 'Nenhum vídeo salvo', 'Salve vídeos do YouTube para assistir mais tarde.', '+ Novo vídeo', 'data-action="quick-new" data-type="video"')}
    `;
  }

  function highlightsView(data) {
    const items = [...data.notes.map(n => ({ ...n, _type: 'note' })),
      ...data.tasks.map(t => ({ ...t, _type: 'task' })),
      ...data.links.map(l => ({ ...l, _type: 'link' })),
      ...data.videos.map(v => ({ ...v, _type: 'video' }))]
      .filter(i => i.highlighted);

    return `
    <div class="view-header">
      <div><h1 class="view-title">⭐ Destaques</h1><p class="view-subtitle">Tudo que você marcou como importante, em um só lugar.</p></div>
    </div>
    ${items.length ? `<div class="card-grid">${items.map(i => cardForType(data, i._type, i)).join('')}</div>`
      : emptyState('⭐', 'Nada destacado ainda', 'Toque na estrela de qualquer nota, tarefa, link ou vídeo para vê-lo aqui.')}
    `;
  }

  function agendaView(data) {
    const pending = data.tasks.filter(t => t.status !== 'concluida' && t.dueDate);
    const overdue = pending.filter(t => Utils.daysUntil(t.dueDate) < 0);
    const byDay = {};
    pending.filter(t => Utils.daysUntil(t.dueDate) >= 0).forEach(t => {
      byDay[t.dueDate] = byDay[t.dueDate] || [];
      byDay[t.dueDate].push(t);
    });
    const days = Object.keys(byDay).sort().slice(0, 14);

    function taskRow(t) {
      const s = subjectById(data, t.subjectId);
      return `<div class="agenda-task">
        <button class="task-check ${t.status === 'concluida' ? 'checked' : ''}" data-action="toggle-task" data-id="${t.id}"></button>
        <span class="priority-dot" style="background:var(--priority-${t.priority})"></span>
        <span style="flex:1;">${Utils.escapeHtml(t.title)} ${s ? `<span class="chip chip-subject" style="margin-left:6px;">${s.icon} ${Utils.escapeHtml(s.name)}</span>` : ''}</span>
      </div>`;
    }

    return `
    <div class="view-header">
      <div><h1 class="view-title">📅 Agenda</h1><p class="view-subtitle">Suas tarefas organizadas por data.</p></div>
      <div class="view-actions"><button class="btn btn-primary" data-action="quick-new" data-type="task">＋ Nova tarefa</button></div>
    </div>

    ${overdue.length ? `
    <div class="agenda-day" style="border-color:var(--danger);">
      <div class="agenda-day-head"><span class="agenda-day-title" style="color:var(--danger);">⚠ Atrasadas</span><span class="agenda-day-date">${overdue.length} tarefa(s)</span></div>
      ${overdue.map(taskRow).join('')}
    </div>` : ''}

    ${days.length ? days.map(day => {
      const d = new Date(day + 'T00:00:00');
      const n = Utils.daysUntil(day);
      const label = n === 0 ? 'Hoje' : n === 1 ? 'Amanhã' : d.toLocaleDateString('pt-BR', { weekday: 'long' });
      return `<div class="agenda-day">
        <div class="agenda-day-head"><span class="agenda-day-title">${label}</span><span class="agenda-day-date">${Utils.formatDate(day, { day: '2-digit', month: 'long' })}</span></div>
        ${byDay[day].map(taskRow).join('')}
      </div>`;
    }).join('') : (overdue.length ? '' : emptyState('📅', 'Nenhum compromisso agendado', 'Adicione um prazo às suas tarefas para vê-las aqui.'))}
    `;
  }

  function settingsView(data) {
    const sizeKb = (Storage.estimateSizeBytes() / 1024).toFixed(1);
    const totalItems = data.subjects.length + data.notes.length + data.tasks.length + data.links.length + data.videos.length;
    const theme = Storage.getTheme();
    return `
    <div class="view-header">
      <div><h1 class="view-title">⚙️ Configurações</h1><p class="view-subtitle">Personalize o StudyHub e gerencie seus dados.</p></div>
    </div>
    <div class="settings-grid">
      <div class="settings-card">
        <h3>Aparência</h3>
        <p>Escolha entre o tema claro ou escuro. A preferência é salva automaticamente.</p>
        <div class="theme-switch-row">
          <button class="theme-option ${theme === 'light' ? 'active' : ''}" data-action="set-theme" data-id="light">☀️ Claro</button>
          <button class="theme-option ${theme === 'dark' ? 'active' : ''}" data-action="set-theme" data-id="dark">🌙 Escuro</button>
        </div>
      </div>

      <div class="settings-card">
        <h3>Armazenamento</h3>
        <p>Seus dados ficam salvos apenas neste navegador (LocalStorage).</p>
        <div class="settings-stat-row"><span>Itens salvos</span><strong>${totalItems}</strong></div>
        <div class="settings-stat-row"><span>Espaço utilizado</span><strong>${sizeKb} KB</strong></div>
        <div class="storage-bar"><div class="storage-bar-fill" style="width:${Math.min(100, (sizeKb / 5000) * 100)}%"></div></div>
      </div>

      <div class="settings-card">
        <h3>Exportar dados</h3>
        <p>Baixe um arquivo .json com todo o conteúdo do seu StudyHub como backup.</p>
        <button class="btn btn-primary" data-action="export-data">⬇ Exportar dados (.json)</button>
      </div>

      <div class="settings-card">
        <h3>Importar dados</h3>
        <p>Substitua os dados atuais por um backup exportado anteriormente.</p>
        <button class="btn" data-action="trigger-import">⬆ Importar arquivo</button>
        <input type="file" id="importFileInput" accept="application/json">
      </div>

      <div class="settings-card">
        <h3>Apagar todos os dados</h3>
        <p>Remove permanentemente todas as matérias, notas, tarefas, links e vídeos.</p>
        <button class="btn btn-danger" data-action="clear-data">🗑 Apagar tudo</button>
      </div>

      <div class="settings-card">
        <h3>Sobre o StudyHub</h3>
        <p>Uma central pessoal de estudos e produtividade — matérias, notas, tarefas, links e vídeos em um só lugar. Feito para funcionar direto no navegador, sem servidor.</p>
      </div>
    </div>
    `;
  }

  // ---------------------------------------------------------------------
  // Busca global
  // ---------------------------------------------------------------------
  function searchResultsView(data, query) {
    const q = query.trim().toLowerCase();
    if (!q) return emptyState('🔎', 'Digite algo para pesquisar', 'Busque em notas, tarefas, links, vídeos e matérias.');

    const matchNote = n => n.title.toLowerCase().includes(q) || Utils.stripHtml(n.content).toLowerCase().includes(q) || (n.tags || []).some(t => t.toLowerCase().includes(q));
    const matchTask = t => t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q) || (t.tags || []).some(x => x.toLowerCase().includes(q));
    const matchLink = l => l.title.toLowerCase().includes(q) || (l.description || '').toLowerCase().includes(q) || l.url.toLowerCase().includes(q);
    const matchVideo = v => v.title.toLowerCase().includes(q);
    const matchSubject = s => s.name.toLowerCase().includes(q);

    const notes = data.notes.filter(matchNote);
    const tasks = data.tasks.filter(matchTask);
    const links = data.links.filter(matchLink);
    const videos = data.videos.filter(matchVideo);
    const subjects = data.subjects.filter(matchSubject);

    const total = notes.length + tasks.length + links.length + videos.length + subjects.length;

    if (!total) {
      return emptyState('🔎', `Nenhum resultado para "${Utils.escapeHtml(query)}"`, 'Tente outro termo de pesquisa.');
    }

    let html = `<div class="view-header"><div><h1 class="view-title">Resultados para "${Utils.escapeHtml(query)}"</h1><p class="view-subtitle">${total} resultado(s) encontrado(s)</p></div></div>`;

    if (subjects.length) html += `<div class="search-results-group"><h4>MATÉRIAS</h4><div class="subject-grid">${subjects.map(s => `<div class="subject-card" data-action="open-subject" data-id="${s.id}"><span class="subject-icon">${s.icon}</span><span class="subject-name">${Utils.escapeHtml(s.name)}</span></div>`).join('')}</div></div>`;
    if (tasks.length) html += `<div class="search-results-group"><h4>TAREFAS</h4><div style="display:flex;flex-direction:column;gap:10px;">${tasks.map(t => taskCard(data, t)).join('')}</div></div>`;
    if (notes.length) html += `<div class="search-results-group"><h4>NOTAS</h4><div class="card-grid">${notes.map(n => noteCard(data, n)).join('')}</div></div>`;
    if (links.length) html += `<div class="search-results-group"><h4>LINKS</h4><div class="card-grid">${links.map(l => linkCard(data, l)).join('')}</div></div>`;
    if (videos.length) html += `<div class="search-results-group"><h4>VÍDEOS</h4><div class="card-grid">${videos.map(v => videoCard(data, v)).join('')}</div></div>`;

    return html;
  }

  return {
    subjectOptions, subjectById,
    dashboard, subjectsView, subjectDetail,
    notesView, tasksView, linksView, videosView,
    highlightsView, agendaView, settingsView, searchResultsView,
    PRIORITY_LABEL,
  };
})();
