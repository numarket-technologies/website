/* ============================================================
   numarket DATA LAYER  —  data.js
   Single source of truth for all dashboard data.
   All chart functions in app.js read from window.ND.
   To update a number: change it here. Nothing else needed.
   ============================================================ */

window.ND = {};

/* ══════════════════════════════════════════════════════
   UTILITIES
   • region: all | north | south | east | west
   • period: 30 | 90 | ytd
   dur[] = monthly outage duration minutes (12 months)
   cause[] = % breakdown by cause [Weather, Equip, Maint, 3rd-Party, Other]
   saidi = annual SAIDI for that region
   prev  = prior-year SAIDI for % change label
══════════════════════════════════════════════════════ */
ND.util = {
  north: {
    dur:   [180,140,160,130,100, 85,105,115,110, 85, 95,140],
    cause: [22,20,35,14, 9],
    saidi: 72.4, prev: 78.2, outages: 6, crew: 83, ahi: 76.2,
    // 6-month SAIDI sub-periods derived from dur slices
    saidi30: 70.2, saidi90: 69.8,
    insight: 'North District leads on reliability (SAIDI 72.4). Crew utilization at 83% is above target — well-positioned for summer peak load.'
  },
  south: {
    dur:   [280,210,240,200,145,135,155,175,165,130,140,210],
    cause: [42,32,12, 8, 6],
    saidi: 91.8, prev: 96.4, outages: 9, crew: 71, ahi: 68.4,
    saidi30: 88.4, saidi90: 86.1,
    insight: 'South District SAIDI (91.8) is 9% above the regional average. Crew utilization at 71% — investigate scheduling inefficiencies before summer peak.'
  },
  east: {
    dur:   [220,170,190,160,115,105,125,145,135,105,115,170],
    cause: [35,28,18,12, 7],
    saidi: 88.5, prev: 92.1, outages: 5, crew: 79, ahi: 72.1,
    saidi30: 85.2, saidi90: 84.8,
    insight: 'East District improving — SAIDI down 3.9 pts year-over-year. Equipment failure cause share (28%) warrants a targeted PM review before winter.'
  },
  west: {
    dur:   [140,120,120, 90, 70, 65, 75, 85, 80, 60, 70, 90],
    cause: [28,25,24,14, 9],
    saidi: 84.2, prev: 88.0, outages: 3, crew: 80, ahi: 73.8,
    saidi30: 82.1, saidi90: 81.4,
    insight: 'West District best-in-portfolio for outage frequency (3 events). Planned maintenance share at 24% is highest — indicating proactive asset care.'
  }
};
// Compute ALL from parts
(function(){
  const r = ND.util;
  r.all = {
    dur:   r.north.dur.map((_,i)=>r.north.dur[i]+r.south.dur[i]+r.east.dur[i]+r.west.dur[i]),
    cause: [34,28,18,12,8],
    saidi: +((r.north.saidi+r.south.saidi+r.east.saidi+r.west.saidi)/4).toFixed(1),
    prev:  +((r.north.prev +r.south.prev +r.east.prev +r.west.prev )/4).toFixed(1),
    outages: r.north.outages+r.south.outages+r.east.outages+r.west.outages,
    crew:  Math.round((r.north.crew+r.south.crew+r.east.crew+r.west.crew)/4),
    ahi:   +((r.north.ahi+r.south.ahi+r.east.ahi+r.west.ahi)/4).toFixed(1),
    saidi30: +((r.north.saidi30+r.south.saidi30+r.east.saidi30+r.west.saidi30)/4).toFixed(1),
    saidi90: +((r.north.saidi90+r.south.saidi90+r.east.saidi90+r.west.saidi90)/4).toFixed(1),
    insight: 'South District SAIDI (91.8) is 9% above regional average. Crew utilization there dropped to 71% — investigate scheduling before summer peak load period.'
  };
})();

/* ── Utility period multipliers (applied to dur data and SAIDI) ── */
ND.util.periodCfg = {
  '30':  { months: 1,  label: 'Last 30 Days',  saidiKey: 'saidi30', suffix: ' (30-day)' },
  '90':  { months: 3,  label: 'Last 90 Days',  saidiKey: 'saidi90', suffix: ' (90-day)' },
  'ytd': { months: 12, label: 'Year to Date',  saidiKey: 'saidi',   suffix: ' (YTD)' }
};

/* ── Utility mini-graph: district comparison table data ── */
ND.util.districtSummary = [
  { label:'North', saidi:72.4, outages:6,  crew:83, status:'green' },
  { label:'South', saidi:91.8, outages:9,  crew:71, status:'red'   },
  { label:'East',  saidi:88.5, outages:5,  crew:79, status:'yellow'},
  { label:'West',  saidi:84.2, outages:3,  crew:80, status:'green' }
];


/* ══════════════════════════════════════════════════════
   CONSTRUCTION
   • project: all | terminal | bridge | dc | sub
   • phase:   all | design | construction | closeout
   plan/act[] = 12-month cumulative spend ($M)
   co[]       = change order % by category
══════════════════════════════════════════════════════ */
ND.constr = {
  terminal: {
    plan:[4.8,6.0,6.8,7.6,8.0,9.2,10.0,10.7,11.5,12.2,13.0,13.8],
    act: [4.7,5.9,7.0,8.0,8.4,9.4,10.3,11.1,11.9,12.8,13.6,null],
    cpi:1.01, spi:1.05, cost:'$53M',   costC:'On track', rfi:12,
    co:[8,26,22,14,30], phase:'construction',
    coLabels:['Design Errors','Owner Changes','Unforeseen Conditions','Weather','Scope Additions']
  },
  bridge: {
    plan:[1.8,2.3,2.7,3.0,3.2,3.6,4.0,4.2,4.5,4.8,5.1,5.4],
    act: [1.8,2.3,2.8,3.2,3.4,3.8,4.2,4.5,4.8,5.2,5.6,null],
    cpi:0.94, spi:0.97, cost:'$22M',   costC:'$1.4M at risk', rfi:19,
    co:[41,18,20,14, 7], phase:'construction',
    coLabels:['Design Errors','Owner Changes','Unforeseen Conditions','Weather','Scope Additions']
  },
  dc: {
    plan:[0.8,1.2,1.5,1.8,2.1,2.4,2.7,2.9,3.2,3.4,3.7,3.9],
    act: [0.7,1.1,1.4,1.7,1.9,2.2,2.5,null,null,null,null,null],
    cpi:1.03, spi:1.08, cost:'$9M',    costC:'On track', rfi:8,
    co:[22,28,25,18, 7], phase:'design',
    coLabels:['Design Errors','Owner Changes','Unforeseen Conditions','Weather','Scope Additions']
  },
  sub: {
    plan:[0.8,0.9,1.3,1.8,2.0,2.2,2.4,null,null,null,null,null],
    act: [0.8,0.9,1.4,2.0,2.2,2.4,2.6, 2.7,null,null,null,null],
    cpi:0.96, spi:0.99, cost:'$11.4M', costC:'$400K over budget', rfi:8,
    co:[19,22,31,20, 8], phase:'closeout',
    coLabels:['Design Errors','Owner Changes','Unforeseen Conditions','Weather','Scope Additions']
  }
};
(function(){
  const c = ND.constr;
  c.all = {
    plan: Array.from({length:12},(_,i)=>{
      const v=[c.terminal.plan[i],c.bridge.plan[i],c.dc.plan[i],c.sub.plan[i]].filter(x=>x!=null);
      return v.length ? +v.reduce((a,b)=>a+b,0).toFixed(1) : null;
    }),
    act: Array.from({length:12},(_,i)=>{
      const v=[c.terminal.act[i],c.bridge.act[i],c.dc.act[i],c.sub.act[i]].filter(x=>x!=null);
      return v.length ? +v.reduce((a,b)=>a+b,0).toFixed(1) : null;
    }),
    cpi:0.96, spi:1.03, cost:'$148M', costC:'$3.2M above baseline', rfi:47,
    co:[31,26,19,14,10], phase:'all',
    coLabels:['Design Errors','Owner Changes','Unforeseen Conditions','Weather','Scope Additions']
  };
  // Phase aggregates — design=DC, construction=terminal+bridge, closeout=sub
  c.design = c.dc;
  c.construction = {
    plan: Array.from({length:12},(_,i)=>{
      const v=[c.terminal.plan[i],c.bridge.plan[i]].filter(x=>x!=null);
      return v.length?+v.reduce((a,b)=>a+b,0).toFixed(1):null;
    }),
    act: Array.from({length:12},(_,i)=>{
      const v=[c.terminal.act[i],c.bridge.act[i]].filter(x=>x!=null);
      return v.length?+v.reduce((a,b)=>a+b,0).toFixed(1):null;
    }),
    cpi:0.97, spi:1.01, cost:'$75M', costC:'$1.4M above plan', rfi:31,
    co:[22,23,21,14,20],
    coLabels:['Design Errors','Owner Changes','Unforeseen Conditions','Weather','Scope Additions']
  };
  c.closeout = c.sub;
})();

/* ── Construction mini: change order $ estimates ── */
// co amounts derived from cost × co% ÷ 100
ND.constr.coAmounts = function(projKey) {
  const d = ND.constr[projKey] || ND.constr.all;
  const totalCost = parseFloat((d.cost||'0').replace(/[$M]/g,''));
  const pct = d.co;
  return pct.map(p => +(totalCost * p / 100).toFixed(1));
};


/* ══════════════════════════════════════════════════════
   HR ANALYTICS
   • dept: all | eng | ops | fin | sales | corp
   • period: 3 | 6 | 12 months
   hcPlan/hcAct[] = 12-month headcount trend
   att  = voluntary attrition rate %
   attTrend[] = 6-month attrition by month (for sparkline)
══════════════════════════════════════════════════════ */
ND.hr = {
  eng:   {
    hcPlan:[296,298,300,302,304,306,308,309,310,311,312,312],
    hcAct: [290,293,295,297,299,302,304,306,308,309,311,312],
    att:11.4, ttf:42, hcN:312, open:14, enps:41, tenure:4.2,
    attTrend:[13.2,12.8,12.4,12.1,11.8,11.4]  // last 6 months, trending down
  },
  ops: {
    hcPlan:[420,421,422,423,424,425,426,427,428,428,428,428],
    hcAct: [412,414,416,418,420,421,423,424,425,426,427,428],
    att:16.2, ttf:31, hcN:428, open:8, enps:28, tenure:3.1,
    attTrend:[15.4,15.8,16.1,16.4,16.0,16.2]  // volatile, slightly rising
  },
  fin: {
    hcPlan:[ 90, 90, 91, 91, 92, 92, 92, 93, 93, 93, 94, 94],
    hcAct:  [ 88, 89, 90, 90, 91, 91, 92, 92, 93, 93, 94, 94],
    att:9.8, ttf:36, hcN:94, open:3, enps:45, tenure:5.7,
    attTrend:[11.2,10.8,10.4,10.1,9.9,9.8]    // steadily improving
  },
  sales: {
    hcPlan:[180,180,181,182,183,184,184,185,185,186,186,186],
    hcAct: [175,176,177,178,179,180,181,182,183,184,185,186],
    att:22.1, ttf:44, hcN:186, open:11, enps:12, tenure:2.4,
    attTrend:[18.8,19.4,20.2,21.0,21.6,22.1]  // clearly worsening — Q3 departure spike
  },
  corp: {
    hcPlan:[214,215,216,217,218,218,219,219,220,220,220,220],
    hcAct: [213,214,214,215,215,214,216,214,215,216,217,220],
    att:12.3, ttf:28, hcN:220, open:2, enps:38, tenure:6.1,
    attTrend:[12.8,12.6,12.4,12.2,12.4,12.3]  // stable
  }
};
(function(){
  const h = ND.hr;
  const keys=['eng','ops','fin','sales','corp'];
  const totHC = keys.reduce((s,k)=>s+h[k].hcN, 0);
  h.all = {
    hcPlan: h.eng.hcPlan.map((_,i)=>keys.reduce((s,k)=>s+h[k].hcPlan[i],0)),
    hcAct:  h.eng.hcAct.map((_,i)=>keys.reduce((s,k)=>s+h[k].hcAct[i],0)),
    att: +(keys.reduce((s,k)=>s+h[k].att*h[k].hcN,0)/totHC).toFixed(1),
    ttf: Math.round(keys.reduce((s,k)=>s+h[k].ttf,0)/keys.length),
    hcN: totHC,
    open: keys.reduce((s,k)=>s+h[k].open,0),
    enps: Math.round(keys.reduce((s,k)=>s+h[k].enps,0)/keys.length),
    tenure: +(keys.reduce((s,k)=>s+h[k].tenure,0)/keys.length).toFixed(1),
    attTrend:[14.2,14.4,14.8,15.0,14.6,14.2]  // overall org trend
  };
})();


/* ══════════════════════════════════════════════════════
   FINANCIAL PERFORMANCE
   • unit: all | ea | we | pr | adv
   • yr: 25 | q1 | q2 | 24
   budget/actual[] = monthly revenue $M (6 months for FY25)
   For Q1 and Q2, specific 3-month slices with real variances.
   For FY24, full 12-month historical data.
══════════════════════════════════════════════════════ */
ND.fin = {
  ea: {
    // FY25 first 6 months
    fy25: { budget:[1.40,1.44,1.52,1.48,1.56,1.60], actual:[1.48,1.55,1.50,1.58,1.62,1.68] },
    // Q1 — strong start, services ahead
    q1:   { budget:[1.40,1.44,1.52], actual:[1.48,1.55,1.50] },
    // Q2 — accelerated, pipeline converting
    q2:   { budget:[1.48,1.56,1.60], actual:[1.58,1.62,1.68] },
    // FY24 full year (lower base, pre-expansion)
    fy24: { budget:[1.22,1.24,1.28,1.30,1.32,1.36,1.38,1.40,1.42,1.44,1.45,1.46],
            actual:[1.18,1.22,1.26,1.28,1.32,1.34,1.36,1.38,1.40,1.42,1.43,1.44] },
    ebitda:{fy25:22.4, q1:21.8, q2:23.1, fy24:20.2},
    cash:'$2.1M', cashC:'On plan', pipe:'3.8×', pipeC:'Strong coverage',
    donut:[58,22,12,8], donutL:['Core Services','Managed Svcs','Advisory','Other']
  },
  we: {
    fy25: { budget:[1.24,1.28,1.36,1.32,1.40,1.44], actual:[1.32,1.38,1.36,1.48,1.44,1.52] },
    q1:   { budget:[1.24,1.28,1.36], actual:[1.32,1.38,1.36] },
    q2:   { budget:[1.32,1.40,1.44], actual:[1.48,1.44,1.52] },
    fy24: { budget:[1.08,1.10,1.14,1.16,1.18,1.20,1.22,1.24,1.26,1.28,1.30,1.32],
            actual:[1.06,1.08,1.12,1.14,1.16,1.18,1.20,1.22,1.24,1.26,1.28,1.30] },
    ebitda:{fy25:21.1, q1:20.4, q2:21.8, fy24:18.8},
    cash:'$2.4M', cashC:'Strong', pipe:'4.1×', pipeC:'Best in portfolio',
    donut:[62,18,14,6], donutL:['Core Services','Managed Svcs','Projects','Other']
  },
  pr: {
    fy25: { budget:[0.72,0.76,0.80,0.76,0.84,0.88], actual:[0.74,0.76,0.76,0.82,0.80,0.84] },
    q1:   { budget:[0.72,0.76,0.80], actual:[0.74,0.76,0.76] },
    q2:   { budget:[0.76,0.84,0.88], actual:[0.82,0.80,0.84] },
    fy24: { budget:[0.62,0.64,0.66,0.68,0.70,0.72,0.74,0.76,0.78,0.80,0.82,0.84],
            actual:[0.58,0.60,0.62,0.64,0.66,0.68,0.70,0.72,0.74,0.76,0.78,0.80] },
    ebitda:{fy25:14.2, q1:13.8, q2:14.6, fy24:12.1},
    cash:'$1.1M', cashC:'Tight — 48 days', pipe:'2.4×', pipeC:'Below 3.0× threshold',
    donut:[44,31,16,9], donutL:['Product A','Product B','Product C','Other']
  },
  adv: {
    fy25: { budget:[0.44,0.42,0.46,0.44,0.44,0.48], actual:[0.36,0.40,0.38,0.44,0.36,0.48] },
    q1:   { budget:[0.44,0.42,0.46], actual:[0.36,0.40,0.38] },
    q2:   { budget:[0.44,0.44,0.48], actual:[0.44,0.36,0.48] },
    fy24: { budget:[0.38,0.38,0.40,0.40,0.42,0.42,0.44,0.44,0.46,0.46,0.48,0.48],
            actual:[0.34,0.36,0.38,0.38,0.40,0.40,0.42,0.42,0.44,0.44,0.46,0.46] },
    ebitda:{fy25:31.8, q1:30.2, q2:33.4, fy24:28.6},
    cash:'$0.6M', cashC:'Conservative', pipe:'2.8×', pipeC:'Below 3.0× target',
    donut:[50,30,12,8], donutL:['Strategy','Transactions','Research','Other']
  }
};
(function(){
  const f = ND.fin;
  const keys=['ea','we','pr','adv'];
  const sum6 = arr => arr.reduce((a,b)=>a+b,0);
  const sum12 = arr => arr.reduce((a,b)=>a+b,0);
  // FY25: sum all BU monthly arrays
  const fy25b = f.ea.fy25.budget.map((_,i)=>+(keys.reduce((s,k)=>s+f[k].fy25.budget[i],0)).toFixed(2));
  const fy25a = f.ea.fy25.actual.map((_,i)=>+(keys.reduce((s,k)=>s+f[k].fy25.actual[i],0)).toFixed(2));
  const q1b   = f.ea.q1.budget.map((_,i)=>+(keys.reduce((s,k)=>s+f[k].q1.budget[i],0)).toFixed(2));
  const q1a   = f.ea.q1.actual.map((_,i)=>+(keys.reduce((s,k)=>s+f[k].q1.actual[i],0)).toFixed(2));
  const q2b   = f.ea.q2.budget.map((_,i)=>+(keys.reduce((s,k)=>s+f[k].q2.budget[i],0)).toFixed(2));
  const q2a   = f.ea.q2.actual.map((_,i)=>+(keys.reduce((s,k)=>s+f[k].q2.actual[i],0)).toFixed(2));
  const fy24b = f.ea.fy24.budget.map((_,i)=>+(keys.reduce((s,k)=>s+f[k].fy24.budget[i],0)).toFixed(2));
  const fy24a = f.ea.fy24.actual.map((_,i)=>+(keys.reduce((s,k)=>s+f[k].fy24.actual[i],0)).toFixed(2));
  f.all = {
    fy25: { budget:fy25b, actual:fy25a },
    q1:   { budget:q1b,   actual:q1a },
    q2:   { budget:q2b,   actual:q2a },
    fy24: { budget:fy24b, actual:fy24a },
    ebitda:{ fy25:19.8, q1:19.2, q2:20.6, fy24:17.8 },
    cash:'$6.2M', cashC:'82 days reserve', pipe:'3.4×', pipeC:'Healthy coverage ratio',
    donut:[37,34,19,10], donutL:['Services East','Services West','Products','Advisory']
  };
})();

/* ── Financial period config ── */
ND.fin.periodCfg = {
  '25':  { label:'FY 2025 (YTD)', key:'fy25',
           months:['Jan','Feb','Mar','Apr','May','Jun'],
           insight: 'Revenue tracking 8.4% ahead of budget but EBITDA margin (19.8%) is 2.2 pts below target. Gap is in Products Division — gross margin compression needs Q3 investigation.' },
  'q1':  { label:'Q1 2025', key:'q1',
           months:['Jan','Feb','Mar'],
           insight: 'Q1 closed 3.4% above plan. Services East led with strong January bookings. Products Division lagged budget by $60K — gross margin pressure first appeared.' },
  'q2':  { label:'Q2 2025', key:'q2',
           months:['Apr','May','Jun'],
           insight: 'Q2 accelerating — Services West bookings up 11.3%. Advisory underperforming at -$80K vs. plan for the quarter, offset by East and West outperformance.' },
  '24':  { label:'FY 2024 (Full Year)', key:'fy24',
           months:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
           insight: 'FY 2024 closed $2.1M above plan. Full-year EBITDA 17.8% — 2 pts below current target. Growth in Services set the foundation for FY25 expansion.' }
};


/* ══════════════════════════════════════════════════════
   OPERATIONS CENTER
   • facility: all | atl | hou | phx
   • period:   day | week | month
   downLabels/downVals = downtime by root cause
   Period affects: production X-axis + plan/actual arrays
══════════════════════════════════════════════════════ */
ND.ops = {
  all: { oee:74, fpy:96.4, otd:97.1, units:'4,820', unitsC:'102% of daily plan',
         downLabels:['Equip. Failure','Changeover','Planned Maint.','Material','Quality Hold','Other'],
         downVals:[12.4,9.8,8.2,4.1,3.6,2.1],
         // period-specific plan/actual seeds
         day:   { planVal:4720, labels:Array.from({length:24},(_,i)=>`H${i+1}`),    variance:280, seed:7 },
         week:  { planVal:4720, labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],   variance:380, seed:7 },
         month: { planVal:4720, labels:Array.from({length:30},(_,i)=>`D${i+1}`),     variance:420, seed:7 }
       },
  atl: { oee:78, fpy:97.8, otd:98.4, units:'2,140', unitsC:'104% of plan',
         downLabels:['Equip. Failure','Changeover','Planned Maint.','Material','Quality Hold','Other'],
         downVals:[3.2,3.8,4.0,1.2,1.0,0.6],
         day:   { planVal:2100, labels:Array.from({length:24},(_,i)=>`H${i+1}`),    variance:120, seed:3 },
         week:  { planVal:2100, labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],   variance:180, seed:3 },
         month: { planVal:2100, labels:Array.from({length:30},(_,i)=>`D${i+1}`),     variance:180, seed:3 }
       },
  hou: { oee:71, fpy:95.1, otd:95.8, units:'1,620', unitsC:'96% of plan',
         downLabels:['Equip. Failure','Changeover','Planned Maint.','Material','Quality Hold','Other'],
         downVals:[6.8,3.4,2.4,1.8,1.4,0.8],
         day:   { planVal:1680, labels:Array.from({length:24},(_,i)=>`H${i+1}`),    variance:220, seed:5 },
         week:  { planVal:1680, labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],   variance:280, seed:5 },
         month: { planVal:1680, labels:Array.from({length:30},(_,i)=>`D${i+1}`),     variance:220, seed:5 }
       },
  phx: { oee:76, fpy:96.8, otd:97.6, units:'1,060', unitsC:'100% of plan',
         downLabels:['Equip. Failure','Changeover','Planned Maint.','Material','Quality Hold','Other'],
         downVals:[2.4,2.6,1.8,1.1,1.2,0.7],
         day:   { planVal:1040, labels:Array.from({length:24},(_,i)=>`H${i+1}`),    variance:100, seed:2 },
         week:  { planVal:1040, labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],   variance:120, seed:2 },
         month: { planVal:1040, labels:Array.from({length:30},(_,i)=>`D${i+1}`),     variance:140, seed:2 }
       }
};

/* ── Ops seeded random (deterministic per facility) ── */
ND.ops.seeded = function(seed, i) {
  const x = Math.sin(seed*100+i)*10000; return x-Math.floor(x);
};
ND.ops.getProductionData = function(facKey, period) {
  const d = ND.ops[facKey];
  const cfg = d[period];
  const n = cfg.labels.length;
  const plan = Array(n).fill(cfg.planVal);
  // Houston has a dip mid-period to reflect equipment issues
  const act = cfg.labels.map((_,i) => {
    let base = cfg.planVal - cfg.variance/2 + ND.ops.seeded(cfg.seed, i)*cfg.variance;
    if (facKey==='hou' && i>Math.floor(n*0.4) && i<Math.floor(n*0.65)) base *= 0.88; // downtime window
    return Math.round(base);
  });
  return { labels: cfg.labels, plan, act };
};


/* ══════════════════════════════════════════════════════
   HEALTHCARE
   • facility: all | main | north | clinics
   • dept:     all | ed | icu | surg | med
   unitVac[] = vacancy % for [ED, ICU, Med/Surg, Surgical, OB, Float]
   trendBase/trendVar/trendDrift = for ED wait time line
   dept filter highlights specific unit in vacancy chart
══════════════════════════════════════════════════════ */
ND.hc = {
  all:     {
    wait:34, vacRate:14.2, vacC:'4.2 pts above 10% target', bed:88,
    hcahps:'72nd', hcahpsC:'3 pts from top quartile',
    unitVac:[18.2,14.6,12.8,11.1,9.4,7.2],
    trendBase:28, trendVar:10, trendDrift:6,
    insight:'ED door-to-provider time up 18% over 30 days — driven by patient volume surge and nursing vacancy at 14.2%. Travel nurse spend up $340K MoM.'
  },
  main:    {
    wait:38, vacRate:16.8, vacC:'High — travel spend rising', bed:91,
    hcahps:'68th', hcahpsC:'Below top quartile',
    unitVac:[22.4,18.2,15.6,13.8,11.2,8.8],
    trendBase:30, trendVar:10, trendDrift:10,
    insight:'Main Campus vacancy rate (16.8%) driving $480K/month in travel staff costs. ED wait time trending up — bed capacity at 91% limiting throughput.'
  },
  north:   {
    wait:29, vacRate:11.2, vacC:'1.2 pts above 10% target', bed:84,
    hcahps:'76th', hcahpsC:'Top quartile achieved',
    unitVac:[14.4,12.0,10.8,9.4,7.8,5.6],
    trendBase:26, trendVar:6, trendDrift:4,
    insight:'North Campus is system top performer. ED wait time near target (29 min), HCAHPS in top quartile. Maintain staffing — vacancy is the primary risk at 11.2%.'
  },
  clinics: {
    wait:18, vacRate:9.4, vacC:'Under 10% target', bed:78,
    hcahps:'81st', hcahpsC:'Strong performance',
    unitVac:[9.8,8.6,8.2,7.4,6.2,4.8],
    trendBase:16, trendVar:4, trendDrift:2,
    insight:'Clinics network leading on all metrics. Vacancy under target at 9.4%, highest HCAHPS in system (81st percentile). Model for expansion standards.'
  }
};

/* ── HC dept filter: index into unitVac array ── */
ND.hc.deptIdx = { all:-1, ed:0, icu:1, surg:3, med:2 };

/* ── HC seeded random ── */
ND.hc.seeded = function(fac, i) {
  const s = fac==='all'?11:fac==='main'?17:fac==='north'?23:31;
  const x = Math.sin(s*100+i)*10000; return x-Math.floor(x);
};
ND.hc.getWaitTrend = function(facKey) {
  const d = ND.hc[facKey];
  const days = Array.from({length:30},(_,i)=>`D${i+1}`);
  const target = Array(30).fill(28);
  const actual = days.map((_,i)=>Math.round(
    d.trendBase + ND.hc.seeded(facKey,i)*d.trendVar + (i>14?d.trendDrift*i/28:0)
  ));
  return { labels:days, target, actual };
};
