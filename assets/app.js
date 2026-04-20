/* ── ROUTING ── */
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pg = document.getElementById('page-' + name);
  if (pg) pg.classList.add('active');
  document.querySelectorAll('.nav-links button, .mobile-menu button').forEach(b => b.classList.remove('active'));
  const navId = name === 'start' ? 'nav-start' : 'nav-' + name;
  const nb = document.getElementById(navId);
  if (nb) nb.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (name === 'dashboards') setTimeout(initAllCharts, 80);
  setTimeout(initReveal, 60);
  closeMobileMenu();
}

/* ── MOBILE MENU ── */
function toggleMenu() {
  const btn = document.getElementById('hamburger');
  const menu = document.getElementById('mobile-menu');
  const isOpen = menu.classList.contains('open');
  btn.classList.toggle('open', !isOpen);
  if (!isOpen) {
    menu.style.display = 'flex';
    requestAnimationFrame(() => menu.classList.add('open'));
  } else {
    closeMobileMenu();
  }
}
function closeMobileMenu() {
  const btn = document.getElementById('hamburger');
  const menu = document.getElementById('mobile-menu');
  if (btn) btn.classList.remove('open');
  if (menu) {
    menu.classList.remove('open');
    setTimeout(() => { if (!menu.classList.contains('open')) menu.style.display = 'none'; }, 200);
  }
}
function navTo(page) { showPage(page); }

/* ── GLOBAL TOOLTIP (appended to body — escapes any overflow / transform) ── */
(function () {
  const tip = document.getElementById('g-tip');
  if (!tip) return;

  document.addEventListener('mouseover', function (e) {
    const icon = e.target.closest('.tooltip-icon');
    if (!icon) return;
    const text = icon.dataset.tip;
    if (!text) return;
    tip.textContent = text;

    const rect = icon.getBoundingClientRect();
    const tipW = 220;
    let left = rect.left + rect.width / 2;
    left = Math.max(tipW / 2 + 8, Math.min(left, window.innerWidth - tipW / 2 - 8));

    tip.style.left      = left + 'px';
    tip.style.top       = (rect.top + window.scrollY - 10) + 'px';
    tip.style.transform = 'translate(-50%, -100%)';
    tip.classList.add('tt-visible');
  });

  document.addEventListener('mouseout', function (e) {
    if (!e.target.closest('.tooltip-icon')) return;
    tip.classList.remove('tt-visible');
  });
})();
// Close mobile menu on outside click
document.addEventListener('click', function(e) {
  const menu = document.getElementById('mobile-menu');
  const btn  = document.getElementById('hamburger');
  if (menu && menu.classList.contains('open') && !menu.contains(e.target) && !btn.contains(e.target)) {
    closeMobileMenu();
  }
});

/* ── DASHBOARD TABS ── */
function switchDash(idx) {
  document.querySelectorAll('.dashboard-panel').forEach((p,i) => p.classList.toggle('active', i === idx));
  document.querySelectorAll('.dash-tab').forEach((t,i) => t.classList.toggle('active', i === idx));
  setTimeout(initAllCharts, 60);
}

/* ── CHART HELPERS ── */
const P = {
  navy:'#22577A', teal:'#38A3A5', green:'#57CC99', lgreen:'#80ED99', mint:'#C7F9CC',
  gray:'#9BB3C4', lgray:'#E2EAF0', amber:'#F0A500', purple:'#9B72CF', rose:'#E05C8A',
  font:"'DM Sans', sans-serif"
};
const ttOpts = { bodyFont:{family:P.font}, titleFont:{family:P.font,weight:'600'}, backgroundColor:'#0F1F2A', padding:12, cornerRadius:8, displayColors:true };
const scaleOpts = {
  x: { grid:{color:'rgba(34,87,122,0.05)',drawBorder:false}, ticks:{font:{family:P.font,size:11},color:P.gray} },
  y: { grid:{color:'rgba(34,87,122,0.05)',drawBorder:false}, ticks:{font:{family:P.font,size:11},color:P.gray} }
};
const instances = {};
function mk(id, cfg) {
  if (instances[id]) { instances[id].destroy(); delete instances[id]; }
  const el = document.getElementById(id);
  if (!el) return;
  instances[id] = new Chart(el, cfg);
}

/* ══════════════════════════════════════════
   SOURCE-OF-TRUTH DATA
   All "All" values are sums/averages of parts
══════════════════════════════════════════ */

/* ── UTILITIES ──
   Per-region monthly outage duration (min).
   All = sum of all 4 regions each month. */
const UD = {
  north: { dur:[180,140,160,130,100, 85,105,115,110, 85, 95,140], saidi:72.4, outages:6, crew:83, ahi:76.2, cause:[22,20,35,14, 9] },
  south: { dur:[280,210,240,200,145,135,155,175,165,130,140,210], saidi:91.8, outages:9, crew:71, ahi:68.4, cause:[42,32,12, 8, 6] },
  east:  { dur:[220,170,190,160,115,105,125,145,135,105,115,170], saidi:88.5, outages:5, crew:79, ahi:72.1, cause:[35,28,18,12, 7] },
  west:  { dur:[140,120,120, 90, 70, 65, 75, 85, 80, 60, 70, 90], saidi:84.2, outages:3, crew:80, ahi:73.8, cause:[28,25,24,14, 9] }
};
// Compute "all" from parts
UD.all = {
  dur: UD.north.dur.map((_,i)=>UD.north.dur[i]+UD.south.dur[i]+UD.east.dur[i]+UD.west.dur[i]),
  saidi: +((UD.north.saidi+UD.south.saidi+UD.east.saidi+UD.west.saidi)/4).toFixed(1),
  outages: UD.north.outages+UD.south.outages+UD.east.outages+UD.west.outages,
  crew: Math.round((UD.north.crew+UD.south.crew+UD.east.crew+UD.west.crew)/4),
  ahi: +((UD.north.ahi+UD.south.ahi+UD.east.ahi+UD.west.ahi)/4).toFixed(1),
  cause: [34,28,18,12,8]  // weighted portfolio cause mix
};

/* ── CONSTRUCTION ──
   Per-project cumulative spend. All = sum of all 4. */
const CD = {
  terminal:{ plan:[4.8, 6.0, 6.8, 7.6, 8.0, 9.2,10.0,10.7,11.5,12.2,13.0,13.8], act:[4.7,5.9,7.0,8.0,8.4,9.4,10.3,11.1,11.9,12.8,13.6,null], cpi:1.01, spi:1.05, cost:'$53M', costC:'On track', rfi:12, co:[8,26,22,14,30] },
  bridge:   { plan:[1.8, 2.3, 2.7, 3.0, 3.2, 3.6, 4.0, 4.2, 4.5, 4.8, 5.1, 5.4], act:[1.8,2.3,2.8,3.2,3.4,3.8,4.2,4.5,4.8,5.2,5.6,null], cpi:0.94, spi:0.97, cost:'$22M', costC:'$1.4M at risk', rfi:19, co:[41,18,20,14, 7] },
  dc:       { plan:[0.8, 1.2, 1.5, 1.8, 2.1, 2.4, 2.7, 2.9, 3.2, 3.4, 3.7, 3.9], act:[0.7,1.1,1.4,1.7,1.9,2.2,2.5,null,null,null,null,null], cpi:1.03, spi:1.08, cost:'$9M',  costC:'On track', rfi:8,  co:[22,28,25,18, 7] },
  sub:      { plan:[0.8, 0.9, 1.3, 1.8, 2.0, 2.2, 2.4,null,null,null,null,null], act:[0.8,0.9,1.4,2.0,2.2,2.4,2.6,2.7,null,null,null,null], cpi:0.96, spi:0.99, cost:'$11.4M',costC:'$400K over budget', rfi:8, co:[19,22,31,20, 8] }
};
// Compute "all" as sum (null-safe)
CD.all = {
  plan: Array.from({length:12},(_,i)=>{
    const v=[CD.terminal.plan[i],CD.bridge.plan[i],CD.dc.plan[i],CD.sub.plan[i]].filter(x=>x!=null);
    if(!v.length) return null;
    return +v.reduce((a,b)=>a+b,0).toFixed(1);
  }),
  act: Array.from({length:12},(_,i)=>{
    const v=[CD.terminal.act[i],CD.bridge.act[i],CD.dc.act[i],CD.sub.act[i]].filter(x=>x!=null);
    if(!v.length) return null;
    return +v.reduce((a,b)=>a+b,0).toFixed(1);
  }),
  cpi:0.96, spi:1.03, cost:'$148M', costC:'$3.2M above baseline', rfi:47,
  co:[31,26,19,14,10]
};

/* ── HR ──
   Per-department headcount and attrition. All = sum/avg. */
const HR = {
  eng:  { hcPlan:[296,298,300,302,304,306,308,309,310,311,312,312], hcAct:[290,293,295,297,299,302,304,306,308,309,311,312], att:11.4, ttf:42, hcN:312, open:14, enps:41, tenure:4.2 },
  ops:  { hcPlan:[420,421,422,423,424,425,426,427,428,428,428,428], hcAct:[412,414,416,418,420,421,423,424,425,426,427,428], att:16.2, ttf:31, hcN:428, open:8,  enps:28, tenure:3.1 },
  fin:  { hcPlan:[ 90, 90, 91, 91, 92, 92, 92, 93, 93, 93, 94, 94], hcAct:[ 88, 89, 90, 90, 91, 91, 92, 92, 93, 93, 94, 94], att: 9.8, ttf:36, hcN: 94, open:3,  enps:45, tenure:5.7 },
  sales:{ hcPlan:[180,180,181,182,183,184,184,185,185,186,186,186], hcAct:[175,176,177,178,179,180,181,182,183,184,185,186], att:22.1, ttf:44, hcN:186, open:11, enps:12, tenure:2.4 },
  corp: { hcPlan:[214,215,216,217,218,218,219,219,220,220,220,220], hcAct:[213,214,214,215,215,214,216,214,215,216,217,220], att:12.3, ttf:28, hcN:220, open:2,  enps:38, tenure:6.1 }
};
HR.all = {
  hcPlan: HR.eng.hcPlan.map((_,i)=>HR.eng.hcPlan[i]+HR.ops.hcPlan[i]+HR.fin.hcPlan[i]+HR.sales.hcPlan[i]+HR.corp.hcPlan[i]),
  hcAct:  HR.eng.hcAct.map((_,i)=>HR.eng.hcAct[i]+HR.ops.hcAct[i]+HR.fin.hcAct[i]+HR.sales.hcAct[i]+HR.corp.hcAct[i]),
  att: +((HR.eng.att*HR.eng.hcN+HR.ops.att*HR.ops.hcN+HR.fin.att*HR.fin.hcN+HR.sales.att*HR.sales.hcN+HR.corp.att*HR.corp.hcN)/(HR.eng.hcN+HR.ops.hcN+HR.fin.hcN+HR.sales.hcN+HR.corp.hcN)).toFixed(1),
  ttf: Math.round((HR.eng.ttf+HR.ops.ttf+HR.fin.ttf+HR.sales.ttf+HR.corp.ttf)/5),
  hcN: HR.eng.hcN+HR.ops.hcN+HR.fin.hcN+HR.sales.hcN+HR.corp.hcN,
  open:HR.eng.open+HR.ops.open+HR.fin.open+HR.sales.open+HR.corp.open,
  enps:Math.round((HR.eng.enps+HR.ops.enps+HR.fin.enps+HR.sales.enps+HR.corp.enps)/5),
  tenure:+((HR.eng.tenure+HR.ops.tenure+HR.fin.tenure+HR.sales.tenure+HR.corp.tenure)/5).toFixed(1)
};

/* ── FINANCIAL ──
   Per-BU monthly revenue. All = sum. */
const FD = {
  ea: { budget:[1.40,1.44,1.52,1.48,1.56,1.60], actual:[1.48,1.55,1.50,1.58,1.62,1.68], ebitda:22.4, cash:'$2.1M', cashC:'On plan', pipe:'3.8×', pipeC:'Strong coverage',    donut:[58,22,12,8],  donutL:['Core Services','Managed Svcs','Advisory','Other'] },
  we: { budget:[1.24,1.28,1.36,1.32,1.40,1.44], actual:[1.32,1.38,1.36,1.48,1.44,1.52], ebitda:21.1, cash:'$2.4M', cashC:'Strong',   pipe:'4.1×', pipeC:'Best in portfolio', donut:[62,18,14,6],  donutL:['Core Services','Managed Svcs','Projects','Other'] },
  pr: { budget:[0.72,0.76,0.80,0.76,0.84,0.88], actual:[0.74,0.76,0.76,0.82,0.80,0.84], ebitda:14.2, cash:'$1.1M', cashC:'Tight — 48 days', pipe:'2.4×', pipeC:'Below 3.0× threshold', donut:[44,31,16,9], donutL:['Product A','Product B','Product C','Other'] },
  adv:{ budget:[0.44,0.42,0.46,0.44,0.44,0.48], actual:[0.36,0.40,0.38,0.44,0.36,0.48], ebitda:31.8, cash:'$0.6M', cashC:'Conservative', pipe:'2.8×', pipeC:'Below 3.0× target', donut:[50,30,12,8], donutL:['Strategy','Transactions','Research','Other'] }
};
FD.all = {
  budget: FD.ea.budget.map((_,i)=>+(FD.ea.budget[i]+FD.we.budget[i]+FD.pr.budget[i]+FD.adv.budget[i]).toFixed(2)),
  actual: FD.ea.actual.map((_,i)=>+(FD.ea.actual[i]+FD.we.actual[i]+FD.pr.actual[i]+FD.adv.actual[i]).toFixed(2)),
  ebitda:19.8, cash:'$6.2M', cashC:'82 days reserve', pipe:'3.4×', pipeC:'Healthy coverage ratio',
  donut:[37,34,19,10], donutL:['Services East','Services West','Products','Advisory']
};

/* ── OPERATIONS ──
   Per-facility daily plan and variance seed. */
const OD = {
  all: { planVal:4720, variance:420, oee:74, fpy:96.4, otd:97.1, units:'4,820', unitsC:'102% of daily plan', downLabels:['Equip. Failure','Changeover','Planned Maint.','Material','Quality Hold','Other'], downVals:[12.4,9.8,8.2,4.1,3.6,2.1] },
  atl: { planVal:2100, variance:180, oee:78, fpy:97.8, otd:98.4, units:'2,140', unitsC:'104% of plan',        downLabels:['Equip. Failure','Changeover','Planned Maint.','Material','Quality Hold','Other'], downVals:[ 3.2,3.8,4.0,1.2,1.0,0.6] },
  hou: { planVal:1680, variance:220, oee:71, fpy:95.1, otd:95.8, units:'1,620', unitsC:'96% of plan',         downLabels:['Equip. Failure','Changeover','Planned Maint.','Material','Quality Hold','Other'], downVals:[ 6.8,3.4,2.4,1.8,1.4,0.8] },
  phx: { planVal:1040, variance:140, oee:76, fpy:96.8, otd:97.6, units:'1,060', unitsC:'100% of plan',        downLabels:['Equip. Failure','Changeover','Planned Maint.','Material','Quality Hold','Other'], downVals:[ 2.4,2.6,1.8,1.1,1.2,0.7] }
};
// Verify: atl+hou+phx downtime ≈ all (3.2+6.8+2.4=12.4 ✓, 3.8+3.4+2.6=9.8 ✓, 4.0+2.4+1.8=8.2 ✓, etc.)

/* ── HEALTHCARE ── */
const HC = {
  all:     { wait:34, vacRate:14.2, vacC:'4.2 pts above 10% target', bed:88, hcahps:'72nd', hcahpsC:'3 pts from top quartile',  unitVac:[18.2,14.6,12.8,11.1,9.4,7.2] },
  main:    { wait:38, vacRate:16.8, vacC:'High — travel spend rising', bed:91, hcahps:'68th', hcahpsC:'Below top quartile',      unitVac:[22.4,18.2,15.6,13.8,11.2,8.8] },
  north:   { wait:29, vacRate:11.2, vacC:'1.2 pts above 10% target',  bed:84, hcahps:'76th', hcahpsC:'Top quartile achieved',   unitVac:[14.4,12.0,10.8, 9.4, 7.8,5.6] },
  clinics: { wait:18, vacRate: 9.4, vacC:'Under 10% target',          bed:78, hcahps:'81st', hcahpsC:'Strong performance',      unitVac:[ 9.8, 8.6, 8.2, 7.4, 6.2,4.8] }
};
// ED trend seeds per facility (baseline + variance)
HC.all.trendBase=28;    HC.all.trendVar=10;   HC.all.trendDrift=6;
HC.main.trendBase=30;   HC.main.trendVar=10;  HC.main.trendDrift=10;
HC.north.trendBase=26;  HC.north.trendVar=6;  HC.north.trendDrift=4;
HC.clinics.trendBase=16;HC.clinics.trendVar=4;HC.clinics.trendDrift=2;

/* ══════════════════════════════════════════
   INIT ALL CHARTS (builds from scratch)
══════════════════════════════════════════ */
function initAllCharts() {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  /* ─ UTILITIES ─ */
  if (document.getElementById('util-bar')) {
    const r = (document.getElementById('util-region')||{value:'all'}).value || 'all';
    const d = UD[r];
    mk('util-bar', { type:'bar', data:{ labels:months, datasets:[{
      label:'Outage Duration (min)', data:d.dur,
      backgroundColor:P.green+'BB', borderRadius:5, borderSkipped:false
    }]}, options:{ responsive:true, maintainAspectRatio:true,
      plugins:{legend:{display:false},tooltip:ttOpts}, scales:scaleOpts }
    });
    mk('util-doughnut', { type:'doughnut',
      data:{ labels:['Weather','Equipment Failure','Planned Maint.','Third-Party','Other'],
        datasets:[{data:d.cause, backgroundColor:[P.navy,P.teal,P.green,P.lgreen,P.gray], borderWidth:0, hoverOffset:8}] },
      options:{ responsive:true, maintainAspectRatio:true, aspectRatio:1.6, cutout:'64%',
        plugins:{legend:{position:'bottom',labels:{font:{family:P.font,size:11},color:'#5A7A8E',padding:8,boxWidth:10,boxHeight:8}},tooltip:ttOpts} }
    });
  }

  /* ─ CONSTRUCTION ─ */
  if (document.getElementById('constr-line')) {
    const proj = (document.getElementById('constr-project')||{value:'all'}).value || 'all';
    const d = CD[proj];
    mk('constr-line', { type:'line', data:{ labels:months, datasets:[
      { label:'Planned ($M)', data:d.plan, borderColor:P.lgray, borderDash:[5,5], tension:0.3, pointRadius:2, borderWidth:1.5, fill:false, spanGaps:false },
      { label:'Actual ($M)',  data:d.act,  borderColor:P.amber, tension:0.4, pointRadius:3, pointBackgroundColor:P.amber, borderWidth:2, spanGaps:false,
        fill:{target:'-1',above:'rgba(240,165,0,0.07)',below:'rgba(192,57,43,0.06)'} }
    ]}, options:{responsive:true,plugins:{legend:{display:false},tooltip:ttOpts},scales:scaleOpts} });
    mk('constr-pie', { type:'doughnut',
      data:{ labels:['Design Errors','Owner Changes','Unforeseen Conditions','Weather','Scope Additions'],
        datasets:[{data:d.co, backgroundColor:['#1C3A4A',P.amber,'#E8C060','#E2D0A0',P.gray], borderWidth:0}] },
      options:{ responsive:true, maintainAspectRatio:true, aspectRatio:1.6, cutout:'60%',
        plugins:{legend:{position:'bottom',labels:{font:{family:P.font,size:11},color:'#5A7A8E',padding:8,boxWidth:10,boxHeight:8}},tooltip:ttOpts} }
    });
  }

  /* ─ HR ─ */
  if (document.getElementById('hr-line')) {
    const dept = (document.getElementById('hr-dept')||{value:'all'}).value || 'all';
    const deptKey = dept==='all'?'all': dept==='eng'?'eng': dept==='ops'?'ops': dept==='fin'?'fin': dept==='sales'?'sales':'corp';
    const d = deptKey==='all' ? HR.all : HR[deptKey];
    const period = (document.getElementById('hr-period')||{value:'12'}).value || '12';
    const n = period==='3'?3:period==='6'?6:12;
    mk('hr-line', { type:'line', data:{ labels:months.slice(12-n), datasets:[
      { label:'Plan',   data:d.hcPlan.slice(12-n), borderColor:P.lgray, borderDash:[5,5], tension:0.3, pointRadius:2, borderWidth:1.5, fill:false },
      { label:'Actual', data:d.hcAct.slice(12-n),  borderColor:P.purple, tension:0.3, pointRadius:3, pointBackgroundColor:P.purple, borderWidth:2, fill:false }
    ]}, options:{responsive:true,plugins:{legend:{display:false},tooltip:ttOpts},scales:scaleOpts} });
    // Horizontal bar — all depts, highlight selected
    const depts=['Engineering','Operations','Finance','Sales','Corporate'];
    const attVals=[HR.eng.att,HR.ops.att,HR.fin.att,HR.sales.att,HR.corp.att];
    const deptMap={eng:'Engineering',ops:'Operations',fin:'Finance',sales:'Sales',corp:'Corporate'};
    const colors=depts.map(lbl=> deptKey==='all'?P.purple : lbl===deptMap[deptKey]?'#C0392B':P.purple+'44');
    mk('hr-bar', { type:'bar',
      data:{ labels:depts, datasets:[{label:'Attrition %', data:attVals, backgroundColor:colors, borderRadius:5}] },
      options:{ responsive:true, maintainAspectRatio:true, aspectRatio:1.8, indexAxis:'y',
        plugins:{legend:{display:false},tooltip:ttOpts},
        scales:{
          x:{grid:{color:'rgba(34,87,122,0.05)',drawBorder:false},ticks:{font:{family:P.font,size:11},color:P.gray}},
          y:{grid:{display:false},ticks:{font:{family:P.font,size:11},color:P.gray}}
        } }
    });
  }

  /* ─ FINANCIAL ─ */
  if (document.getElementById('fin-bar')) {
    const unit = (document.getElementById('fin-unit')||{value:'all'}).value || 'all';
    const yr   = (document.getElementById('fin-yr')||{value:'25'}).value || '25';
    const fdKey = unit==='all'?'all':unit==='ea'?'ea':unit==='we'?'we':unit==='pr'?'pr':'adv';
    const fd = FD[fdKey];
    const scale = yr==='24'?0.91:yr==='q1'?1:yr==='q2'?1:1;
    const labels = yr==='q1'?months.slice(0,3):yr==='q2'?months.slice(3,6):months.slice(0,6);
    const sl = yr==='q1'?[0,3]:yr==='q2'?[3,6]:[0,6];
    mk('fin-bar', { type:'bar', data:{ labels, datasets:[
      { label:'Budget ($M)', data:fd.budget.slice(sl[0],sl[1]).map(v=>+(v*scale).toFixed(2)), backgroundColor:P.lgray, borderRadius:4 },
      { label:'Actual ($M)', data:fd.actual.slice(sl[0],sl[1]).map(v=>+(v*scale).toFixed(2)), backgroundColor:P.teal+'CC', borderRadius:4 }
    ]}, options:{responsive:true,plugins:{legend:{display:false},tooltip:ttOpts},scales:scaleOpts} });
    mk('fin-doughnut', { type:'doughnut',
      data:{ labels:fd.donutL, datasets:[{data:fd.donut, backgroundColor:[P.navy,P.teal,P.green,P.lgreen], borderWidth:0}] },
      options:{ responsive:true, maintainAspectRatio:true, aspectRatio:1.6, cutout:'60%',
        plugins:{legend:{position:'bottom',labels:{font:{family:P.font,size:11},color:'#5A7A8E',padding:8,boxWidth:10,boxHeight:8}},tooltip:ttOpts} }
    });
  }

  /* ─ OPERATIONS ─ */
  if (document.getElementById('ops-line')) {
    const fac = (document.getElementById('ops-fac')||{value:'all'}).value || 'all';
    const d = OD[fac];
    // Use deterministic seed based on fac key so data doesn't jump on re-render
    const seed = fac==='all'?7:fac==='atl'?3:fac==='hou'?5:2;
    function seededRand(i){ let x=Math.sin(seed*100+i)*10000; return x-Math.floor(x); }
    const days30 = Array.from({length:30},(_,i)=>`D${i+1}`);
    const plan30 = Array(30).fill(d.planVal);
    const act30  = days30.map((_,i)=>Math.round(d.planVal - d.variance/2 + seededRand(i)*d.variance));
    mk('ops-line', { type:'line', data:{ labels:days30, datasets:[
      { label:'Plan',   data:plan30, borderColor:P.lgray, borderDash:[4,4], borderWidth:1.5, pointRadius:0, fill:false },
      { label:'Actual', data:act30,  borderColor:P.green, tension:0.4, borderWidth:2, pointRadius:0,
        fill:{target:'-1',above:'rgba(87,204,153,0.08)',below:'rgba(192,57,43,0.07)'} }
    ]}, options:{responsive:true,plugins:{legend:{display:false},tooltip:ttOpts},scales:scaleOpts} });
    mk('ops-bar', { type:'bar',
      data:{ labels:d.downLabels, datasets:[{label:'Downtime (hrs)', data:d.downVals,
        backgroundColor:[P.navy+'CC',P.teal+'CC',P.green+'CC',P.lgreen+'CC',P.gray+'CC','#CCC'], borderRadius:5}] },
      options:{responsive:true,plugins:{legend:{display:false},tooltip:ttOpts},scales:scaleOpts}
    });
  }

  /* ─ HEALTHCARE ─ */
  if (document.getElementById('hc-line')) {
    const fac = (document.getElementById('hc-fac')||{value:'all'}).value || 'all';
    const d = HC[fac];
    function seededHC(i){ let x=Math.sin((fac==='all'?11:fac==='main'?17:fac==='north'?23:31)*100+i)*10000; return x-Math.floor(x); }
    const days30 = Array.from({length:30},(_,i)=>`D${i+1}`);
    const target = Array(30).fill(28);
    const actual = days30.map((_,i)=>Math.round(d.trendBase + seededHC(i)*d.trendVar + (i>14?d.trendDrift*i/28:0)));
    mk('hc-line', { type:'line', data:{ labels:days30, datasets:[
      { label:'Target (28 min)', data:target, borderColor:P.lgray, borderDash:[5,5], borderWidth:1.5, pointRadius:0, fill:false },
      { label:'Actual (min)',    data:actual,  borderColor:P.rose,  tension:0.4, borderWidth:2, pointRadius:0,
        fill:{target:'-1',above:'rgba(224,92,138,0.08)',below:'rgba(56,163,165,0.06)'} }
    ]}, options:{responsive:true,plugins:{legend:{display:false},tooltip:ttOpts},scales:scaleOpts} });
    mk('hc-bar', { type:'bar',
      data:{ labels:['ED','ICU','Med/Surg','Surgical','OB','Float'],
        datasets:[{label:'Vacancy %', data:d.unitVac,
          backgroundColor:d.unitVac.map(v=>v>=18?'#C0392B':v>=14?P.rose:v>=10?P.rose+'99':'#E8A0B8'), borderRadius:5}] },
      options:{ responsive:true, maintainAspectRatio:true, aspectRatio:1.8, indexAxis:'y',
        plugins:{legend:{display:false},tooltip:ttOpts},
        scales:{
          x:{grid:{color:'rgba(34,87,122,0.05)',drawBorder:false},ticks:{font:{family:P.font,size:11},color:P.gray}},
          y:{grid:{display:false},ticks:{font:{family:P.font,size:11},color:P.gray}}
        } }
    });
  }
}

/* ══════════════════════════════════════════
   FILTER HANDLERS — all update KPIs + charts
══════════════════════════════════════════ */

function updateUtilities() {
  const r = document.getElementById('util-region').value;
  const d = UD[r];
  const crewTarget = 80;
  const prevSaidi = {all:89.6, north:78.2, south:96.4, east:92.1, west:88.0}[r];
  document.getElementById('u-saidi').textContent = d.saidi;
  document.getElementById('u-saidi-c').textContent = `${Math.abs(((d.saidi-prevSaidi)/prevSaidi*100)).toFixed(1)}% ${d.saidi<prevSaidi?'better':'worse'} than last year`;
  document.getElementById('u-saidi-c').className = 'kpi-change '+(d.saidi<prevSaidi?'kpi-up':'kpi-down');
  document.getElementById('u-outages').textContent = d.outages;
  document.getElementById('u-outages-c').textContent = r==='all'?'4 fewer than prior period':r==='south'?'Highest in region — watch':r==='north'?'Lowest in region':'Near average';
  document.getElementById('u-outages-c').className = 'kpi-change '+(r==='south'?'kpi-down':'kpi-up');
  document.getElementById('u-crew').textContent = d.crew+'%';
  document.getElementById('u-crew-c').textContent = d.crew>=crewTarget?`${d.crew-crewTarget}% above target`:`${crewTarget-d.crew}% below ${crewTarget}% target`;
  document.getElementById('u-crew-c').className = 'kpi-change '+(d.crew>=crewTarget?'kpi-up':'kpi-down');
  document.getElementById('u-ahi').textContent = d.ahi;
  document.getElementById('u-ahi-c').textContent = d.ahi>=70?'Stable — above 70 threshold':'Below 70 — review required';
  document.getElementById('u-ahi-c').className = 'kpi-change '+(d.ahi>=70?'kpi-up':'kpi-down');
  initAllCharts();
}

function updateConstruction() {
  const proj = document.getElementById('constr-project').value;
  const d = CD[proj];
  document.getElementById('c-cpi').textContent  = d.cpi;
  document.getElementById('c-cpi-c').textContent = d.cpi>=1?'Under budget':'Over plan — watch';
  document.getElementById('c-cpi-c').className = 'kpi-change '+(d.cpi>=1?'kpi-up':'kpi-down');
  document.getElementById('c-spi').textContent  = d.spi;
  document.getElementById('c-spi-c').textContent = d.spi>=1?'Ahead of schedule':'Behind schedule';
  document.getElementById('c-spi-c').className = 'kpi-change '+(d.spi>=1?'kpi-up':'kpi-down');
  document.getElementById('c-cost').textContent = d.cost;
  document.getElementById('c-cost-c').textContent = d.costC;
  document.getElementById('c-rfi').textContent  = d.rfi;
  document.getElementById('c-rfi-c').textContent = d.rfi<=40?'Within target threshold':`${d.rfi-40} above 40-RFI threshold`;
  document.getElementById('c-rfi-c').className = 'kpi-change '+(d.rfi<=40?'kpi-up':'kpi-down');
  initAllCharts();
}

function updateHR() {
  const dept = document.getElementById('hr-dept').value;
  const deptKey = dept==='all'?'all':dept==='eng'?'eng':dept==='ops'?'ops':dept==='fin'?'fin':dept==='sales'?'sales':'all';
  const d = deptKey==='all' ? HR.all : HR[deptKey];
  const ttfTarget=35, attTarget=13;
  document.getElementById('hr-att').textContent   = d.att+'%';
  document.getElementById('hr-att-c').textContent = d.att<=attTarget?`Below ${attTarget}% target — strong`:`${(d.att-attTarget).toFixed(1)} pts above ${attTarget}% target`;
  document.getElementById('hr-att-c').className   = 'kpi-change '+(d.att<=attTarget?'kpi-up':'kpi-down');
  document.getElementById('hr-ttf').textContent   = d.ttf+'d';
  document.getElementById('hr-ttf-c').textContent = d.ttf<=ttfTarget?`Under ${ttfTarget}-day target`:`${d.ttf-ttfTarget} days above target`;
  document.getElementById('hr-ttf-c').className   = 'kpi-change '+(d.ttf<=ttfTarget?'kpi-up':'kpi-down');
  const hcPct = Math.round((d.hcN-d.open)/d.hcN*100);
  document.getElementById('hr-hc').textContent    = hcPct+'%';
  document.getElementById('hr-hc-c').textContent  = `${d.open} open roles`;
  document.getElementById('hr-hc-c').className    = 'kpi-change '+(d.open<=10?'kpi-up':'kpi-down');
  document.getElementById('hr-enps').textContent  = (d.enps>0?'+':'')+d.enps;
  document.getElementById('hr-enps-c').textContent= d.enps>=30?'Healthy engagement':d.enps>=20?'Stable':'At risk — intervention needed';
  document.getElementById('hr-enps-c').className  = 'kpi-change '+(d.enps>=20?'kpi-up':'kpi-down');
  initAllCharts();
}

function updateFinancial() {
  const unit = document.getElementById('fin-unit').value;
  const yr   = document.getElementById('fin-yr').value;
  const fdKey = unit==='all'?'all':unit==='ea'?'ea':unit==='we'?'we':unit==='pr'?'pr':'adv';
  const fd = FD[fdKey];
  const scale = yr==='24'?0.91:1;
  const totalRev = fd.actual.reduce((a,b)=>a+b,0)*scale;
  const totalBud = fd.budget.reduce((a,b)=>a+b,0)*scale;
  const vs = ((totalRev-totalBud)/totalBud*100).toFixed(1);
  document.getElementById('f-rev').textContent = '$'+totalRev.toFixed(1)+'M';
  document.getElementById('f-rev-c').textContent = `${Math.abs(vs)}% ${vs>=0?'ahead of':'behind'} budget`;
  document.getElementById('f-rev-c').className = 'kpi-change '+(vs>=0?'kpi-up':'kpi-down');
  document.getElementById('f-ebitda').textContent = fd.ebitda+'%';
  document.getElementById('f-ebitda-c').textContent = fd.ebitda>=22?'At or above 22% target':`${(22-fd.ebitda).toFixed(1)} pts below 22% target`;
  document.getElementById('f-ebitda-c').className = 'kpi-change '+(fd.ebitda>=22?'kpi-up':'kpi-down');
  document.getElementById('f-cash').textContent = fd.cash;
  document.getElementById('f-cash-c').textContent = fd.cashC;
  document.getElementById('f-pipe').textContent = fd.pipe;
  document.getElementById('f-pipe-c').textContent = fd.pipeC;
  initAllCharts();
}

function updateOps() {
  const fac = document.getElementById('ops-fac').value;
  const d = OD[fac];
  document.getElementById('o-oee').textContent    = d.oee+'%';
  document.getElementById('o-oee-c').textContent  = d.oee>=77?'Above 75% baseline':d.oee>=70?'Near baseline':'Below baseline — review';
  document.getElementById('o-oee-c').className    = 'kpi-change '+(d.oee>=74?'kpi-up':'kpi-down');
  document.getElementById('o-fpy').textContent    = d.fpy+'%';
  document.getElementById('o-fpy-c').textContent  = d.fpy>=97.5?'At or above 97.5% target':`${(97.5-d.fpy).toFixed(1)} pts below target`;
  document.getElementById('o-fpy-c').className    = 'kpi-change '+(d.fpy>=97.5?'kpi-up':'kpi-down');
  document.getElementById('o-otd').textContent    = d.otd+'%';
  document.getElementById('o-otd-c').textContent  = d.otd>=98?'At or above 98% target':`${(98-d.otd).toFixed(1)} pts below target`;
  document.getElementById('o-otd-c').className    = 'kpi-change '+(d.otd>=98?'kpi-up':'kpi-down');
  document.getElementById('o-units').textContent  = d.units;
  document.getElementById('o-units-c').textContent= d.unitsC;
  document.getElementById('o-units-c').className  = 'kpi-change '+(d.unitsC.includes('100')||d.unitsC.includes('102')||d.unitsC.includes('104')?'kpi-up':'kpi-down');
  initAllCharts();
}

function updateHealthcare() {
  const fac = document.getElementById('hc-fac').value;
  const d = HC[fac];
  const waitTarget=28, vacTarget=10, bedLow=85, bedHigh=90;
  document.getElementById('hc-wait').textContent    = d.wait+' min';
  document.getElementById('hc-wait-c').textContent  = d.wait<=waitTarget?`At or below ${waitTarget}-min target`:`${Math.round((d.wait-waitTarget)/waitTarget*100)}% above ${waitTarget}-min target`;
  document.getElementById('hc-wait-c').className    = 'kpi-change '+(d.wait<=waitTarget?'kpi-up':'kpi-down');
  document.getElementById('hc-vac').textContent     = d.vacRate+'%';
  document.getElementById('hc-vac-c').textContent   = d.vacC;
  document.getElementById('hc-vac-c').className     = 'kpi-change '+(d.vacRate<=vacTarget?'kpi-up':'kpi-down');
  document.getElementById('hc-bed').textContent     = d.bed+'%';
  document.getElementById('hc-bed-c').textContent   = d.bed>=bedLow&&d.bed<=bedHigh?'Within optimal 85–90% range':d.bed>bedHigh?'Above optimal — patient flow risk':'Below optimal range';
  document.getElementById('hc-bed-c').className     = 'kpi-change '+(d.bed>=bedLow&&d.bed<=bedHigh?'kpi-up':'kpi-down');
  document.getElementById('hc-hcahps').textContent  = d.hcahps;
  document.getElementById('hc-hcahps-c').textContent= d.hcahpsC;
  document.getElementById('hc-hcahps-c').className  = 'kpi-change '+(d.hcahps>='75th'||d.hcahps==='76th'||d.hcahps==='81st'?'kpi-up':'kpi-neutral');
  initAllCharts();
}

function updateHCDept() { updateHealthcare(); }

function submitForm() {
  document.getElementById('contact-form-wrap').style.display = 'none';
  document.getElementById('form-success').style.display = 'block';
}

/* ── SCROLL REVEAL ── */
function initReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => obs.observe(el));
}

/* ── ANIMATED STAT COUNTERS ── */
function animateCounter(el) {
  const target = parseFloat(el.dataset.target);
  const isInt = Number.isInteger(target);
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  const duration = 1400;
  const start = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const val = target * ease;
    el.textContent = prefix + (isInt ? Math.round(val) : val.toFixed(1)) + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function initCounters() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting && !e.target.dataset.counted) {
        e.target.dataset.counted = 'true';
        animateCounter(e.target);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.count-up').forEach(el => obs.observe(el));
}

document.addEventListener('DOMContentLoaded', () => {
  initReveal();
  initCounters();
});
</script>
