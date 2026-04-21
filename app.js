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

/* ── TOOLTIP POSITIONING (global body-level tooltip) ── */
(function() {
  // Create one global tooltip element appended to body - bypasses all overflow:hidden contexts
  const gt = document.createElement('div');
  gt.id = 'global-tooltip';
  gt.style.cssText = 'position:fixed;background:#0F1F2A;color:#fff;font-family:var(--font-body);font-size:12px;line-height:1.55;padding:10px 14px;border-radius:8px;opacity:0;pointer-events:none;transition:opacity 0.18s ease;z-index:999999;width:220px;text-align:left;box-shadow:0 4px 20px rgba(0,0,0,0.3);';
  // Arrow
  const arrow = document.createElement('div');
  arrow.style.cssText = 'position:absolute;top:100%;left:50%;transform:translateX(-50%);border:5px solid transparent;border-top-color:#0F1F2A;';
  gt.appendChild(arrow);
  document.body.appendChild(gt);

  document.addEventListener('mouseover', function(e) {
    const icon = e.target.closest('.tooltip-icon');
    if (!icon) return;
    const box = icon.parentElement.querySelector('.tooltip-box');
    if (!box) return;
    gt.childNodes[0].textContent = ''; // clear text
    // Get text content from the hidden .tooltip-box
    gt.insertBefore(document.createTextNode(box.textContent), arrow);
    const rect = icon.getBoundingClientRect();
    const left = Math.min(Math.max(rect.left + rect.width / 2, 120), window.innerWidth - 120);
    gt.style.left = left + 'px';
    gt.style.top  = (rect.top - 12) + 'px';
    gt.style.transform = 'translate(-50%, -100%)';
    gt.style.opacity = '1';
  });
  document.addEventListener('mouseout', function(e) {
    if (!e.target.closest('.tooltip-icon')) return;
    gt.style.opacity = '0';
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
   INIT ALL CHARTS — reads from window.ND
══════════════════════════════════════════ */
function initAllCharts() {
  const months12 = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const ND = window.ND;

  /* ─ UTILITIES ─ */
  if (document.getElementById('util-bar')) {
    const r = (document.getElementById('util-region')||{value:'all'}).value || 'all';
    const p = (document.getElementById('util-period')||{value:'ytd'}).value || 'ytd';
    const d = ND.util[r];
    const cfg = ND.util.periodCfg[p];
    const n = cfg.months;
    const durSlice = n===1 ? [d.dur[d.dur.length-1]] : n===3 ? d.dur.slice(-3) : d.dur;
    const lblSlice = n===1 ? [months12[11]] : n===3 ? months12.slice(-3) : months12;
    mk('util-bar', { type:'bar', data:{ labels:lblSlice, datasets:[{
      label:'Outage Duration (min)', data:durSlice,
      backgroundColor:P.green+'BB', borderRadius:5, borderSkipped:false
    }]}, options:{ responsive:true, maintainAspectRatio:true,
      plugins:{legend:{display:false},tooltip:ttOpts}, scales:scaleOpts }
    });
    mk('util-doughnut', { type:'doughnut',
      data:{ labels:['Weather','Equip. Failure','Planned Maint.','Third-Party','Other'],
        datasets:[{data:d.cause, backgroundColor:[P.navy,P.teal,P.green,P.lgreen,P.gray], borderWidth:0, hoverOffset:8}] },
      options:{ responsive:true, maintainAspectRatio:true, aspectRatio:1.4, cutout:'64%',
        plugins:{legend:{position:'bottom',labels:{font:{family:P.font,size:11},color:'#5A7A8E',padding:6,boxWidth:10,boxHeight:8}},tooltip:ttOpts} }
    });
    renderMiniUtil(r);
  }

  /* ─ CONSTRUCTION ─ */
  if (document.getElementById('constr-line')) {
    const proj  = (document.getElementById('constr-project')||{value:'all'}).value || 'all';
    const phase = (document.getElementById('constr-phase')||{value:'all'}).value || 'all';
    // Phase filter overrides project selection when set
    const key = phase !== 'all' ? phase : proj;
    const d = ND.constr[key] || ND.constr.all;
    mk('constr-line', { type:'line', data:{ labels:months12, datasets:[
      { label:'Planned ($M)', data:d.plan, borderColor:P.lgray, borderDash:[5,5], tension:0.3, pointRadius:2, borderWidth:1.5, fill:false, spanGaps:false },
      { label:'Actual ($M)',  data:d.act,  borderColor:P.amber, tension:0.4, pointRadius:3, pointBackgroundColor:P.amber, borderWidth:2, spanGaps:false,
        fill:{target:'-1',above:'rgba(240,165,0,0.07)',below:'rgba(192,57,43,0.06)'} }
    ]}, options:{responsive:true,plugins:{legend:{display:false},tooltip:ttOpts},scales:scaleOpts} });
    mk('constr-pie', { type:'doughnut',
      data:{ labels: d.coLabels || ['Design Errors','Owner Changes','Unforeseen Conditions','Weather','Scope Additions'],
        datasets:[{data:d.co, backgroundColor:['#1C3A4A',P.amber,'#E8C060','#E2D0A0',P.gray], borderWidth:0}] },
      options:{ responsive:true, maintainAspectRatio:true, aspectRatio:1.4, cutout:'60%',
        plugins:{legend:{position:'bottom',labels:{font:{family:P.font,size:11},color:'#5A7A8E',padding:6,boxWidth:10,boxHeight:8}},tooltip:ttOpts} }
    });
    renderMiniConstr(key, d);
  }

  /* ─ HR ─ */
  if (document.getElementById('hr-line')) {
    const dept = (document.getElementById('hr-dept')||{value:'all'}).value || 'all';
    const period = (document.getElementById('hr-period')||{value:'12'}).value || '12';
    const dKey = dept==='all'?'all':['eng','ops','fin','sales','corp'].includes(dept)?dept:'all';
    const d = ND.hr[dKey];
    const n = period==='3'?3:period==='6'?6:12;
    mk('hr-line', { type:'line', data:{ labels:months12.slice(12-n), datasets:[
      { label:'Plan',   data:d.hcPlan.slice(12-n), borderColor:P.lgray, borderDash:[5,5], tension:0.3, pointRadius:2, borderWidth:1.5, fill:false },
      { label:'Actual', data:d.hcAct.slice(12-n),  borderColor:P.purple, tension:0.3, pointRadius:3, pointBackgroundColor:P.purple, borderWidth:2, fill:false }
    ]}, options:{responsive:true,plugins:{legend:{display:false},tooltip:ttOpts},scales:scaleOpts} });
    const depts=['Engineering','Operations','Finance','Sales','Corporate'];
    const attVals=[ND.hr.eng.att,ND.hr.ops.att,ND.hr.fin.att,ND.hr.sales.att,ND.hr.corp.att];
    const dMap={eng:'Engineering',ops:'Operations',fin:'Finance',sales:'Sales',corp:'Corporate'};
    const colors=depts.map(lbl=>dKey==='all'?P.purple:lbl===dMap[dKey]?'#C0392B':P.purple+'44');
    mk('hr-bar', { type:'bar',
      data:{ labels:depts, datasets:[{label:'Attrition %', data:attVals, backgroundColor:colors, borderRadius:5}] },
      options:{ responsive:true, maintainAspectRatio:true, aspectRatio:1.6, indexAxis:'y',
        plugins:{legend:{display:false},tooltip:ttOpts},
        scales:{
          x:{grid:{color:'rgba(34,87,122,0.05)',drawBorder:false},ticks:{font:{family:P.font,size:11},color:P.gray}},
          y:{grid:{display:false},ticks:{font:{family:P.font,size:11},color:P.gray}}
        } }
    });
    renderMiniHR(dKey, d);
  }

  /* ─ FINANCIAL ─ */
  if (document.getElementById('fin-bar')) {
    const unit = (document.getElementById('fin-unit')||{value:'all'}).value || 'all';
    const yr   = (document.getElementById('fin-yr')||{value:'25'}).value || '25';
    const fdKey = unit==='all'?'all':unit==='ea'?'ea':unit==='we'?'we':unit==='pr'?'pr':'adv';
    const fd = ND.fin[fdKey];
    const pc = ND.fin.periodCfg[yr];
    const pdata = fd[pc.key];
    mk('fin-bar', { type:'bar', data:{ labels:pc.months, datasets:[
      { label:'Budget ($M)', data:pdata.budget, backgroundColor:P.lgray, borderRadius:4 },
      { label:'Actual ($M)', data:pdata.actual, backgroundColor:P.teal+'CC', borderRadius:4 }
    ]}, options:{responsive:true,plugins:{legend:{display:false},tooltip:ttOpts},scales:scaleOpts} });
    mk('fin-doughnut', { type:'doughnut',
      data:{ labels:fd.donutL, datasets:[{data:fd.donut, backgroundColor:[P.navy,P.teal,P.green,P.lgreen], borderWidth:0}] },
      options:{ responsive:true, maintainAspectRatio:true, aspectRatio:1.4, cutout:'60%',
        plugins:{legend:{position:'bottom',labels:{font:{family:P.font,size:11},color:'#5A7A8E',padding:6,boxWidth:10,boxHeight:8}},tooltip:ttOpts} }
    });
    renderMiniFin(fd, pdata);
  }

  /* ─ OPERATIONS ─ */
  if (document.getElementById('ops-line')) {
    const fac    = (document.getElementById('ops-fac')||{value:'all'}).value || 'all';
    const period = (document.getElementById('ops-period')||{value:'month'}).value || 'month';
    const d  = ND.ops[fac];
    const pd = ND.ops.getProductionData(fac, period);
    mk('ops-line', { type:'line', data:{ labels:pd.labels, datasets:[
      { label:'Plan',   data:pd.plan, borderColor:P.lgray, borderDash:[4,4], borderWidth:1.5, pointRadius:0, fill:false },
      { label:'Actual', data:pd.act,  borderColor:P.green, tension:0.4, borderWidth:2, pointRadius:0,
        fill:{target:'-1',above:'rgba(87,204,153,0.08)',below:'rgba(192,57,43,0.07)'} }
    ]}, options:{responsive:true,plugins:{legend:{display:false},tooltip:ttOpts},scales:scaleOpts} });
    mk('ops-bar', { type:'bar',
      data:{ labels:d.downLabels, datasets:[{label:'Downtime (hrs)', data:d.downVals,
        backgroundColor:[P.navy+'CC',P.teal+'CC',P.green+'CC',P.lgreen+'CC',P.gray+'CC','#CCC'], borderRadius:5}] },
      options:{responsive:true,plugins:{legend:{display:false},tooltip:ttOpts},scales:scaleOpts}
    });
    renderMiniOps(d);
  }

  /* ─ HEALTHCARE ─ */
  if (document.getElementById('hc-line')) {
    const fac  = (document.getElementById('hc-fac')||{value:'all'}).value || 'all';
    const dept = (document.getElementById('hc-dept')||{value:'all'}).value || 'all';
    const d = ND.hc[fac];
    const trend = ND.hc.getWaitTrend(fac);
    mk('hc-line', { type:'line', data:{ labels:trend.labels, datasets:[
      { label:'Target (28 min)', data:trend.target, borderColor:P.lgray, borderDash:[5,5], borderWidth:1.5, pointRadius:0, fill:false },
      { label:'Actual (min)',    data:trend.actual,  borderColor:P.rose,  tension:0.4, borderWidth:2, pointRadius:0,
        fill:{target:'-1',above:'rgba(224,92,138,0.08)',below:'rgba(56,163,165,0.06)'} }
    ]}, options:{responsive:true,plugins:{legend:{display:false},tooltip:ttOpts},scales:scaleOpts} });
    const dIdx = ND.hc.deptIdx[dept] ?? -1;
    const vacColors = d.unitVac.map((v,i)=> {
      if (dIdx>=0 && i!==dIdx) return P.rose+'44';
      return v>=18?'#C0392B':v>=14?P.rose:v>=10?P.rose+'99':'#E8A0B8';
    });
    mk('hc-bar', { type:'bar',
      data:{ labels:['ED','ICU','Med/Surg','Surgical','OB','Float'],
        datasets:[{label:'Vacancy %', data:d.unitVac, backgroundColor:vacColors, borderRadius:5}] },
      options:{ responsive:true, maintainAspectRatio:true, aspectRatio:1.6, indexAxis:'y',
        plugins:{legend:{display:false},tooltip:ttOpts},
        scales:{
          x:{grid:{color:'rgba(34,87,122,0.05)',drawBorder:false},ticks:{font:{family:P.font,size:11},color:P.gray}},
          y:{grid:{display:false},ticks:{font:{family:P.font,size:11},color:P.gray}}
        } }
    });
    renderMiniHC(d, fac);
  }
}

/* ══════════════════════════════════════════
   FILTER UPDATE HANDLERS
   Each reads filters → updates KPIs + calls initAllCharts
══════════════════════════════════════════ */

function updateUtilities() {
  const r = document.getElementById('util-region').value;
  const p = document.getElementById('util-period').value;
  const d = window.ND.util[r];
  const cfg = window.ND.util.periodCfg[p];
  const saidi = d[cfg.saidiKey];
  const prevSaidi = d.prev;
  const pctChg = Math.abs(((saidi-prevSaidi)/prevSaidi*100)).toFixed(1);
  document.getElementById('u-saidi').textContent = saidi;
  document.getElementById('u-saidi-c').textContent = `${pctChg}% ${saidi<prevSaidi?'better than':'worse than'} last year${cfg.suffix}`;
  document.getElementById('u-saidi-c').className = 'kpi-change '+(saidi<prevSaidi?'kpi-up':'kpi-down');
  document.getElementById('u-outages').textContent = d.outages;
  document.getElementById('u-outages-c').textContent = r==='all'?'4 fewer than prior period':r==='south'?'Highest in region — watch':r==='north'?'Lowest in region':'Near average';
  document.getElementById('u-outages-c').className = 'kpi-change '+(r==='south'?'kpi-down':'kpi-up');
  document.getElementById('u-crew').textContent = d.crew+'%';
  document.getElementById('u-crew-c').textContent = d.crew>=80?`${d.crew-80}% above 80% target`:`${80-d.crew}% below 80% target`;
  document.getElementById('u-crew-c').className = 'kpi-change '+(d.crew>=80?'kpi-up':'kpi-down');
  document.getElementById('u-ahi').textContent = d.ahi;
  document.getElementById('u-ahi-c').textContent = d.ahi>=70?'Stable — above 70 threshold':'Below 70 — review required';
  document.getElementById('u-ahi-c').className = 'kpi-change '+(d.ahi>=70?'kpi-up':'kpi-down');
  // Update insight bar
  const ins = document.querySelector('#dash-0 .db-insight-bar span');
  if (ins) ins.textContent = d.insight;
  initAllCharts();
}

function updateConstruction() {
  const proj  = document.getElementById('constr-project').value;
  const phase = document.getElementById('constr-phase').value;
  const key = phase !== 'all' ? phase : proj;
  const d = window.ND.constr[key] || window.ND.constr.all;
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
  const dKey = dept==='all'?'all':['eng','ops','fin','sales','corp'].includes(dept)?dept:'all';
  const d = window.ND.hr[dKey];
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
  const fd = window.ND.fin[fdKey];
  const pc = window.ND.fin.periodCfg[yr];
  const pdata = fd[pc.key];
  const totalRev = +(pdata.actual.reduce((a,b)=>a+b,0)).toFixed(1);
  const totalBud = +(pdata.budget.reduce((a,b)=>a+b,0)).toFixed(1);
  const vs = ((totalRev-totalBud)/totalBud*100).toFixed(1);
  document.getElementById('f-rev').textContent = '$'+totalRev+'M';
  document.getElementById('f-rev-c').textContent = `${Math.abs(vs)}% ${vs>=0?'ahead of':'behind'} budget`;
  document.getElementById('f-rev-c').className = 'kpi-change '+(vs>=0?'kpi-up':'kpi-down');
  const ebitda = fd.ebitda[pc.key] || fd.ebitda.fy25 || fd.ebitda;
  document.getElementById('f-ebitda').textContent = (typeof ebitda==='object'?fd.ebitda.fy25:ebitda)+'%';
  const em = typeof ebitda==='object'?fd.ebitda.fy25:ebitda;
  document.getElementById('f-ebitda-c').textContent = em>=22?'At or above 22% target':`${(22-em).toFixed(1)} pts below 22% target`;
  document.getElementById('f-ebitda-c').className = 'kpi-change '+(em>=22?'kpi-up':'kpi-down');
  document.getElementById('f-cash').textContent = fd.cash;
  document.getElementById('f-cash-c').textContent = fd.cashC;
  document.getElementById('f-pipe').textContent = fd.pipe;
  document.getElementById('f-pipe-c').textContent = fd.pipeC;
  // Update insight
  const ins = document.querySelector('#dash-3 .db-insight-bar span');
  if (ins && pc.insight) ins.textContent = pc.insight;
  initAllCharts();
}

function updateOps() {
  const fac = document.getElementById('ops-fac').value;
  const period = document.getElementById('ops-period').value;
  const d = window.ND.ops[fac];
  const periodLabel = {day:'Today',week:'This Week',month:'This Month'}[period]||'This Month';
  document.getElementById('o-oee').textContent    = d.oee+'%';
  document.getElementById('o-oee-c').textContent  = d.oee>=77?'Above 75% baseline':d.oee>=70?'Near baseline — monitor':'Below baseline — review';
  document.getElementById('o-oee-c').className    = 'kpi-change '+(d.oee>=74?'kpi-up':'kpi-down');
  document.getElementById('o-fpy').textContent    = d.fpy+'%';
  document.getElementById('o-fpy-c').textContent  = d.fpy>=97.5?'At or above 97.5% target':`${(97.5-d.fpy).toFixed(1)} pts below target`;
  document.getElementById('o-fpy-c').className    = 'kpi-change '+(d.fpy>=97.5?'kpi-up':'kpi-down');
  document.getElementById('o-otd').textContent    = d.otd+'%';
  document.getElementById('o-otd-c').textContent  = d.otd>=98?'At or above 98% target':`${(98-d.otd).toFixed(1)} pts below target`;
  document.getElementById('o-otd-c').className    = 'kpi-change '+(d.otd>=98?'kpi-up':'kpi-down');
  document.getElementById('o-units').textContent  = d.units;
  document.getElementById('o-units-c').textContent= `${periodLabel}: ${d.unitsC}`;
  document.getElementById('o-units-c').className  = 'kpi-change '+([102,104,100].some(n=>d.unitsC.includes(n+'%'))?'kpi-up':'kpi-down');
  initAllCharts();
}

function updateHealthcare() {
  const fac  = document.getElementById('hc-fac').value;
  const dept = document.getElementById('hc-dept').value;
  const d = window.ND.hc[fac];
  const waitTarget=28, bedLow=85, bedHigh=90;
  document.getElementById('hc-wait').textContent    = d.wait+' min';
  document.getElementById('hc-wait-c').textContent  = d.wait<=waitTarget?`At or below ${waitTarget}-min target`:`${Math.round((d.wait-waitTarget)/waitTarget*100)}% above ${waitTarget}-min target`;
  document.getElementById('hc-wait-c').className    = 'kpi-change '+(d.wait<=waitTarget?'kpi-up':'kpi-down');
  document.getElementById('hc-vac').textContent     = d.vacRate+'%';
  document.getElementById('hc-vac-c').textContent   = d.vacC;
  document.getElementById('hc-vac-c').className     = 'kpi-change '+(d.vacRate<=10?'kpi-up':'kpi-down');
  document.getElementById('hc-bed').textContent     = d.bed+'%';
  document.getElementById('hc-bed-c').textContent   = d.bed>=bedLow&&d.bed<=bedHigh?'Within optimal 85–90% range':d.bed>bedHigh?'Above optimal — patient flow risk':'Below optimal range';
  document.getElementById('hc-bed-c').className     = 'kpi-change '+(d.bed>=bedLow&&d.bed<=bedHigh?'kpi-up':'kpi-down');
  document.getElementById('hc-hcahps').textContent  = d.hcahps;
  document.getElementById('hc-hcahps-c').textContent= d.hcahpsC;
  const hNum = parseInt(d.hcahps);
  document.getElementById('hc-hcahps-c').className  = 'kpi-change '+(hNum>=75?'kpi-up':'kpi-neutral');
  // Update insight
  const ins = document.querySelector('#dash-5 .db-insight-bar span');
  if (ins && d.insight) ins.textContent = d.insight;
  initAllCharts();
}
function updateHCDept() { updateHealthcare(); }

/* ══════════════════════════════════════════
   MINI GRAPH RENDERERS
   Each function populates the mini-graph div
   below the right-side chart card.
══════════════════════════════════════════ */

/* ── UTILITIES MINI: District comparison table ── */
function renderMiniUtil(regionKey) {
  const el = document.getElementById('mini-util');
  if (!el) return;
  const rows = window.ND.util.districtSummary;
  const statusIcon = {green:'✓', yellow:'~', red:'↑'};
  const statusColor = {green:'#57CC99', yellow:'#F0A500', red:'#E05C8A'};
  el.innerHTML = `
    <div style="font-size:11px;font-weight:600;color:#9BB3C4;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em">District Benchmarks</div>
    ${rows.map(r=>`
      <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;border-bottom:1px solid #F2F5F8">
        <span style="font-size:12px;color:${regionKey===r.label.toLowerCase()||regionKey==='all'?'#22577A':'#9BB3C4'};font-weight:${regionKey===r.label.toLowerCase()?'600':'400'}">${r.label}</span>
        <span style="font-size:12px;font-weight:500;color:#22577A">${r.saidi}</span>
        <span style="font-size:12px;color:${statusColor[r.status]};font-weight:600">${statusIcon[r.status]} ${r.saidi<90?'On target':'Watch'}</span>
      </div>`).join('')}
    <div style="font-size:10px;color:#C5D4DF;margin-top:5px">Benchmark: SAIDI &lt; 90 min/year</div>`;
}

/* ── CONSTRUCTION MINI: Change order $ breakdown ── */
function renderMiniConstr(projKey, d) {
  const el = document.getElementById('mini-constr');
  if (!el) return;
  const labels = d.coLabels || ['Design Errors','Owner Changes','Unforeseen','Weather','Scope Additions'];
  const amounts = window.ND.constr.coAmounts(projKey);
  // Show top 3 categories
  const sorted = labels.map((l,i)=>({l,pct:d.co[i],amt:amounts[i]})).sort((a,b)=>b.pct-a.pct).slice(0,3);
  el.innerHTML = `
    <div style="font-size:11px;font-weight:600;color:#9BB3C4;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em">Top Change Order Drivers</div>
    ${sorted.map(r=>`
      <div style="margin-bottom:7px">
        <div style="display:flex;justify-content:space-between;margin-bottom:2px">
          <span style="font-size:11px;color:#22577A">${r.l}</span>
          <span style="font-size:11px;font-weight:600;color:#F0A500">$${r.amt}M (${r.pct}%)</span>
        </div>
        <div style="height:4px;background:#F2F5F8;border-radius:2px">
          <div style="height:4px;background:#F0A500;border-radius:2px;width:${r.pct}%"></div>
        </div>
      </div>`).join('')}`;
}

/* ── HR MINI: Attrition trend sparkline (6 months) ── */
function renderMiniHR(dKey, d) {
  const el = document.getElementById('mini-hr');
  if (!el) return;
  // Sparkline using canvas
  el.innerHTML = `
    <div style="font-size:11px;font-weight:600;color:#9BB3C4;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em">Attrition Trend (6-month)</div>
    <canvas id="mini-hr-canvas" height="52"></canvas>`;
  const months6 = ['Jul','Aug','Sep','Oct','Nov','Dec'];
  const trend = d.attTrend || [d.att,d.att,d.att,d.att,d.att,d.att];
  const last = trend[trend.length-1];
  const first = trend[0];
  const direction = last > first ? 'kpi-down' : 'kpi-up';
  mk('mini-hr-canvas', { type:'line', data:{ labels:months6, datasets:[{
    data:trend, borderColor:'#9B72CF', tension:0.4, borderWidth:2,
    pointRadius:2, pointBackgroundColor:'#9B72CF', fill:true,
    backgroundColor:'rgba(155,114,207,0.08)'
  }]}, options:{ responsive:true, animation:false,
    plugins:{legend:{display:false},tooltip:{...ttOpts,padding:6}},
    scales:{
      x:{grid:{display:false},ticks:{font:{family:P.font,size:9},color:P.gray}},
      y:{grid:{color:'rgba(34,87,122,0.04)'},ticks:{font:{family:P.font,size:9},color:P.gray},
         suggestedMin:Math.min(...trend)-2, suggestedMax:Math.max(...trend)+2}
    }}
  });
  const arrow = last>first?'↑':'↓';
  const diffEl = document.createElement('div');
  diffEl.style.cssText='font-size:11px;margin-top:4px;color:'+(last>first?'#E05C8A':'#57CC99');
  diffEl.textContent=`${arrow} ${Math.abs(last-first).toFixed(1)} pts over 6 months`;
  el.appendChild(diffEl);
}

/* ── FINANCIAL MINI: Segment breakdown table ── */
function renderMiniFin(fd, pdata) {
  const el = document.getElementById('mini-fin');
  if (!el) return;
  const total = pdata.actual.reduce((a,b)=>a+b,0);
  const rows = fd.donutL.map((l,i)=>({ l, pct:fd.donut[i], est:+(total*fd.donut[i]/100).toFixed(1) }));
  const colors = ['#22577A','#38A3A5','#57CC99','#80ED99'];
  el.innerHTML = `
    <div style="font-size:11px;font-weight:600;color:#9BB3C4;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em">Revenue by Segment</div>
    ${rows.map((r,i)=>`
      <div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid #F2F5F8">
        <div style="width:8px;height:8px;border-radius:50%;background:${colors[i]};flex-shrink:0"></div>
        <span style="font-size:11px;color:#22577A;flex:1">${r.l}</span>
        <span style="font-size:11px;font-weight:500;color:#22577A">$${r.est}M</span>
        <span style="font-size:11px;color:#9BB3C4">${r.pct}%</span>
      </div>`).join('')}`;
}

/* ── OPERATIONS MINI: Planned vs unplanned downtime chips ── */
function renderMiniOps(d) {
  const el = document.getElementById('mini-ops');
  if (!el) return;
  const planned   = d.downVals[2] || 0;  // Planned Maint.
  const unplanned = d.downVals[0] + (d.downVals[4]||0);  // Equip Failure + Quality Hold
  const change    = d.downVals[1] || 0;  // Changeover
  const total     = d.downVals.reduce((a,b)=>a+b,0);
  el.innerHTML = `
    <div style="font-size:11px;font-weight:600;color:#9BB3C4;margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em">Downtime Breakdown</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">
      <div style="background:#F2F5F8;border-radius:6px;padding:8px 6px;text-align:center">
        <div style="font-size:14px;font-weight:700;color:#57CC99">${planned.toFixed(1)}h</div>
        <div style="font-size:9px;color:#9BB3C4;margin-top:2px">Planned</div>
      </div>
      <div style="background:#FFF0F0;border-radius:6px;padding:8px 6px;text-align:center">
        <div style="font-size:14px;font-weight:700;color:#E05C8A">${unplanned.toFixed(1)}h</div>
        <div style="font-size:9px;color:#9BB3C4;margin-top:2px">Unplanned</div>
      </div>
      <div style="background:#F2F5F8;border-radius:6px;padding:8px 6px;text-align:center">
        <div style="font-size:14px;font-weight:700;color:#22577A">${total.toFixed(1)}h</div>
        <div style="font-size:9px;color:#9BB3C4;margin-top:2px">Total</div>
      </div>
    </div>
    <div style="font-size:10px;color:#C5D4DF;margin-top:6px">Planned maint. ${(planned/total*100).toFixed(0)}% of total downtime — target &gt;60%</div>`;
}

/* ── HEALTHCARE MINI: Top-vacancy units + FTE impact ── */
function renderMiniHC(d, facKey) {
  const el = document.getElementById('mini-hc');
  if (!el) return;
  const units = ['ED','ICU','Med/Surg','Surgical','OB','Float'];
  const baseHC = {all:280, main:340, north:210, clinics:120}[facKey]||280;
  const sorted = units.map((u,i)=>({u,v:d.unitVac[i]})).sort((a,b)=>b.v-a.v).slice(0,3);
  el.innerHTML = `
    <div style="font-size:11px;font-weight:600;color:#9BB3C4;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em">Highest Vacancy Units</div>
    ${sorted.map(r=>{
      const openFTE = Math.round(baseHC * r.v/100 / units.length);
      const travelCost = openFTE * 8400;
      return `<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;border-bottom:1px solid #F2F5F8">
        <span style="font-size:12px;color:#22577A;font-weight:500">${r.u}</span>
        <span style="font-size:12px;font-weight:600;color:${r.v>=18?'#C0392B':r.v>=14?'#E05C8A':'#9BB3C4'}">${r.v}%</span>
        <span style="font-size:10px;color:#9BB3C4">~$${(travelCost/1000).toFixed(0)}K/mo</span>
      </div>`;}).join('')}
    <div style="font-size:10px;color:#C5D4DF;margin-top:5px">Est. travel staff cost per unit/month</div>`;
}
function submitForm() {
  const C = window.NUMARKET_CONFIG || {};
  const wrap = document.getElementById('contact-form-wrap');
  const success = document.getElementById('form-success');
  const errDiv = document.getElementById('form-error');
  const btn = document.getElementById('submit-btn');

  // ── Validation ──
  const required = [
    { id: 'f-firstname', label: 'First Name' },
    { id: 'f-lastname',  label: 'Last Name' },
    { id: 'f-email',     label: 'Work Email' },
    { id: 'f-company',   label: 'Company' },
  ];
  const missing = [];
  required.forEach(f => {
    const el = document.getElementById(f.id);
    if (el) {
      const val = el.value.trim();
      if (!val) { missing.push(f.label); el.style.borderColor = '#EF4444'; }
      else el.style.borderColor = '';
    }
  });
  // Email format check
  const emailEl = document.getElementById('f-email');
  if (emailEl && emailEl.value && !/^[^@]+@[^@]+\.[^@]+$/.test(emailEl.value.trim())) {
    missing.push('Valid email address');
    emailEl.style.borderColor = '#EF4444';
  }
  if (missing.length) {
    errDiv.textContent = 'Please complete: ' + missing.join(', ');
    errDiv.style.display = 'block';
    wrap.querySelector('#f-firstname')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  errDiv.style.display = 'none';

  // ── Gather fields ──
  const fields = {};
  wrap.querySelectorAll('.form-group').forEach(g => {
    const lbl = g.querySelector('label');
    const inp = g.querySelector('input,select,textarea');
    if (lbl && inp) fields[lbl.textContent.replace('*','').trim()] = inp.value;
  });

  btn.textContent = 'Sending…'; btn.disabled = true;
  const scriptUrl = C.googleScriptUrl;
  if (scriptUrl) {
    const body = new URLSearchParams(fields);
    fetch(scriptUrl, { method: 'POST', mode: 'no-cors', body })
      .then(() => { wrap.style.display='none'; success.style.display='flex'; document.getElementById('form-header').style.display='none'; })
      .catch(() => { btn.textContent='Send Request →'; btn.disabled=false; errDiv.textContent='Network error — please email us directly.'; errDiv.style.display='block'; });
  } else {
    wrap.style.display='none'; success.style.display='flex'; document.getElementById('form-header').style.display='none';
  }
}

function resetForm() {
  const wrap = document.getElementById('contact-form-wrap');
  const success = document.getElementById('form-success');
  const errDiv = document.getElementById('form-error');
  const btn = document.getElementById('submit-btn');
  // Clear all inputs
  wrap.querySelectorAll('input,select,textarea').forEach(el => {
    el.value = el.tagName === 'SELECT' ? '' : '';
    el.style.borderColor = '';
  });
  if (errDiv) { errDiv.style.display='none'; errDiv.textContent=''; }
  if (btn) { btn.textContent='Send Request →'; btn.disabled=false; }
  wrap.style.display='block';
  success.style.display='none';
  document.getElementById('form-header').style.display='';
}


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

/* ── CONFIG APPLICATION ── */
document.addEventListener('DOMContentLoaded', function() {
  const C = window.NUMARKET_CONFIG || {};
  // Apply email/phone everywhere they appear as data-config targets
  document.querySelectorAll('[data-cfg-email]').forEach(el => el.textContent = C.email || el.textContent);
  document.querySelectorAll('[data-cfg-phone]').forEach(el => el.textContent = C.phone || el.textContent);
  document.querySelectorAll('[data-cfg-response]').forEach(el => el.textContent = C.responseTime || el.textContent);
  // Location block
  const locBlock = document.getElementById('location-block');
  if (locBlock) locBlock.style.display = (C.showLocation) ? '' : 'none';
  if (C.showLocation && C.location) {
    const ls = document.getElementById('cfg-location-street');
    const lc = document.getElementById('cfg-location-city');
    if (ls) ls.textContent = C.location.street;
    if (lc) lc.textContent = C.location.city;
  }
  // Social links
  ['linkedin','twitter'].forEach(s => {
    const el = document.getElementById('social-' + s);
    if (el) el.style.display = (C[s]) ? '' : 'none';
    if (el && C[s]) el.href = C[s];
  });
  // GA injection
  if (C.gaId) {
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + C.gaId;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date()); gtag('config', C.gaId);
  }
});
