/* ==========================================================================
   Strategic Rationale Diagnostic
   A six-dimension working diagnostic for the strategic-rationale phase of a
   live deal. Each dimension has four criteria rated on an evidence scale,
   an evidence log, and knock-out red flags. Results roll up into a weighted
   readiness index, a verdict, a priority-gap list and a printable report.
   ========================================================================== */
(function () {
  'use strict';

  var STORAGE_KEY = 'sourcingScreeningDesk.diagnostic.v1';

  /* The evidence scale: what each rating means, whatever the criterion. */
  var SCALE = [
    { value: 0, label: 'Not addressed', desc: 'No view has been formed yet.' },
    { value: 1, label: 'Asserted', desc: 'Stated by someone, but not supported by analysis.' },
    { value: 2, label: 'Partly evidenced', desc: 'Some data or analysis exists; material gaps remain.' },
    { value: 3, label: 'Evidenced', desc: 'Supported by data and analysis the team can show.' },
    { value: 4, label: 'Robust', desc: 'Evidenced and stress-tested (board, red team or advisors).' }
  ];

  var WEIGHTS = [
    { value: 1, label: 'Lower' },
    { value: 2, label: 'Standard' },
    { value: 3, label: 'Critical' }
  ];

  var DIMENSIONS = [
    {
      id: 'gap',
      short: 'Strategic gap',
      title: 'Strategic Gap & Corporate Fit',
      why: 'An acquisition is a means, not a strategy. If the gap it is meant to close is not explicit and measurable, screening, valuation and integration have nothing to anchor to, and the deal ends up justifying itself.',
      questions: [
        'What must the company achieve in the next 3–5 years, in numbers?',
        'What stands between the organic plan and that goal?',
        'Would we pursue this even if no specific target were on the table?'
      ],
      criteria: [
        { id: 'c1', label: 'Corporate objectives are explicit and measurable',
          strong: '3–5 year targets (revenue, margin, market position) are written down and board-approved.',
          action: 'Pull the latest strategic plan and restate its targets as numbers with dates.' },
        { id: 'c2', label: 'The strategic gap is quantified',
          strong: 'The shortfall between the organic forecast and the objective is sized (e.g. €60m revenue, a missing capability).',
          action: 'Run a gap analysis: organic forecast vs. objective, by business line.' },
        { id: 'c3', label: 'The gap is a genuine strategic priority',
          strong: 'The gap ties to a stated board priority, not to an opportunistic target that happened to be available.',
          action: 'Test the counterfactual: would this still be a priority with no target on the table?' },
        { id: 'c4', label: 'The ideal target profile follows from the gap',
          strong: 'The kind of company that would close the gap (size, capability, geography) is described before any names are discussed.',
          action: 'Write the target profile in one paragraph without naming a single company.' }
      ],
      flags: [
        'Target-led: a specific company prompted the strategy, not the other way round',
        'The gap cannot be expressed in measurable terms'
      ],
      example: 'Ardent’s plan targets 30% of revenue from recurring software by 2029; today it is 6%. Organic build closes roughly 10 points, leaving a ~€60m revenue gap.'
    },
    {
      id: 'value',
      short: 'Value logic',
      title: 'Value-Creation Logic & Motives',
      why: 'Most value-destroying deals fail because the premium paid exceeds the value the buyer can actually create. Who creates value, how, and why this owner, must be explicit before anyone discusses price.',
      questions: [
        'What is the one primary motive, and which motives are secondary?',
        'Where exactly will synergies come from, and what will they cost to capture?',
        'Why is the target worth more with us than with anyone else?'
      ],
      criteria: [
        { id: 'c1', label: 'The primary motive is explicit and ranked',
          strong: 'One primary motive (e.g. capability acquisition) is named; secondary motives are ranked, not bundled.',
          action: 'Force-rank the motives and drop any that cannot be tied back to the gap.' },
        { id: 'c2', label: 'Synergy hypotheses are identified by source',
          strong: 'Cost and revenue synergies are listed by lever (procurement, footprint, cross-sell, pricing), each with an owner.',
          action: 'Build a synergy hypothesis tree: lever → mechanism → metric → owner.' },
        { id: 'c3', label: 'Synergies are sized to an order of magnitude',
          strong: 'Each lever has a range, a phasing and a one-off cost to achieve; revenue synergies carry a haircut.',
          action: 'Size the top three levers using precedent-deal benchmarks and apply a haircut to revenue synergies.' },
        { id: 'c4', label: 'The best-owner case is made',
          strong: 'It is clear why the target is worth more under us than standalone or with any rival bidder.',
          action: 'List plausible rival bidders, what each could do with the target, and state our edge.' }
      ],
      flags: [
        'Motive is primarily size, prestige or managerial empire-building',
        'The deal only works if revenue synergies materialise in full'
      ],
      example: 'Primary motive: capability (industrial analytics). Revenue synergy: attach analytics to Ardent’s installed base of 40k sensors, sized at €15–25m ARR by year 4, then haircut by 50%.'
    },
    {
      id: 'alternatives',
      short: 'Build / buy / ally',
      title: 'Build, Buy or Ally',
      why: 'Buying is the fastest route, but also the most expensive and the least reversible. A credible rationale shows that organic build, partnerships, JVs and licensing were weighed and lost for stated reasons.',
      questions: [
        'What would it cost, and how long would it take, to build this ourselves?',
        'Could a partnership, JV or licence deliver most of the value?',
        'What is the cost of getting there two or three years later?'
      ],
      criteria: [
        { id: 'c1', label: 'The organic build option is assessed',
          strong: 'Cost, time and probability of success of building internally are estimated by the people who would do it.',
          action: 'Ask R&D or business-unit leads for a build plan: cost, time, capability risk.' },
        { id: 'c2', label: 'Partnership, JV or licensing options are assessed',
          strong: 'At least one non-ownership route is evaluated with its control and value-sharing trade-offs.',
          action: 'Map two or three potential partners and what an alliance would and would not deliver.' },
        { id: 'c3', label: 'The speed advantage of buying is evidenced',
          strong: 'The value of getting there faster (market window, competitor moves) is quantified.',
          action: 'Estimate the value lost by arriving two to three years late.' },
        { id: 'c4', label: 'Acquisition wins on a risk-adjusted basis',
          strong: 'A side-by-side comparison of value, cost, time, risk and reversibility shows buying is superior.',
          action: 'Build a one-page build / buy / ally matrix and have it challenged by someone outside the deal team.' }
      ],
      flags: [
        'No alternative to acquisition was ever seriously considered',
        'A partnership would deliver most of the value at a fraction of the cost'
      ],
      example: 'Build: ~4 years, €35m, high talent risk. Ally with a software vendor: fast, but no control of the data layer. Buy: 12–18 months, highest cost, but secures the team and the IP.'
    },
    {
      id: 'market',
      short: 'Market & timing',
      title: 'Market Attractiveness & Timing',
      why: 'A well-reasoned thesis still fails in the wrong market or at the wrong moment. This dimension checks that the target space is attractive, that there are enough candidates, and that now is the right time to move.',
      questions: [
        'Is the target segment growing and profitable, and why?',
        'Do the structural trends reinforce or undermine the thesis?',
        'Why now rather than in two years?'
      ],
      criteria: [
        { id: 'c1', label: 'The target market is attractive',
          strong: 'Growth, profitability and industry structure (e.g. Five Forces) are analysed and favourable.',
          action: 'Size the target segment and run a Five Forces view on it.' },
        { id: 'c2', label: 'Structural trends support the thesis',
          strong: 'Technology, regulatory and customer trends (PESTEL) reinforce the rationale.',
          action: 'List the five trends that matter most and mark each as a tailwind or a headwind.' },
        { id: 'c3', label: 'The target universe is sufficient',
          strong: 'A long list of candidates exists (typically 15 or more), so the thesis does not hinge on one company.',
          action: 'Build a quick long list from deal databases; if fewer than five names, revisit the criteria.' },
        { id: 'c4', label: 'The timing rationale is clear',
          strong: '“Why now” is explained: valuation cycle, competitor consolidation, a window of availability.',
          action: 'Review precedent deals and competitor moves in the segment over the last 24 months.' }
      ],
      flags: [
        'The thesis depends on a single possible target',
        'The market is in structural decline with no turnaround logic'
      ],
      example: 'Industrial analytics is growing ~18% a year; three competitors bought software firms in the last 24 months; the long list has 22 candidates across the EU and UK.'
    },
    {
      id: 'finance',
      short: 'Capacity & discipline',
      title: 'Financial Capacity & Deal Discipline',
      why: 'The rationale has to survive the balance sheet. Setting the budget envelope, the financing route and the return hurdle up front is what stops deal fever from setting the price later.',
      questions: [
        'How much can we afford to pay without straining the balance sheet?',
        'How will the deal be financed, and what does that do to leverage?',
        'At what price, or under what findings, do we walk away?'
      ],
      criteria: [
        { id: 'c1', label: 'The budget envelope is defined',
          strong: 'An enterprise-value range the acquirer can afford is set and approved in principle.',
          action: 'Agree a maximum EV with the CFO based on leverage headroom.' },
        { id: 'c2', label: 'The financing route is feasible',
          strong: 'The cash / debt / equity mix is identified; the impact on leverage, rating and covenants is checked.',
          action: 'Model pro forma net debt / EBITDA under two or three financing scenarios.' },
        { id: 'c3', label: 'The return hurdle is set',
          strong: 'Success metrics (ROIC above WACC by year X, EPS accretion, payback) are agreed before valuation starts.',
          action: 'Document the hurdle rate and the year by which it must be met.' },
        { id: 'c4', label: 'Walk-away discipline exists',
          strong: 'A walk-away price and deal-breakers are written down before any target is approached.',
          action: 'Record walk-away conditions and who has authority to go beyond them.' }
      ],
      flags: [
        'No walk-away price or deal-breakers are defined',
        'The financing would breach covenants or threaten the credit rating'
      ],
      example: 'Envelope €150–220m, funded from cash and the revolving credit facility; pro forma leverage 2.4x against a 3.5x covenant; hurdle: ROIC above the 9% WACC by year 4.'
    },
    {
      id: 'readiness',
      short: 'Readiness',
      title: 'Organisational Readiness & Governance',
      why: 'Value is created, or lost, after closing. A strategy phase that ignores sponsorship, integration capacity and stakeholders produces deals that look right on paper and fail in execution.',
      questions: [
        'Who owns this deal at executive level, and does the board back it?',
        'How will the target be integrated, and by whom?',
        'Which stakeholders could block or derail the deal?'
      ],
      criteria: [
        { id: 'c1', label: 'Executive sponsor and board alignment',
          strong: 'A named executive owns the thesis; the board has discussed and supports the rationale.',
          action: 'Hold a board strategy session on the thesis and minute the mandate.' },
        { id: 'c2', label: 'Integration capability and bandwidth',
          strong: 'An integration approach (absorb, preserve, symbiosis) is sketched and management has the capacity to run it.',
          action: 'Choose an integration archetype and name a prospective integration lead.' },
        { id: 'c3', label: 'Deal team and advisors are in place',
          strong: 'The internal M&A team, and advisors where needed, are resourced for the process.',
          action: 'Staff the deal team and decide what to outsource (banker, legal, financial DD).' },
        { id: 'c4', label: 'Stakeholder and cultural issues are mapped',
          strong: 'Key stakeholders (employees, works councils, regulators, key customers) and culture risks are identified.',
          action: 'Draft a stakeholder map showing each party’s interest and influence.' }
      ],
      flags: [
        'No executive sponsor owns the deal',
        'Management bandwidth is already consumed by another major transformation'
      ],
      example: 'Sponsor: Chief Digital Officer. Integration: “preserve”, with the target kept autonomous for 24 months. Works council consultation required in Germany.'
    }
  ];

  var STEPS = ['setup'].concat(DIMENSIONS.map(function (d) { return d.id; }), ['results']);

  /* ------------------------------------------------------------- model */

  function makeId() {
    return 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function todayIso() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  function blankDeal() {
    var dims = {};
    DIMENSIONS.forEach(function (dim) {
      var scores = {};
      dim.criteria.forEach(function (c) { scores[c.id] = null; });
      dims[dim.id] = {
        scores: scores,
        flags: dim.flags.map(function () { return false; }),
        evidence: '',
        weight: 2
      };
    });
    return {
      id: makeId(),
      name: 'Untitled deal',
      acquirer: '',
      space: '',
      assessor: '',
      date: todayIso(),
      thesis: '',
      dims: dims,
      updatedAt: Date.now()
    };
  }

  /* Merge untrusted input (storage, imports) onto a blank deal so the shape
     is always complete and values are always in range. */
  function normalizeDeal(raw) {
    var deal = blankDeal();
    if (!raw || typeof raw !== 'object') return deal;
    ['name', 'acquirer', 'space', 'assessor', 'date', 'thesis'].forEach(function (k) {
      if (typeof raw[k] === 'string') deal[k] = raw[k];
    });
    if (typeof raw.id === 'string' && raw.id) deal.id = raw.id;
    if (typeof raw.updatedAt === 'number') deal.updatedAt = raw.updatedAt;
    var rawDims = raw.dims && typeof raw.dims === 'object' ? raw.dims : {};
    DIMENSIONS.forEach(function (dim) {
      var src = rawDims[dim.id];
      if (!src || typeof src !== 'object') return;
      var dst = deal.dims[dim.id];
      dim.criteria.forEach(function (c) {
        var v = src.scores ? src.scores[c.id] : null;
        dst.scores[c.id] = (typeof v === 'number' && v >= 0 && v <= 4) ? Math.round(v) : null;
      });
      if (Array.isArray(src.flags)) {
        dst.flags = dim.flags.map(function (_, i) { return !!src.flags[i]; });
      }
      if (typeof src.evidence === 'string') dst.evidence = src.evidence;
      if ([1, 2, 3].indexOf(src.weight) !== -1) dst.weight = src.weight;
    });
    return deal;
  }

  function sampleDeal() {
    var deal = blankDeal();
    deal.name = 'Project Harbour (sample)';
    deal.acquirer = 'Ardent Instruments plc (fictional)';
    deal.space = 'Industrial analytics software, EU/UK';
    deal.assessor = 'Corporate Development';
    deal.thesis = 'Acquire an industrial analytics software business to move Ardent from hardware sales to recurring software revenue faster than organic build allows.';
    var preset = {
      gap:          { s: [4, 3, 3, 2], f: [false, false], w: 3 },
      value:        { s: [3, 2, 1, 2], f: [false, false], w: 3 },
      alternatives: { s: [3, 2, 2, 1], f: [false, false], w: 2 },
      market:       { s: [3, 3, 4, 3], f: [false, false], w: 2 },
      finance:      { s: [3, 3, 2, 0], f: [true, false], w: 2 },
      readiness:    { s: [3, 1, 2, 2], f: [false, false], w: 2 }
    };
    DIMENSIONS.forEach(function (dim) {
      var p = preset[dim.id];
      var d = deal.dims[dim.id];
      dim.criteria.forEach(function (c, i) { d.scores[c.id] = p.s[i]; });
      d.flags = p.f.slice();
      d.weight = p.w;
      d.evidence = dim.example;
    });
    return deal;
  }

  /* ----------------------------------------------------------- scoring */

  function dimStats(deal, dim) {
    var d = deal.dims[dim.id];
    var rated = 0;
    var sum = 0;
    dim.criteria.forEach(function (c) {
      var v = d.scores[c.id];
      if (v !== null && v !== undefined) { rated++; sum += v; }
    });
    return {
      rated: rated,
      total: dim.criteria.length,
      score: rated ? Math.round((sum / (rated * 4)) * 100) : null,
      flags: d.flags.filter(Boolean).length,
      weight: d.weight
    };
  }

  function overallStats(deal) {
    var wSum = 0;
    var acc = 0;
    var rated = 0;
    var total = 0;
    var flags = [];
    var critical = [];
    DIMENSIONS.forEach(function (dim) {
      var s = dimStats(deal, dim);
      rated += s.rated;
      total += s.total;
      if (s.score !== null) { acc += s.score * s.weight; wSum += s.weight; }
      deal.dims[dim.id].flags.forEach(function (on, i) {
        if (on) flags.push({ dim: dim, text: dim.flags[i] });
      });
      if (s.score !== null && s.score < 50 && s.weight === 3) critical.push(dim);
    });
    return {
      index: wSum ? Math.round(acc / wSum) : null,
      rated: rated,
      total: total,
      complete: rated === total,
      flags: flags,
      criticalWeak: critical
    };
  }

  function verdictFor(stats) {
    if (stats.rated === 0) {
      return { tone: 'none', title: 'Not started', text: 'Rate the criteria in each dimension to generate a verdict.' };
    }
    var v;
    if (stats.flags.length) {
      v = { tone: 'stop', title: 'Stop: resolve the knock-outs',
        text: 'At least one red flag is active. Knock-outs override the score: clear them before this rationale goes to target screening.' };
    } else if (stats.index >= 75 && !stats.criticalWeak.length) {
      v = { tone: 'go', title: 'Ready: proceed to target screening',
        text: 'The rationale is evidenced across all dimensions. Lock the acquisition criteria and move to screening.' };
    } else if (stats.index >= 50) {
      v = { tone: 'caution', title: 'Proceed with conditions',
        text: 'The core logic holds, but gaps remain. Close the priority gaps below before committing resources to screening.' };
    } else {
      v = { tone: 'stop', title: 'Rework the thesis',
        text: 'The rationale is mostly asserted rather than evidenced. Revisit the strategic gap and value logic before going further.' };
    }
    if (!stats.complete) {
      v.provisional = true;
      v.text += ' (Provisional: ' + (stats.total - stats.rated) + ' criteria not yet rated.)';
    }
    return v;
  }

  function priorityGaps(deal) {
    var gaps = [];
    DIMENSIONS.forEach(function (dim) {
      var d = deal.dims[dim.id];
      dim.criteria.forEach(function (c) {
        var v = d.scores[c.id];
        if (v === null || v <= 1) {
          gaps.push({ dim: dim, crit: c, score: v, weight: d.weight });
        }
      });
    });
    gaps.sort(function (a, b) {
      if (b.weight !== a.weight) return b.weight - a.weight;
      var av = a.score === null ? -1 : a.score;
      var bv = b.score === null ? -1 : b.score;
      return av - bv;
    });
    return gaps;
  }

  function toneForScore(score) {
    if (score === null) return 'none';
    if (score >= 75) return 'go';
    if (score >= 50) return 'caution';
    return 'stop';
  }

  /* ------------------------------------------------------------- state */

  var state = { deals: [], currentId: null, step: 'setup' };

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.deals)) {
          state.deals = parsed.deals.map(normalizeDeal);
          state.currentId = parsed.currentId;
          if (STEPS.indexOf(parsed.step) !== -1) state.step = parsed.step;
        }
      }
    } catch (e) {
      console.warn('Could not load diagnostics:', e);
    }
    if (!state.deals.length) state.deals.push(blankDeal());
    if (!currentDeal()) state.currentId = state.deals[0].id;
  }

  function save() {
    var deal = currentDeal();
    if (deal) deal.updatedAt = Date.now();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        deals: state.deals, currentId: state.currentId, step: state.step
      }));
    } catch (e) {
      console.warn('Could not save diagnostics:', e);
    }
  }

  function currentDeal() {
    for (var i = 0; i < state.deals.length; i++) {
      if (state.deals[i].id === state.currentId) return state.deals[i];
    }
    return null;
  }

  /* ----------------------------------------------------------- helpers */

  function el(tag, opts, children) {
    var node = document.createElement(tag);
    opts = opts || {};
    if (opts.className) node.className = opts.className;
    if (opts.text !== undefined) node.textContent = opts.text;
    if (opts.attrs) {
      Object.keys(opts.attrs).forEach(function (k) { node.setAttribute(k, opts.attrs[k]); });
    }
    if (opts.on) {
      Object.keys(opts.on).forEach(function (k) { node.addEventListener(k, opts.on[k]); });
    }
    (children || []).forEach(function (child) {
      if (child) node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    });
    return node;
  }

  function fmtScore(score) {
    return score === null ? '—' : score + '%';
  }

  function dimensionById(id) {
    for (var i = 0; i < DIMENSIONS.length; i++) {
      if (DIMENSIONS[i].id === id) return DIMENSIONS[i];
    }
    return null;
  }

  /* ------------------------------------------------------------ radar */

  function buildHexRadar(deal, size) {
    var svgNs = 'http://www.w3.org/2000/svg';
    var n = DIMENSIONS.length;
    var pad = 90;
    var full = size + pad * 2;
    var c = full / 2;
    var maxR = size / 2;

    function pt(i, pct) {
      var a = (Math.PI * 2 * i) / n - Math.PI / 2;
      var r = (pct / 100) * maxR;
      return [c + r * Math.cos(a), c + r * Math.sin(a)];
    }
    function node(tag, attrs) {
      var e = document.createElementNS(svgNs, tag);
      Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
      return e;
    }

    var scores = DIMENSIONS.map(function (dim) { return dimStats(deal, dim).score; });
    var svg = node('svg', {
      viewBox: '0 0 ' + full + ' ' + full,
      class: 'diag-radar',
      role: 'img',
      'aria-label': 'Radar chart of the six dimensions: ' + DIMENSIONS.map(function (d, i) {
        return d.short + ' ' + fmtScore(scores[i]);
      }).join(', ')
    });

    [100, 75, 50, 25].forEach(function (pct) {
      var pts = [];
      for (var i = 0; i < n; i++) pts.push(pt(i, pct).join(','));
      svg.appendChild(node('polygon', { points: pts.join(' '), class: pct === 50 ? 'radar-ring radar-ring-mid' : 'radar-ring' }));
    });

    for (var i = 0; i < n; i++) {
      var o = pt(i, 100);
      svg.appendChild(node('line', { x1: c, y1: c, x2: o[0], y2: o[1], class: 'radar-axis' }));
      var lp = pt(i, 122);
      var anchor = Math.abs(lp[0] - c) < 4 ? 'middle' : (lp[0] > c ? 'start' : 'end');
      // Wrap long labels ("Capacity & discipline") onto two lines.
      var words = DIMENSIONS[i].short.split(' ');
      var lines = words.length > 2
        ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')]
        : [DIMENSIONS[i].short];
      var top = lp[1] - (lines.length - 1) * 7;
      lines.forEach(function (line, li) {
        var label = node('text', { x: lp[0], y: top + li * 14, class: 'diag-radar-label', 'text-anchor': anchor, 'dominant-baseline': 'middle' });
        label.textContent = line;
        svg.appendChild(label);
      });
      var vp = node('text', { x: lp[0], y: top + lines.length * 14 + 1, class: 'diag-radar-value', 'text-anchor': anchor, 'dominant-baseline': 'middle' });
      vp.textContent = fmtScore(scores[i]);
      svg.appendChild(vp);
    }

    var shape = [];
    for (var j = 0; j < n; j++) shape.push(pt(j, scores[j] || 0).join(','));
    svg.appendChild(node('polygon', { points: shape.join(' '), class: 'radar-shape diag-radar-shape' }));
    for (var k = 0; k < n; k++) {
      var p = pt(k, scores[k] || 0);
      svg.appendChild(node('circle', { cx: p[0], cy: p[1], r: 3.5, class: 'diag-radar-dot' }));
    }
    return svg;
  }

  /* ------------------------------------------------------------ render */

  var root = document.getElementById('diagnostic-root');
  if (!root) return;

  function render() {
    root.innerHTML = '';
    root.appendChild(renderToolbar());
    root.appendChild(renderStepper());
    var body = el('div', { className: 'diag-body' });
    var step = state.step;
    if (step === 'setup') body.appendChild(renderSetup());
    else if (step === 'results') body.appendChild(renderResults());
    else body.appendChild(renderDimension(dimensionById(step)));
    root.appendChild(body);
    root.appendChild(renderNav());
  }

  function goTo(step) {
    state.step = step;
    save();
    render();
    var top = document.getElementById('view-diagnostic');
    if (top && top.scrollIntoView) top.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* toolbar: deal picker + file actions */
  function renderToolbar() {
    var select = el('select', { attrs: { id: 'diag-deal-select', 'aria-label': 'Select deal' },
      on: { change: function (e) { state.currentId = e.target.value; save(); render(); } } });
    state.deals.forEach(function (d) {
      var opt = el('option', { text: d.name || 'Untitled deal', attrs: { value: d.id } });
      if (d.id === state.currentId) opt.selected = true;
      select.appendChild(opt);
    });

    var fileInput = el('input', { attrs: { type: 'file', accept: 'application/json,.json', hidden: '' },
      on: { change: onImport } });

    return el('div', { className: 'panel diag-toolbar no-print' }, [
      el('div', { className: 'diag-toolbar-deal' }, [
        el('label', { className: 'filter-label', text: 'Deal', attrs: { for: 'diag-deal-select' } }),
        select
      ]),
      el('div', { className: 'diag-toolbar-actions' }, [
        el('button', { className: 'btn btn-ghost', text: 'New deal', attrs: { type: 'button' },
          on: { click: function () {
            var d = blankDeal();
            state.deals.push(d);
            state.currentId = d.id;
            goTo('setup');
          } } }),
        el('button', { className: 'btn btn-ghost', text: 'Load sample', attrs: { type: 'button' },
          on: { click: function () {
            var d = sampleDeal();
            state.deals.push(d);
            state.currentId = d.id;
            goTo('results');
          } } }),
        el('button', { className: 'btn btn-ghost', text: 'Export JSON', attrs: { type: 'button' },
          on: { click: onExport } }),
        el('button', { className: 'btn btn-ghost', text: 'Import JSON', attrs: { type: 'button' },
          on: { click: function () { fileInput.click(); } } }),
        fileInput,
        el('button', { className: 'btn btn-danger', text: 'Delete', attrs: { type: 'button' },
          on: { click: onDelete } })
      ])
    ]);
  }

  function onExport() {
    var deal = currentDeal();
    if (!deal) return;
    var blob = new Blob([JSON.stringify({ format: 'rationale-diagnostic', version: 1, deal: deal }, null, 2)],
      { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = el('a', { attrs: { href: url, download: (deal.name || 'deal').replace(/[^\w\-]+/g, '_') + '-diagnostic.json' } });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function onImport(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(reader.result);
        var incoming = parsed && parsed.deal ? [parsed.deal]
          : (parsed && Array.isArray(parsed.deals) ? parsed.deals : [parsed]);
        var added = incoming.map(function (raw) {
          var d = normalizeDeal(raw);
          d.id = makeId();
          return d;
        });
        state.deals = state.deals.concat(added);
        state.currentId = added[0].id;
        goTo('results');
      } catch (err) {
        window.alert('That file could not be read as a diagnostic export.');
      }
    };
    reader.readAsText(file);
  }

  function onDelete() {
    var deal = currentDeal();
    if (!deal) return;
    if (!window.confirm('Delete the diagnostic for "' + deal.name + '"? This cannot be undone.')) return;
    state.deals = state.deals.filter(function (d) { return d.id !== deal.id; });
    if (!state.deals.length) state.deals.push(blankDeal());
    state.currentId = state.deals[0].id;
    goTo('setup');
  }

  /* stepper: one chip per wizard step, with live score */
  function renderStepper() {
    var deal = currentDeal();
    var list = el('ol', { className: 'diag-stepper no-print', attrs: { 'aria-label': 'Diagnostic steps' } });

    function chip(step, num, label, meta, tone) {
      var active = state.step === step;
      var btn = el('button', {
        className: 'diag-step' + (active ? ' is-active' : ''),
        attrs: { type: 'button', 'aria-current': active ? 'step' : 'false', 'data-step': step },
        on: { click: function () { goTo(step); } }
      }, [
        el('span', { className: 'diag-step-num', text: num }),
        el('span', { className: 'diag-step-label', text: label }),
        el('span', { className: 'diag-step-meta tone-' + tone, text: meta })
      ]);
      list.appendChild(el('li', {}, [btn]));
    }

    chip('setup', '0', 'Deal setup', deal.thesis ? 'Done' : 'Start', deal.thesis ? 'go' : 'none');
    DIMENSIONS.forEach(function (dim, i) {
      var s = dimStats(deal, dim);
      var meta = s.flags ? '⚑ ' + fmtScore(s.score) : fmtScore(s.score);
      chip(dim.id, String(i + 1), dim.short, meta, s.flags ? 'stop' : toneForScore(s.score));
    });
    var o = overallStats(deal);
    chip('results', '✓', 'Results', fmtScore(o.index), o.flags.length ? 'stop' : toneForScore(o.index));
    return list;
  }

  function renderNav() {
    var idx = STEPS.indexOf(state.step);
    var prev = idx > 0 ? STEPS[idx - 1] : null;
    var next = idx < STEPS.length - 1 ? STEPS[idx + 1] : null;
    function labelFor(step) {
      if (step === 'setup') return 'Deal setup';
      if (step === 'results') return 'Results';
      return dimensionById(step).short;
    }
    return el('div', { className: 'diag-nav no-print' }, [
      prev ? el('button', { className: 'btn btn-ghost', text: '← ' + labelFor(prev), attrs: { type: 'button' },
        on: { click: function () { goTo(prev); } } }) : el('span'),
      next ? el('button', { className: 'btn btn-primary', text: labelFor(next) + ' →', attrs: { type: 'button' },
        on: { click: function () { goTo(next); } } })
        : el('button', { className: 'btn btn-primary', text: 'Print / save as PDF', attrs: { type: 'button' },
          on: { click: function () { window.print(); } } })
    ]);
  }

  /* step 0: deal setup */
  function renderSetup() {
    var deal = currentDeal();

    function field(key, label, placeholder, opts) {
      opts = opts || {};
      var id = 'diag-f-' + key;
      var input = opts.multiline
        ? el('textarea', { attrs: { id: id, rows: '3', placeholder: placeholder, maxlength: '600' } })
        : el('input', { attrs: { id: id, type: opts.type || 'text', placeholder: placeholder, maxlength: '120' } });
      input.value = deal[key] || '';
      input.addEventListener('input', function () {
        deal[key] = input.value;
        save();
        if (key === 'name') {
          var opt = root.querySelector('#diag-deal-select option[value="' + deal.id + '"]');
          if (opt) opt.textContent = deal.name || 'Untitled deal';
        }
        if (key === 'thesis') {
          var stepper = root.querySelector('.diag-stepper');
          if (stepper) stepper.replaceWith(renderStepper());
        }
      });
      if (key === 'name') {
        input.addEventListener('change', function () {
          if (!deal.name.trim()) {
            deal.name = input.value = 'Untitled deal';
            save();
            render();
          }
        });
      }
      return el('div', { className: 'field' + (opts.wide ? ' field-wide' : '') }, [
        el('label', { text: label, attrs: { for: id } }),
        input,
        opts.hint ? el('p', { className: 'field-hint', text: opts.hint }) : null
      ]);
    }

    return el('div', {}, [
      el('div', { className: 'panel diag-intro' }, [
        el('p', { className: 'diag-eyebrow', text: 'Step 0 · Deal setup' }),
        el('h2', { text: 'Frame the deal before you score it' }),
        el('p', { text: 'This diagnostic tests whether the strategic rationale for a deal is strong enough to move into target screening. It covers six dimensions, each with four criteria. Rate every criterion on the evidence you actually have, not on what you believe. Knock-out red flags override the score.' }),
        el('ol', { className: 'diag-dim-overview' }, DIMENSIONS.map(function (d) {
          return el('li', {}, [el('strong', { text: d.title }), ' — ' + d.why.split('. ')[0] + '.']);
        }))
      ]),
      el('div', { className: 'panel' }, [
        el('h2', { className: 'panel-heading', text: 'Deal details' }),
        el('div', { className: 'diag-form' }, [
          field('name', 'Deal / project name', 'e.g. Project Harbour'),
          field('acquirer', 'Acquirer', 'e.g. Ardent Instruments plc'),
          field('space', 'Target space', 'e.g. Industrial analytics software, EU/UK'),
          field('assessor', 'Assessed by', 'e.g. Corporate Development'),
          field('date', 'Assessment date', '', { type: 'date' }),
          field('thesis', 'One-sentence rationale', 'We want to acquire [what] in order to [strategic outcome] because [why buying beats the alternatives].',
            { multiline: true, wide: true, hint: 'If you cannot write this sentence yet, that is itself the first finding.' })
        ])
      ]),
      el('div', { className: 'panel diag-scale-panel' }, [
        el('h2', { className: 'panel-heading', text: 'The evidence scale' }),
        el('p', { className: 'field-hint', text: 'The same 0–4 scale applies to every criterion. Leave a criterion unrated rather than guessing; unrated items are flagged as gaps.' }),
        el('dl', { className: 'diag-scale' }, [].concat.apply([], SCALE.map(function (s) {
          return [el('dt', {}, [el('span', { className: 'diag-scale-num', text: String(s.value) }), s.label]), el('dd', { text: s.desc })];
        })))
      ])
    ]);
  }

  /* steps 1–6: one dimension */
  function renderDimension(dim) {
    var deal = currentDeal();
    var d = deal.dims[dim.id];
    var num = DIMENSIONS.indexOf(dim) + 1;

    var scoreBadge = el('span', { className: 'diag-dim-score' });
    function refreshHeader() {
      var s = dimStats(deal, dim);
      scoreBadge.textContent = fmtScore(s.score) + ' · ' + s.rated + '/' + s.total + ' rated';
      scoreBadge.className = 'diag-dim-score tone-' + (s.flags ? 'stop' : toneForScore(s.score));
      var stepper = root.querySelector('.diag-stepper');
      if (stepper) stepper.replaceWith(renderStepper());
    }

    var weightGroup = el('div', { className: 'seg', attrs: { role: 'group', 'aria-label': 'Importance for this deal' } });
    WEIGHTS.forEach(function (w) {
      var b = el('button', { text: w.label, attrs: { type: 'button', 'aria-pressed': String(d.weight === w.value) },
        on: { click: function () {
          d.weight = w.value;
          weightGroup.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
          b.setAttribute('aria-pressed', 'true');
          save();
          refreshHeader();
        } } });
      weightGroup.appendChild(b);
    });

    var header = el('div', { className: 'panel diag-dim-head' }, [
      el('div', { className: 'diag-dim-title-row' }, [
        el('div', {}, [
          el('p', { className: 'diag-eyebrow', text: 'Dimension ' + num + ' of ' + DIMENSIONS.length }),
          el('h2', { text: dim.title })
        ]),
        scoreBadge
      ]),
      el('p', { className: 'diag-why' }, [el('strong', { text: 'Why this matters. ' }), dim.why]),
      el('div', { className: 'step-block' }, [
        el('span', { className: 'step-block-label', text: 'Questions to answer' }),
        el('ul', {}, dim.questions.map(function (q) { return el('li', { text: q }); }))
      ]),
      el('details', { className: 'diag-example' }, [
        el('summary', { text: 'Worked example — Project Harbour (fictional)' }),
        el('p', { text: dim.example })
      ]),
      el('div', { className: 'diag-weight-row' }, [
        el('span', { className: 'risk-label', text: 'Importance for this deal' }),
        weightGroup
      ])
    ]);

    var critPanel = el('div', { className: 'panel' }, [
      el('h3', { className: 'panel-heading', text: 'Criteria' })
    ]);
    dim.criteria.forEach(function (c, ci) {
      var status = el('p', { className: 'diag-crit-status' });
      var group = el('div', { className: 'seg seg-scale', attrs: { role: 'radiogroup', 'aria-label': c.label } });

      function refreshStatus() {
        var v = d.scores[c.id];
        status.innerHTML = '';
        if (v === null) {
          status.appendChild(el('span', { className: 'muted', text: 'Not rated.' }));
        } else {
          status.appendChild(el('strong', { text: SCALE[v].label + ': ' }));
          status.appendChild(document.createTextNode(SCALE[v].desc));
        }
        if (v === null || v <= 2) {
          status.appendChild(el('span', { className: 'diag-crit-action' }, [
            el('strong', { text: 'Next action: ' }), c.action
          ]));
        }
      }

      SCALE.forEach(function (s) {
        var b = el('button', {
          text: String(s.value),
          attrs: { type: 'button', role: 'radio', 'aria-checked': String(d.scores[c.id] === s.value), title: s.label, 'aria-label': s.value + ' — ' + s.label },
          on: { click: function () {
            d.scores[c.id] = d.scores[c.id] === s.value ? null : s.value;
            group.querySelectorAll('button').forEach(function (x, xi) {
              x.setAttribute('aria-checked', String(d.scores[c.id] === xi));
            });
            save();
            refreshStatus();
            refreshHeader();
          } }
        });
        group.appendChild(b);
      });
      refreshStatus();

      critPanel.appendChild(el('div', { className: 'diag-crit' }, [
        el('div', { className: 'diag-crit-main' }, [
          el('p', { className: 'diag-crit-label' }, [el('span', { className: 'diag-crit-id', text: num + '.' + (ci + 1) }), c.label]),
          el('p', { className: 'diag-crit-strong' }, [el('em', { text: 'Strong looks like: ' }), c.strong])
        ]),
        group,
        status
      ]));
    });

    var flagsBox = el('div', { className: 'diag-flags' });
    dim.flags.forEach(function (f, fi) {
      var id = 'diag-flag-' + dim.id + '-' + fi;
      var input = el('input', { attrs: { type: 'checkbox', id: id } });
      input.checked = !!d.flags[fi];
      input.addEventListener('change', function () {
        d.flags[fi] = input.checked;
        save();
        refreshHeader();
      });
      flagsBox.appendChild(el('label', { className: 'diag-flag', attrs: { for: id } }, [input, el('span', { text: f })]));
    });

    var evidence = el('textarea', { attrs: { rows: '4', id: 'diag-evidence-' + dim.id,
      placeholder: 'Sources, numbers, documents and open questions behind your ratings…' } });
    evidence.value = d.evidence;
    evidence.addEventListener('input', function () { d.evidence = evidence.value; save(); });

    var side = el('div', { className: 'panel' }, [
      el('h3', { className: 'panel-heading', text: 'Knock-out red flags' }),
      el('p', { className: 'field-hint', text: 'Tick any that apply. A single active red flag stops the deal at this phase, whatever the score.' }),
      flagsBox,
      el('label', { className: 'notes-label', attrs: { for: 'diag-evidence-' + dim.id }, text: 'Evidence log' }),
      evidence
    ]);

    refreshHeader();
    return el('div', {}, [header, critPanel, side]);
  }

  /* step 7: results and report */
  function renderResults() {
    var deal = currentDeal();
    var stats = overallStats(deal);
    var verdict = verdictFor(stats);

    var reportHead = el('div', { className: 'panel diag-report-head' }, [
      el('p', { className: 'diag-eyebrow', text: 'Strategic Rationale Diagnostic' }),
      el('h2', { text: deal.name || 'Untitled deal' }),
      el('dl', { className: 'diag-meta' }, [
        el('dt', { text: 'Acquirer' }), el('dd', { text: deal.acquirer || '—' }),
        el('dt', { text: 'Target space' }), el('dd', { text: deal.space || '—' }),
        el('dt', { text: 'Assessed by' }), el('dd', { text: deal.assessor || '—' }),
        el('dt', { text: 'Date' }), el('dd', { text: deal.date || '—' })
      ]),
      deal.thesis ? el('blockquote', { className: 'diag-thesis', text: deal.thesis }) : null
    ]);

    var verdictPanel = el('div', { className: 'panel diag-verdict tone-' + verdict.tone }, [
      el('div', { className: 'diag-index' }, [
        el('span', { className: 'diag-index-num', text: stats.index === null ? '—' : String(stats.index) }),
        el('span', { className: 'diag-index-label', text: 'Readiness index / 100' })
      ]),
      el('div', {}, [
        el('h3', { text: verdict.title }),
        el('p', { text: verdict.text }),
        el('p', { className: 'field-hint', text: stats.rated + ' of ' + stats.total + ' criteria rated · ' + stats.flags.length + ' red flag' + (stats.flags.length === 1 ? '' : 's') + ' active' })
      ])
    ]);

    var bars = el('div', { className: 'diag-bars' });
    DIMENSIONS.forEach(function (dim, i) {
      var s = dimStats(deal, dim);
      var tone = s.flags ? 'stop' : toneForScore(s.score);
      var weightLabel = WEIGHTS.filter(function (w) { return w.value === s.weight; })[0].label;
      bars.appendChild(el('button', { className: 'diag-bar', attrs: { type: 'button', title: 'Open ' + dim.title },
        on: { click: function () { goTo(dim.id); } } }, [
        el('span', { className: 'diag-bar-label' }, [
          el('span', { text: (i + 1) + '. ' + dim.short }),
          el('span', { className: 'diag-bar-weight', text: weightLabel + (s.flags ? ' · ⚑ ' + s.flags : '') })
        ]),
        el('span', { className: 'diag-bar-track' }, [
          el('span', { className: 'diag-bar-fill tone-bg-' + tone, attrs: { style: 'width:' + (s.score || 0) + '%' } })
        ]),
        el('span', { className: 'diag-bar-val', text: fmtScore(s.score) })
      ]));
    });

    var profile = el('div', { className: 'panel' }, [
      el('h3', { className: 'panel-heading', text: 'Dimension profile' }),
      el('div', { className: 'diag-profile' }, [
        el('div', { className: 'diag-radar-wrap' }, [buildHexRadar(deal, 220)]),
        bars
      ]),
      el('p', { className: 'field-hint', text: 'Score = average rating ÷ 4 on rated criteria. Index = importance-weighted average across dimensions. 75+ ready · 50–74 conditional · under 50 rework. A Critical dimension under 50 blocks a “Ready” verdict.' })
    ]);

    var knockouts = null;
    if (stats.flags.length) {
      knockouts = el('div', { className: 'panel diag-knockouts' }, [
        el('h3', { className: 'panel-heading', text: 'Active knock-outs' }),
        el('ul', {}, stats.flags.map(function (f) {
          return el('li', {}, [el('strong', { text: f.dim.short + ': ' }), f.text]);
        }))
      ]);
    }

    var gaps = priorityGaps(deal);
    var gapPanel = el('div', { className: 'panel' }, [
      el('h3', { className: 'panel-heading', text: 'Priority gaps & next actions' })
    ]);
    if (!gaps.length) {
      gapPanel.appendChild(el('p', { className: 'field-hint', text: 'No criterion is unrated or scored at 1 or below.' }));
    } else {
      var table = el('table', { className: 'diag-table' }, [
        el('thead', {}, [el('tr', {}, [
          el('th', { text: 'Dimension' }), el('th', { text: 'Criterion' }), el('th', { text: 'Rating' }), el('th', { text: 'Next action' })
        ])])
      ]);
      var tb = el('tbody');
      gaps.slice(0, 10).forEach(function (g) {
        tb.appendChild(el('tr', {}, [
          el('td', { text: g.dim.short }),
          el('td', { text: g.crit.label }),
          el('td', { className: 'mono', text: g.score === null ? 'Unrated' : g.score + ' · ' + SCALE[g.score].label }),
          el('td', { text: g.crit.action })
        ]));
      });
      table.appendChild(tb);
      gapPanel.appendChild(el('div', { className: 'diag-table-wrap' }, [table]));
      if (gaps.length > 10) {
        gapPanel.appendChild(el('p', { className: 'field-hint', text: '+ ' + (gaps.length - 10) + ' further gaps, shown in the detail below.' }));
      }
    }

    var detail = el('div', { className: 'panel diag-detail' }, [
      el('h3', { className: 'panel-heading', text: 'Detail by dimension' })
    ]);
    DIMENSIONS.forEach(function (dim, i) {
      var d = deal.dims[dim.id];
      var s = dimStats(deal, dim);
      var rows = dim.criteria.map(function (c, ci) {
        var v = d.scores[c.id];
        return el('tr', {}, [
          el('td', { className: 'mono', text: (i + 1) + '.' + (ci + 1) }),
          el('td', { text: c.label }),
          el('td', { className: 'mono', text: v === null ? '—' : v + ' · ' + SCALE[v].label })
        ]);
      });
      var activeFlags = dim.flags.filter(function (_, fi) { return d.flags[fi]; });
      detail.appendChild(el('section', { className: 'diag-detail-dim' }, [
        el('h4', { text: (i + 1) + '. ' + dim.title + ' — ' + fmtScore(s.score) }),
        el('div', { className: 'diag-table-wrap' }, [el('table', { className: 'diag-table' }, [el('tbody', {}, rows)])]),
        activeFlags.length ? el('p', { className: 'diag-flag-line' }, [el('strong', { text: '⚑ Red flag: ' }), activeFlags.join('; ')]) : null,
        d.evidence ? el('p', { className: 'diag-evidence' }, [el('strong', { text: 'Evidence: ' }), d.evidence]) : null
      ]));
    });

    return el('div', { className: 'diag-report' }, [reportHead, verdictPanel, knockouts, profile, gapPanel, detail]);
  }

  load();
  render();
})();
