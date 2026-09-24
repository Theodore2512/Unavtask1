(function () {
  'use strict';

  var STORAGE_KEY = 'sourcingScreeningDesk.targets.v1';

  var STAGES = ['Sourced', 'Screening', 'Shortlisted', 'Valuation', 'Risk review', 'Decided'];
  var DECISIONS = ['Recommended', 'Parked', 'Rejected'];
  var MOTIVES = ['Growth', 'Cost synergies', 'Revenue synergies', 'Diversification', 'Market power', 'Capability/technology', 'Defensive consolidation'];
  var RISK_LEVELS = ['Low', 'Medium', 'High'];
  var RISK_SCORE = { Low: 5, Medium: 3, High: 1 };

  var FRAMEWORK_STEPS = [
    {
      num: 1,
      title: 'Strategic rationale & M&A motives',
      explain: 'Turning board strategy into an explicit acquisition thesis.',
      questions: [
        'What strategic gap is this meant to close?',
        'Would organic growth, a partnership, or licensing do it more cheaply?',
        "What are the non-negotiable acquisition criteria (size, sector, geography, ownership)?"
      ],
      output: 'A one-page thesis plus hard screening criteria.',
      connect: "These criteria become the screen in Step 2.",
      matchStages: ['Sourced']
    },
    {
      num: 2,
      title: 'Target screening & market/industry analysis',
      explain: "Mapping the industry and applying Step 1's criteria to narrow a long list to a shortlist.",
      questions: [
        'How is the industry structured, and where is value concentrated?',
        'Which companies meet hard vs. soft criteria?',
        'Why do candidates get eliminated?'
      ],
      output: 'A scored long list narrowed to a shortlist.',
      connect: 'Shortlisted targets get a first pass on value in Step 3.',
      matchStages: ['Screening', 'Shortlisted']
    },
    {
      num: 3,
      title: 'Preliminary valuation & synergy estimation',
      explain: 'Directional (not definitive) valuation — comparable multiples plus a rough synergy estimate, enough to rule targets in or out before due diligence.',
      questions: [
        'What do comparables and precedent deals suggest for the EV multiple?',
        'What cost or revenue synergies are realistic, and what would they cost to capture?',
        "Does the price fit the acquirer's balance sheet?"
      ],
      output: 'An indicative EV range plus synergy estimate, tested against affordability.',
      connect: 'Only targets that clear this bar get a full risk review in Step 4.',
      matchStages: ['Valuation']
    },
    {
      num: 4,
      title: 'SWOT, stakeholder mapping & risk assessment',
      explain: 'The qualitative filter — does the deal work once people, politics and process enter the picture.',
      questions: [
        "What does this deal add to, or expose in, the acquirer's strengths and weaknesses?",
        'Who needs to say yes — owners, board, regulators, works councils, key customers?',
        "What would kill the deal, and is it fixable in due diligence?"
      ],
      output: 'A deal-specific SWOT, stakeholder map, and a recommendation to proceed, park, or reject.',
      connect: 'Closes the strategy phase and sets the mandate for due diligence.',
      matchStages: ['Risk review', 'Decided']
    }
  ];

  /* ------------------------------------------------------------ state */

  var state = {
    targets: [],
    filterStage: 'all'
  };

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          state.targets = parsed;
        }
      }
    } catch (e) {
      console.warn('Could not load saved targets:', e);
      state.targets = [];
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.targets));
    } catch (e) {
      console.warn('Could not save targets:', e);
    }
  }

  function makeId() {
    return 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function newTarget(name, sector) {
    var motives = {};
    MOTIVES.forEach(function (m) { motives[m] = false; });
    return {
      id: makeId(),
      name: name,
      sector: sector,
      stage: 'Sourced',
      decision: '',
      step1: { motives: motives, fitScore: 0, notes: '' },
      step2: { marketScore: 0, notes: '' },
      step3: { evLow: '', evHigh: '', synergy: '', valueScore: 0, notes: '' },
      step4: {
        swotS: '', swotW: '', swotO: '', swotT: '',
        stakeholderNotes: '', riskLevel: 'Medium', riskNotes: ''
      },
      generalNotes: '',
      expanded: true
    };
  }

  /* -------------------------------------------------------------- tabs */

  var VIEWS = ['framework', 'dashboard', 'diagnostic'];

  function showView(name) {
    VIEWS.forEach(function (v) {
      var tab = document.getElementById('tab-' + v);
      var view = document.getElementById('view-' + v);
      if (!tab || !view) return;
      view.hidden = v !== name;
      tab.setAttribute('aria-selected', String(v === name));
    });
  }

  VIEWS.forEach(function (v) {
    var tab = document.getElementById('tab-' + v);
    if (tab) tab.addEventListener('click', function () { showView(v); });
  });

  /* --------------------------------------------------------- framework */

  function renderFramework() {
    var list = document.getElementById('framework-timeline');
    list.innerHTML = '';

    FRAMEWORK_STEPS.forEach(function (step) {
      var li = document.createElement('li');
      li.className = 'timeline-step';

      var badge = document.createElement('div');
      badge.className = 'step-badge';
      badge.textContent = String(step.num);
      li.appendChild(badge);

      var card = document.createElement('div');
      card.className = 'step-card';

      var h3 = document.createElement('h3');
      h3.textContent = step.title;
      card.appendChild(h3);

      var explain = document.createElement('p');
      explain.className = 'step-explain';
      explain.textContent = step.explain;
      card.appendChild(explain);

      var qBlock = document.createElement('div');
      qBlock.className = 'step-block';
      var qLabel = document.createElement('span');
      qLabel.className = 'step-block-label';
      qLabel.textContent = 'Key questions';
      qBlock.appendChild(qLabel);
      var ul = document.createElement('ul');
      step.questions.forEach(function (q) {
        var qLi = document.createElement('li');
        qLi.textContent = q;
        ul.appendChild(qLi);
      });
      qBlock.appendChild(ul);
      card.appendChild(qBlock);

      var oBlock = document.createElement('div');
      oBlock.className = 'step-block';
      var oLabel = document.createElement('span');
      oLabel.className = 'step-block-label';
      oLabel.textContent = 'Output';
      oBlock.appendChild(oLabel);
      var oText = document.createElement('p');
      oText.className = 'step-output';
      oText.textContent = step.output;
      oBlock.appendChild(oText);
      card.appendChild(oBlock);

      var connectRow = document.createElement('div');
      connectRow.className = 'step-connect';
      var connectText = document.createElement('p');
      connectText.className = 'step-connect-text';
      connectText.textContent = '→ ' + step.connect;
      connectRow.appendChild(connectText);

      var jumpBtn = document.createElement('button');
      jumpBtn.type = 'button';
      jumpBtn.className = 'btn btn-link';
      jumpBtn.textContent = 'View matching targets';
      jumpBtn.addEventListener('click', function () {
        state.filterStage = step.matchStages[0];
        showView('dashboard');
        renderDashboard();
        var select = document.getElementById('stage-filter');
        if (select) select.value = state.filterStage;
      });
      connectRow.appendChild(jumpBtn);

      if (step.num === 1) {
        var diagBtn = document.createElement('button');
        diagBtn.type = 'button';
        diagBtn.className = 'btn btn-primary';
        diagBtn.textContent = 'Run the rationale diagnostic';
        diagBtn.addEventListener('click', function () { showView('diagnostic'); });
        connectRow.appendChild(diagBtn);
      }

      card.appendChild(connectRow);
      li.appendChild(card);
      list.appendChild(li);
    });
  }

  /* --------------------------------------------------------- radar svg */

  function buildRadarSvg(scores, size) {
    size = size || 96;
    var labels = ['Fit', 'Market', 'Value', 'Risk'];
    var center = size / 2;
    var maxR = size / 2 - 12;
    var svgNs = 'http://www.w3.org/2000/svg';

    function pointFor(index, value) {
      var angle = (Math.PI * 2 * index) / 4 - Math.PI / 2;
      var r = (value / 5) * maxR;
      return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
    }

    var svg = document.createElementNS(svgNs, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + size + ' ' + size);
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('class', 'radar-svg');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Radar chart: Fit ' + scores[0] + ', Market ' + scores[1] + ', Value ' + scores[2] + ', Risk ' + scores[3] + ' out of 5');

    [1, 0.66, 0.33].forEach(function (frac) {
      var poly = document.createElementNS(svgNs, 'polygon');
      var pts = [0, 1, 2, 3].map(function (i) {
        var p = pointFor(i, 5 * frac);
        return p[0] + ',' + p[1];
      }).join(' ');
      poly.setAttribute('points', pts);
      poly.setAttribute('class', 'radar-ring');
      svg.appendChild(poly);
    });

    for (var i = 0; i < 4; i++) {
      var outer = pointFor(i, 5);
      var line = document.createElementNS(svgNs, 'line');
      line.setAttribute('x1', center);
      line.setAttribute('y1', center);
      line.setAttribute('x2', outer[0]);
      line.setAttribute('y2', outer[1]);
      line.setAttribute('class', 'radar-axis');
      svg.appendChild(line);

      var labelPos = pointFor(i, 6.1);
      var text = document.createElementNS(svgNs, 'text');
      text.setAttribute('x', labelPos[0]);
      text.setAttribute('y', labelPos[1]);
      text.setAttribute('class', 'radar-label');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.textContent = labels[i];
      svg.appendChild(text);
    }

    var shapePts = [0, 1, 2, 3].map(function (i) {
      var p = pointFor(i, scores[i]);
      return p[0] + ',' + p[1];
    }).join(' ');
    var shape = document.createElementNS(svgNs, 'polygon');
    shape.setAttribute('points', shapePts);
    shape.setAttribute('class', 'radar-shape');
    svg.appendChild(shape);

    return svg;
  }

  /* ------------------------------------------------------------ pills */

  function renderPills() {
    var container = document.getElementById('stage-pills');
    container.innerHTML = '';
    STAGES.forEach(function (stage) {
      var count = state.targets.filter(function (t) { return t.stage === stage; }).length;
      var pill = document.createElement('span');
      pill.className = 'pill';
      var countEl = document.createElement('span');
      countEl.className = 'pill-count';
      countEl.textContent = count;
      var labelEl = document.createElement('span');
      labelEl.className = 'pill-label';
      labelEl.textContent = stage;
      pill.appendChild(countEl);
      pill.appendChild(labelEl);
      container.appendChild(pill);
    });
  }

  /* -------------------------------------------------------- filter ui */

  function renderFilterOptions() {
    var select = document.getElementById('stage-filter');
    var current = select.value || state.filterStage;
    select.innerHTML = '<option value="all">All stages</option>';
    STAGES.forEach(function (stage) {
      var opt = document.createElement('option');
      opt.value = stage;
      opt.textContent = stage;
      select.appendChild(opt);
    });
    select.value = state.filterStage;
  }

  document.getElementById('stage-filter').addEventListener('change', function (e) {
    state.filterStage = e.target.value;
    renderTargets();
  });

  /* ------------------------------------------------------------- form */

  document.getElementById('add-target-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var nameInput = document.getElementById('input-name');
    var sectorInput = document.getElementById('input-sector');
    var name = nameInput.value.trim();
    var sector = sectorInput.value.trim();
    if (!name || !sector) return;
    state.targets.push(newTarget(name, sector));
    saveState();
    nameInput.value = '';
    sectorInput.value = '';
    renderDashboard();
    nameInput.focus();
  });

  /* --------------------------------------------------------- targets */

  function stageHintFor(stage) {
    var step = FRAMEWORK_STEPS.find(function (s) { return s.matchStages.indexOf(stage) !== -1; });
    return step ? 'Framework Step ' + step.num : '';
  }

  function computeScores(target) {
    return [
      Number(target.step1.fitScore) || 0,
      Number(target.step2.marketScore) || 0,
      Number(target.step3.valueScore) || 0,
      RISK_SCORE[target.step4.riskLevel] || 0
    ];
  }

  var template = document.getElementById('target-card-template');
  var listEl = document.getElementById('targets-list');
  var emptyState = document.getElementById('empty-state');

  function renderTargets() {
    listEl.innerHTML = '';

    var visible = state.targets.filter(function (t) {
      return state.filterStage === 'all' || t.stage === state.filterStage;
    });

    if (state.targets.length === 0) {
      emptyState.hidden = false;
      listEl.hidden = true;
      return;
    }
    emptyState.hidden = true;
    listEl.hidden = false;

    visible.forEach(function (target) {
      listEl.appendChild(buildTargetCard(target));
    });
  }

  function buildTargetCard(target) {
    var node = template.content.firstElementChild.cloneNode(true);

    var nameInput = node.querySelector('[data-role="name"]');
    var sectorInput = node.querySelector('[data-role="sector"]');
    var stageSelect = node.querySelector('[data-role="stage"]');
    var decisionWrap = node.querySelector('[data-role="decision-wrap"]');
    var decisionSelect = node.querySelector('[data-role="decision"]');
    var stageHint = node.querySelector('[data-role="stage-hint"]');
    var radarHolder = node.querySelector('[data-role="radar"]');
    var expandBtn = node.querySelector('[data-role="expand-btn"]');
    var detail = node.querySelector('[data-role="detail"]');
    var deleteBtn = node.querySelector('[data-role="delete"]');

    nameInput.value = target.name;
    sectorInput.value = target.sector;

    STAGES.forEach(function (stage) {
      var opt = document.createElement('option');
      opt.value = stage;
      opt.textContent = stage;
      stageSelect.appendChild(opt);
    });
    stageSelect.value = target.stage;

    DECISIONS.forEach(function (d) {
      var opt = document.createElement('option');
      opt.value = d;
      opt.textContent = d;
      decisionSelect.appendChild(opt);
    });
    decisionSelect.value = target.decision || DECISIONS[0];
    decisionWrap.hidden = target.stage !== 'Decided';

    stageHint.textContent = stageHintFor(target.stage);

    radarHolder.appendChild(buildRadarSvg(computeScores(target)));

    expandBtn.setAttribute('aria-expanded', String(!!target.expanded));
    detail.hidden = !target.expanded;

    expandBtn.addEventListener('click', function () {
      target.expanded = !target.expanded;
      detail.hidden = !target.expanded;
      expandBtn.setAttribute('aria-expanded', String(target.expanded));
      saveState();
    });

    nameInput.addEventListener('change', function () {
      target.name = nameInput.value.trim() || target.name;
      saveState();
    });
    sectorInput.addEventListener('change', function () {
      target.sector = sectorInput.value.trim() || target.sector;
      saveState();
    });

    stageSelect.addEventListener('change', function () {
      target.stage = stageSelect.value;
      decisionWrap.hidden = target.stage !== 'Decided';
      if (target.stage === 'Decided' && !target.decision) {
        target.decision = DECISIONS[0];
        decisionSelect.value = target.decision;
      }
      stageHint.textContent = stageHintFor(target.stage);
      saveState();
      renderPills();
      if (state.filterStage !== 'all' && state.filterStage !== target.stage) {
        renderTargets();
      }
    });

    decisionSelect.addEventListener('change', function () {
      target.decision = decisionSelect.value;
      saveState();
    });

    deleteBtn.addEventListener('click', function () {
      if (!window.confirm('Remove "' + target.name + '" from the tracker? This cannot be undone.')) return;
      state.targets = state.targets.filter(function (t) { return t.id !== target.id; });
      saveState();
      renderDashboard();
    });

    wireStep1(node, target, radarHolder);
    wireStep2(node, target, radarHolder);
    wireStep3(node, target, radarHolder);
    wireStep4(node, target, radarHolder);

    var generalNotes = node.querySelector('[data-role="generalNotes"]');
    generalNotes.value = target.generalNotes;
    generalNotes.addEventListener('input', function () {
      target.generalNotes = generalNotes.value;
      saveState();
    });

    return node;
  }

  function refreshRadar(node, target, holder) {
    holder.innerHTML = '';
    holder.appendChild(buildRadarSvg(computeScores(target)));
  }

  function wireStep1(node, target, radarHolder) {
    var motivesGrid = node.querySelector('[data-role="motives"]');
    MOTIVES.forEach(function (motive) {
      var label = document.createElement('label');
      label.className = 'motive-check';
      var input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = !!target.step1.motives[motive];
      input.addEventListener('change', function () {
        target.step1.motives[motive] = input.checked;
        saveState();
      });
      var span = document.createElement('span');
      span.textContent = motive;
      label.appendChild(input);
      label.appendChild(span);
      motivesGrid.appendChild(label);
    });

    var fitScore = node.querySelector('[data-role="fitScore"]');
    var fitOut = node.querySelector('[data-role="fitScoreOut"]');
    fitScore.value = target.step1.fitScore;
    fitOut.textContent = target.step1.fitScore;
    fitScore.addEventListener('input', function () {
      target.step1.fitScore = Number(fitScore.value);
      fitOut.textContent = fitScore.value;
      refreshRadar(node, target, radarHolder);
      saveState();
    });

    var notes = node.querySelector('[data-role="step1notes"]');
    notes.value = target.step1.notes;
    notes.addEventListener('input', function () {
      target.step1.notes = notes.value;
      saveState();
    });
  }

  function wireStep2(node, target, radarHolder) {
    var marketScore = node.querySelector('[data-role="marketScore"]');
    var marketOut = node.querySelector('[data-role="marketScoreOut"]');
    marketScore.value = target.step2.marketScore;
    marketOut.textContent = target.step2.marketScore;
    marketScore.addEventListener('input', function () {
      target.step2.marketScore = Number(marketScore.value);
      marketOut.textContent = marketScore.value;
      refreshRadar(node, target, radarHolder);
      saveState();
    });

    var notes = node.querySelector('[data-role="step2notes"]');
    notes.value = target.step2.notes;
    notes.addEventListener('input', function () {
      target.step2.notes = notes.value;
      saveState();
    });
  }

  function wireStep3(node, target, radarHolder) {
    var evLow = node.querySelector('[data-role="evLow"]');
    var evHigh = node.querySelector('[data-role="evHigh"]');
    var synergy = node.querySelector('[data-role="synergy"]');
    evLow.value = target.step3.evLow;
    evHigh.value = target.step3.evHigh;
    synergy.value = target.step3.synergy;

    evLow.addEventListener('input', function () {
      target.step3.evLow = evLow.value;
      saveState();
    });
    evHigh.addEventListener('input', function () {
      target.step3.evHigh = evHigh.value;
      saveState();
    });
    synergy.addEventListener('input', function () {
      target.step3.synergy = synergy.value;
      saveState();
    });

    var valueScore = node.querySelector('[data-role="valueScore"]');
    var valueOut = node.querySelector('[data-role="valueScoreOut"]');
    valueScore.value = target.step3.valueScore;
    valueOut.textContent = target.step3.valueScore;
    valueScore.addEventListener('input', function () {
      target.step3.valueScore = Number(valueScore.value);
      valueOut.textContent = valueScore.value;
      refreshRadar(node, target, radarHolder);
      saveState();
    });

    var notes = node.querySelector('[data-role="step3notes"]');
    notes.value = target.step3.notes;
    notes.addEventListener('input', function () {
      target.step3.notes = notes.value;
      saveState();
    });
  }

  function wireStep4(node, target, radarHolder) {
    var swotS = node.querySelector('[data-role="swotS"]');
    var swotW = node.querySelector('[data-role="swotW"]');
    var swotO = node.querySelector('[data-role="swotO"]');
    var swotT = node.querySelector('[data-role="swotT"]');
    swotS.value = target.step4.swotS;
    swotW.value = target.step4.swotW;
    swotO.value = target.step4.swotO;
    swotT.value = target.step4.swotT;
    swotS.addEventListener('input', function () { target.step4.swotS = swotS.value; saveState(); });
    swotW.addEventListener('input', function () { target.step4.swotW = swotW.value; saveState(); });
    swotO.addEventListener('input', function () { target.step4.swotO = swotO.value; saveState(); });
    swotT.addEventListener('input', function () { target.step4.swotT = swotT.value; saveState(); });

    var stakeholderNotes = node.querySelector('[data-role="stakeholderNotes"]');
    stakeholderNotes.value = target.step4.stakeholderNotes;
    stakeholderNotes.addEventListener('input', function () {
      target.step4.stakeholderNotes = stakeholderNotes.value;
      saveState();
    });

    var riskToggle = node.querySelector('[data-role="riskToggle"]');
    var riskButtons = riskToggle.querySelectorAll('button');
    function updateRiskButtons() {
      riskButtons.forEach(function (btn) {
        btn.classList.toggle('active', btn.getAttribute('data-risk') === target.step4.riskLevel);
      });
    }
    updateRiskButtons();
    riskButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        target.step4.riskLevel = btn.getAttribute('data-risk');
        updateRiskButtons();
        refreshRadar(node, target, radarHolder);
        saveState();
      });
    });

    var riskNotes = node.querySelector('[data-role="riskNotes"]');
    riskNotes.value = target.step4.riskNotes;
    riskNotes.addEventListener('input', function () {
      target.step4.riskNotes = riskNotes.value;
      saveState();
    });
  }

  /* --------------------------------------------------------- top-level */

  function renderDashboard() {
    renderPills();
    renderFilterOptions();
    renderTargets();
  }

  loadState();
  renderFramework();
  renderDashboard();
  showView('framework');
})();
