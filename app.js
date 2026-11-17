const STORAGE_KEY = 'sigper_rem_cen_2026_answers_v1';
const THEME_KEY = 'sigper_rem_cen_2026_theme';

const state = {
  questions: [],
  filteredQuestions: [],
  currentIndex: 0,
  answers: loadAnswers(),
  workbooks: [],
  activeWorkbookIdx: 0,
  activeSheetIdx: 0,
  excelQuery: '',
  exercises: [],
  activeForma: 'A',
};

function loadAnswers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAnswers() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.answers));
  } catch {
    // ignore storage quota errors
  }
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
}

// Theme setup
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const initial = saved || 'light';
  document.documentElement.setAttribute('data-theme', initial);
  const btn = document.getElementById('themeToggle');
  btn.textContent = initial === 'dark' ? 'Modo Claro' : 'Modo Oscuro';
  btn.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
    btn.textContent = next === 'dark' ? 'Modo Claro' : 'Modo Oscuro';
  });
}

// Navigation tabs
function initTabs() {
  const buttons = document.querySelectorAll('.nav-btn');
  const panels = {
    quiz: document.getElementById('tab-quiz'),
    exercises: document.getElementById('tab-exercises'),
    excel: document.getElementById('tab-excel'),
  };
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      buttons.forEach((b) => {
        const active = b.dataset.tab === target;
        b.classList.toggle('active', active);
        b.setAttribute('aria-pressed', String(active));
      });
      Object.entries(panels).forEach(([key, panel]) => {
        const show = key === target;
        panel.hidden = !show;
        panel.classList.toggle('active', show);
      });
    });
  });
}

// Quiz logic
function applyQuizFilters() {
  const session = document.getElementById('filterSession').value;
  const difficulty = document.getElementById('filterDifficulty').value;
  const mode = document.getElementById('quizMode').value;

  let list = state.questions.filter((q) => {
    if (session !== 'ALL' && q.sesion !== session) return false;
    if (difficulty !== 'ALL' && q.dificultad !== difficulty) return false;
    if (mode === 'wrong') {
      const ans = state.answers[q.id];
      if (ans === undefined || ans === q.respuestaCorrecta) return false;
    }
    return true;
  });

  if (mode === 'random20') {
    list = [...list].sort(() => Math.random() - 0.5).slice(0, 20);
  }

  state.filteredQuestions = list;
  state.currentIndex = 0;
  renderQuiz();
}

function updateStats() {
  const total = state.questions.length;
  let answered = 0;
  let correct = 0;
  let wrong = 0;

  for (const q of state.questions) {
    const ans = state.answers[q.id];
    if (ans !== undefined) {
      answered++;
      if (ans === q.respuestaCorrecta) correct++;
      else wrong++;
    }
  }

  const pct = answered > 0 ? Math.round((correct / answered) * 100) : 0;
  const progPct = total > 0 ? Math.round((answered / total) * 100) : 0;

  document.getElementById('statAnswered').textContent = `${answered} / ${total}`;
  document.getElementById('statCorrect').textContent = String(correct);
  document.getElementById('statWrong').textContent = String(wrong);
  document.getElementById('statPct').textContent = `${pct}%`;

  const fill = document.getElementById('quizProgressFill');
  const track = document.getElementById('quizProgressTrack');
  fill.style.width = `${progPct}%`;
  track.setAttribute('aria-valuenow', String(progPct));

  renderSessionSummary();
}

function renderSessionSummary() {
  const grid = document.getElementById('sessionSummaryGrid');
  grid.innerHTML = '';
  const groups = ['Sesión 1', 'Sesión 2', 'Sesión 3', 'Sesión 4', 'Prueba REM'];
  for (const sName of groups) {
    const qs = state.questions.filter((q) => q.sesion === sName);
    if (qs.length === 0) continue;
    const ansCount = qs.filter((q) => state.answers[q.id] !== undefined).length;
    const okCount = qs.filter((q) => state.answers[q.id] === q.respuestaCorrecta).length;

    const box = el('div', 'summary-box');
    box.appendChild(el('h3', '', sName));
    box.appendChild(el('div', 'stat-label', `Respondidas: ${ansCount} / ${qs.length}`));
    box.appendChild(el('strong', okCount === qs.length && qs.length > 0 ? 'text-ok' : '', `Correctas: ${okCount}`));
    grid.appendChild(box);
  }
}

function renderQuiz() {
  const container = document.getElementById('quizBody');
  container.innerHTML = '';

  if (state.filteredQuestions.length === 0) {
    container.appendChild(el('div', 'card empty-state', 'No hay preguntas que coincidan con el filtro seleccionado.'));
    updateStats();
    return;
  }

  const q = state.filteredQuestions[state.currentIndex];
  const userAns = state.answers[q.id];
  const isAnswered = userAns !== undefined;

  const card = el('div', 'card');

  // Header
  const header = el('div', 'question-header');
  const badges = el('div', 'badges');
  badges.appendChild(el('span', 'badge', q.sesion));
  badges.appendChild(el('span', 'badge badge-neutral', q.tema));
  badges.appendChild(el('span', 'badge badge-warn', q.dificultad));
  badges.appendChild(el('span', 'badge badge-neutral', q.diapositiva));
  header.appendChild(badges);
  header.appendChild(el('span', 'stat-label', `Pregunta ${state.currentIndex + 1} de ${state.filteredQuestions.length} (ID #${q.id})`));
  card.appendChild(header);

  // Enunciado
  card.appendChild(el('h2', 'question-text', q.enunciado));

  // Options
  const optList = el('div', 'options-list');
  const letters = ['A', 'B', 'C', 'D'];
  q.opciones.forEach((optText, idx) => {
    const btn = el('button', 'option-btn');
    btn.type = 'button';
    if (isAnswered) {
      btn.disabled = true;
      if (idx === q.respuestaCorrecta) btn.classList.add('is-correct');
      else if (idx === userAns) btn.classList.add('is-wrong');
    }
    btn.appendChild(el('span', 'option-letter', letters[idx]));
    btn.appendChild(el('span', '', optText));
    btn.addEventListener('click', () => {
      state.answers[q.id] = idx;
      saveAnswers();
      renderQuiz();
    });
    optList.appendChild(btn);
  });
  card.appendChild(optList);

  // Explanation
  if (isAnswered) {
    const isRight = userAns === q.respuestaCorrecta;
    const exp = el('div', `explanation-box ${isRight ? 'ok' : 'err'}`);
    exp.appendChild(el('strong', '', isRight ? '¡Correcto! ' : `Incorrecto (Respuesta correcta: ${letters[q.respuestaCorrecta]}). `));
    exp.appendChild(document.createTextNode(q.explicacion));
    card.appendChild(exp);
  }

  // Prev / Next controls
  const nav = el('div', 'question-nav');
  const btnPrev = el('button', 'btn btn-ghost', '← Anterior');
  btnPrev.type = 'button';
  btnPrev.disabled = state.currentIndex === 0;
  btnPrev.addEventListener('click', () => {
    if (state.currentIndex > 0) {
      state.currentIndex--;
      renderQuiz();
    }
  });

  const btnNext = el('button', 'btn btn-primary', 'Siguiente →');
  btnNext.type = 'button';
  btnNext.disabled = state.currentIndex >= state.filteredQuestions.length - 1;
  btnNext.addEventListener('click', () => {
    if (state.currentIndex < state.filteredQuestions.length - 1) {
      state.currentIndex++;
      renderQuiz();
    }
  });

  nav.appendChild(btnPrev);
  nav.appendChild(btnNext);
  card.appendChild(nav);

  // Quick jump dots (collapsible on mobile)
  const jumpDetails = document.createElement('details');
  jumpDetails.className = 'jump-details';
  if (window.innerWidth >= 640) {
    jumpDetails.open = true;
  }
  const jumpSummary = el('summary', 'jump-summary', `Mapa de preguntas (${state.filteredQuestions.length})`);
  jumpDetails.appendChild(jumpSummary);

  const jump = el('div', 'jump-row');
  state.filteredQuestions.forEach((item, idx) => {
    const dot = el('button', 'dot-btn', String(idx + 1));
    dot.type = 'button';
    if (idx === state.currentIndex) dot.classList.add('current');
    const ans = state.answers[item.id];
    if (ans !== undefined) {
      dot.classList.add(ans === item.respuestaCorrecta ? 'ok' : 'err');
    }
    dot.addEventListener('click', () => {
      state.currentIndex = idx;
      renderQuiz();
    });
    jump.appendChild(dot);
  });
  jumpDetails.appendChild(jump);
  card.appendChild(jumpDetails);

  container.appendChild(card);
  updateStats();
}

// Excel Explorer Logic
function initExcelControls() {
  const select = document.getElementById('excelWorkbookSelect');
  select.innerHTML = '';
  state.workbooks.forEach((wb, idx) => {
    const opt = el('option', '', `${wb.sesion} — ${wb.archivo}`);
    opt.value = String(idx);
    select.appendChild(opt);
  });

  select.addEventListener('change', () => {
    state.activeWorkbookIdx = Number(select.value);
    state.activeSheetIdx = 0;
    renderExcel();
  });

  const search = document.getElementById('excelSearch');
  search.addEventListener('input', () => {
    state.excelQuery = search.value.trim().toLowerCase();
    renderExcel();
  });
}

function renderExcel() {
  const container = document.getElementById('excelContent');
  container.innerHTML = '';

  if (state.excelQuery) {
    renderExcelSearchResults(container);
    return;
  }

  const wb = state.workbooks[state.activeWorkbookIdx];
  if (!wb) return;

  const infoCard = el('div', 'card');
  const hdr = el('div', 'calc-top');
  const titleWrap = el('div');
  titleWrap.appendChild(el('h2', 'calc-title', wb.titulo));
  titleWrap.appendChild(el('p', 'subtitle', `Archivo fuente: ${wb.archivo} · ${wb.objetivo}`));
  hdr.appendChild(titleWrap);
  hdr.appendChild(el('span', 'badge', wb.sesion));
  infoCard.appendChild(hdr);

  // Sheet tabs
  const tabs = el('div', 'sheet-tabs');
  wb.hojas.forEach((sh, idx) => {
    const tBtn = el('button', `sheet-tab ${idx === state.activeSheetIdx ? 'active' : ''}`, `Hoja: ${sh.nombre}`);
    tBtn.type = 'button';
    tBtn.addEventListener('click', () => {
      state.activeSheetIdx = idx;
      renderExcel();
    });
    tabs.appendChild(tBtn);
  });
  infoCard.appendChild(tabs);

  const activeSheet = wb.hojas[state.activeSheetIdx];
  if (activeSheet) {
    infoCard.appendChild(el('p', '', activeSheet.descripcion));
  }
  container.appendChild(infoCard);

  if (activeSheet) {
    const grid = el('div', 'calc-grid');
    activeSheet.calculos.forEach((calc) => grid.appendChild(buildCalcCard(calc)));
    container.appendChild(grid);
  }
}

function renderExcelSearchResults(container) {
  const q = state.excelQuery;
  const matches = [];
  state.workbooks.forEach((wb) => {
    wb.hojas.forEach((sh) => {
      sh.calculos.forEach((calc) => {
        const hay = `${wb.archivo} ${sh.nombre} ${calc.celda} ${calc.concepto} ${calc.formulaExcel} ${calc.reglaNegocio} ${calc.explicacionPasoAPaso.join(' ')}`.toLowerCase();
        if (hay.includes(q)) {
          matches.push({ wb, sh, calc });
        }
      });
    });
  });

  const summary = el('div', 'card', `Resultados de búsqueda para "${state.excelQuery}": ${matches.length} cálculo(s) encontrado(s).`);
  container.appendChild(summary);

  const grid = el('div', 'calc-grid');
  matches.forEach(({ wb, sh, calc }) => {
    grid.appendChild(buildCalcCard(calc, `${wb.archivo} · ${sh.nombre}`));
  });
  container.appendChild(grid);
}

function buildCalcCard(calc, contextLabel) {
  const card = el('article', 'calc-card');

  const top = el('div', 'calc-top');
  const left = el('div');
  const badges = el('div', 'badges');
  badges.appendChild(el('span', 'badge', calc.categoria));
  badges.appendChild(el('span', 'badge badge-neutral', `Celdas: ${calc.celda}`));
  if (contextLabel) badges.appendChild(el('span', 'badge badge-warn', contextLabel));
  left.appendChild(badges);
  left.appendChild(el('h3', 'calc-title', calc.concepto));
  top.appendChild(left);
  top.appendChild(el('span', 'result-pill', `Resultado: ${calc.resultado}`));
  card.appendChild(top);

  card.appendChild(el('div', 'formula-box', calc.formulaExcel));

  if (calc.entradas && calc.entradas.length > 0) {
    const tbl = el('table', 'inputs-table');
    const thead = el('thead');
    const trHead = el('tr');
    ['Celda / Ref.', 'Dato de entrada', 'Valor'].forEach((h) => trHead.appendChild(el('th', '', h)));
    thead.appendChild(trHead);
    tbl.appendChild(thead);

    const tbody = el('tbody');
    calc.entradas.forEach((inp) => {
      const tr = el('tr');
      tr.appendChild(el('td', '', inp.celda));
      tr.appendChild(el('td', '', inp.descripcion));
      tr.appendChild(el('td', '', inp.valor));
      tbody.appendChild(tr);
    });
    tbl.appendChild(tbody);
    const tblWrap = el('div', 'table-wrap');
    tblWrap.appendChild(tbl);
    card.appendChild(tblWrap);
  }

  const stepsTitle = el('strong', '', 'Explicación paso a paso:');
  card.appendChild(stepsTitle);
  const ul = el('ol', 'steps-list');
  calc.explicacionPasoAPaso.forEach((step) => {
    ul.appendChild(el('li', '', step.replace(/^\d+\.\s*/, '')));
  });
  card.appendChild(ul);

  const rule = el('div', 'rule-callout');
  rule.appendChild(el('strong', '', 'Regla SIGPER: '));
  rule.appendChild(document.createTextNode(calc.reglaNegocio));
  card.appendChild(rule);

  return card;
}

// Practice Exercises Logic
function initExercisesControls() {
  const buttons = document.querySelectorAll('#formaSelector .sheet-tab');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      state.activeForma = btn.dataset.forma;
      buttons.forEach((b) => b.classList.toggle('active', b.dataset.forma === state.activeForma));
      renderExercises();
    });
  });
}

function renderExercises() {
  const container = document.getElementById('exercisesContent');
  container.innerHTML = '';

  state.exercises.forEach((ex) => {
    const f = ex.formas[state.activeForma];
    if (!f) return;

    const card = el('article', 'calc-card');
    const top = el('div', 'calc-top');
    const left = el('div');
    const badges = el('div', 'badges');
    badges.appendChild(el('span', 'badge', `${ex.numero} · Forma ${state.activeForma}`));
    badges.appendChild(el('span', 'badge badge-neutral', ex.subtitulo));
    left.appendChild(badges);
    left.appendChild(el('h2', 'calc-title', ex.titulo));
    top.appendChild(left);
    top.appendChild(el('span', 'result-pill', f.resumen));
    card.appendChild(top);

    card.appendChild(el('p', '', f.enunciado));

    const solDetails = document.createElement('details');
    solDetails.className = 'jump-details';
    solDetails.open = true;
    solDetails.appendChild(el('summary', 'jump-summary', 'Ver / ocultar desarrollo paso a paso'));

    f.pasos.forEach((paso) => {
      solDetails.appendChild(el('h3', 'exercise-step-title', paso.titulo));
      const tbl = el('table', 'inputs-table');
      const thead = el('thead');
      const trH = el('tr');
      paso.columnas.forEach((col) => trH.appendChild(el('th', '', col)));
      thead.appendChild(trH);
      tbl.appendChild(thead);

      const tbody = el('tbody');
      paso.filas.forEach((fila) => {
        const tr = el('tr');
        fila.forEach((val) => tr.appendChild(el('td', '', val)));
        tbody.appendChild(tr);
      });
      tbl.appendChild(tbody);

      const wrap = el('div', 'table-wrap');
      wrap.appendChild(tbl);
      solDetails.appendChild(wrap);
    });

    if (f.nota) {
      const rule = el('div', 'rule-callout');
      rule.appendChild(el('strong', '', 'Nota de criterio: '));
      rule.appendChild(document.createTextNode(f.nota));
      solDetails.appendChild(rule);
    }

    card.appendChild(solDetails);
    container.appendChild(card);
  });
}

async function bootstrap() {
  initTheme();
  initTabs();

  document.getElementById('btnApplyQuiz').addEventListener('click', applyQuizFilters);
  document.getElementById('btnResetProgress').addEventListener('click', () => {
    if (confirm('¿Deseas borrar todas tus respuestas guardadas?')) {
      state.answers = {};
      saveAnswers();
      applyQuizFilters();
    }
  });

  try {
    const [qRes, xRes, eRes] = await Promise.all([
      fetch('./data/questions.json'),
      fetch('./data/excel_explanations.json'),
      fetch('./data/practice_exercises.json'),
    ]);
    if (!qRes.ok || !xRes.ok || !eRes.ok) throw new Error('Error al cargar los archivos JSON');
    state.questions = await qRes.json();
    state.workbooks = await xRes.json();
    state.exercises = await eRes.json();

    applyQuizFilters();
    initExcelControls();
    renderExcel();
    initExercisesControls();
    renderExercises();
  } catch (err) {
    document.getElementById('quizBody').innerHTML = '';
    document.getElementById('quizBody').appendChild(
      el('div', 'card empty-state', `No se pudieron cargar los datos (${err.message}). Si abres el archivo localmente, usa un servidor web (ej. python -m http.server).`)
    );
  }
}

bootstrap();
