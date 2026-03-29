import { useState, useMemo, useEffect } from "react";
 
// ─── FONT + GLOBAL STYLES ────────────────────────────────────────────────────
const boot = () => {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@500;600;700&family=DM+Mono:wght@400;500&display=swap";
  document.head.appendChild(link);
 
  const style = document.createElement("style");
  style.textContent = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
    @keyframes spin { to { transform: rotate(360deg); } }
    .fu  { animation: fadeUp .45s cubic-bezier(.22,.68,0,1.2) both; }
    .fu2 { animation: fadeUp .45s .07s cubic-bezier(.22,.68,0,1.2) both; }
    .fu3 { animation: fadeUp .45s .14s cubic-bezier(.22,.68,0,1.2) both; }
    .fu4 { animation: fadeUp .45s .21s cubic-bezier(.22,.68,0,1.2) both; }
    .fu5 { animation: fadeUp .45s .28s cubic-bezier(.22,.68,0,1.2) both; }
    input[type=number]::-webkit-inner-spin-button,
    input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
    input[type=range] { -webkit-appearance:none; appearance:none; width:100%; height:3px; background:#e0e0e0; border-radius:2px; outline:none; cursor:pointer; }
    input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:18px; height:18px; border-radius:50%; background:#e30003; border:2px solid #fff; box-shadow:0 1px 5px rgba(227,0,3,.35); cursor:pointer; }
    .s-inp { width:100%; border:1px solid #ddd; border-radius:2px; padding:10px 13px; font-family:'Barlow',sans-serif; font-size:14px; color:#111; background:#fff; outline:none; transition:border-color .15s, box-shadow .15s; }
    .s-inp:focus { border-color:#e30003; box-shadow:0 0 0 3px rgba(227,0,3,.1); }
    .s-inp::placeholder { color:#bbb; }
    .row-h:hover { background:#fafafa !important; }
    .s-btn { background:#e30003; color:#fff; border:none; border-radius:2px; padding:12px 28px; font-family:'Barlow',sans-serif; font-size:13px; font-weight:600; letter-spacing:.5px; cursor:pointer; transition:all .18s; text-transform:uppercase; }
    .s-btn:hover { background:#c50002; transform:translateY(-1px); box-shadow:0 4px 14px rgba(227,0,3,.35); }
    .s-btn:disabled { opacity:.35; cursor:not-allowed; transform:none; box-shadow:none; }
    .s-btn-ghost { background:transparent; color:#666; border:1px solid #ddd; border-radius:2px; padding:11px 22px; font-family:'Barlow',sans-serif; font-size:13px; font-weight:500; cursor:pointer; transition:all .15s; text-transform:uppercase; letter-spacing:.3px; }
    .s-btn-ghost:hover { border-color:#aaa; color:#333; background:#f5f5f5; }
    .tab-btn { background:transparent; border:none; cursor:pointer; font-family:'Barlow',sans-serif; font-size:12px; font-weight:600; padding:8px 18px; border-radius:2px; transition:all .15s; letter-spacing:.5px; text-transform:uppercase; }
    .add-row { background:none; border:1px dashed #ddd; border-radius:2px; padding:7px 16px; font-size:11px; font-family:'DM Mono',monospace; color:#999; cursor:pointer; transition:all .15s; letter-spacing:1px; }
    .add-row:hover { background:#f5f5f5; color:#555; border-color:#bbb; }
    .del-btn:hover { color:#e30003 !important; }
  `;
  document.head.appendChild(style);
};
 
// ─── PALETTE ─────────────────────────────────────────────────────────────────
const R = {
  red:      "#e30003",
  redDark:  "#c50002",
  redLight: "#fff0f0",
  redBorder:"#ffb3b3",
  black:    "#111111",
  charcoal: "#333333",
  grey:     "#666666",
  muted:    "#999999",
  line:     "#e8e8e8",
  bg:       "#f7f7f7",
  white:    "#ffffff",
  green:    "#166534",
  greenBg:  "#f0fdf4",
  greenLine:"#86efac",
  amber:    "#92400e",
  amberBg:  "#fffbeb",
  amberLine:"#fde68a",
};
 
// ─── COST ENGINE ─────────────────────────────────────────────────────────────
const D = { h:.22, obs:.05, stor:.03, ls:.70, exp:.12, pen:.02, k:.6, lPct:.18, otExp:.15, otPrem:.35, adm:.003 };
const coCost = (c) => c === "GBP" ? 7000 : 8500;
const sym    = (c) => c === "GBP" ? "£" : "$";
const fmt    = (n, S) => n >= 1e6 ? `${S}${(n/1e6).toFixed(2)}M` : n >= 1e3 ? `${S}${(n/1e3).toFixed(1)}K` : `${S}${Math.round(n).toLocaleString()}`;
const pct    = (n) => `${Math.abs(n).toFixed(1)}%`;
 
const engine = ({ revenue, gm, mape, leadWeeks, bias, currency }) => {
  const e = mape/100, gp = gm/100, cogs = 1-gp;
  const risk = revenue*e, over = risk*bias, under = risk*(1-bias);
  const ltM  = 1 + leadWeeks/52;
  const invLT = over * cogs * ltM;
  const c1 = invLT*(D.h+D.obs+D.stor);
  const c2 = (under*D.ls*gp) + (under*(1-D.ls)*D.exp) + (under*D.pen);
  const c3 = (mape*D.k*coCost(currency)) + (revenue*D.lPct*D.otExp*D.otPrem*e);
  const c4 = revenue*D.adm;
  return { c1, c2, c3, c4, total:c1+c2+c3+c4,
    detail: {
      holding: invLT*D.h, obsolete: invLT*D.obs, storage: invLT*D.stor,
      lostMarg: under*D.ls*gp, expCost: under*(1-D.ls)*D.exp, penCost: under*D.pen,
      coCount: mape*D.k, coCostTotal: mape*D.k*coCost(currency), otCost: revenue*D.lPct*D.otExp*D.otPrem*e
    }
  };
};
 
const SLIDER_LABELS = ["Rarely miss — very confident","Accurate, occasional surprises","Mixed — some periods hard to predict","Often surprised by actuals","Frequently wrong, significant gaps"];
const SLIDER_MAPE   = [8, 15, 22, 32, 44];
const SLIDER_BIAS   = [.50,.52,.55,.57,.60];
 
const GRADE = (w) => {
  if (w < 10) return { verdict:"Best-in-class",  score:"A+", color:R.green,  bg:R.greenBg,  border:R.greenLine };
  if (w < 20) return { verdict:"Good",           score:"B",  color:"#15803d",bg:R.greenBg,  border:R.greenLine };
  if (w < 30) return { verdict:"Average",        score:"C",  color:R.amber,  bg:R.amberBg,  border:R.amberLine };
  if (w < 45) return { verdict:"Below average",  score:"D",  color:"#b45309",bg:R.amberBg,  border:R.amberLine };
  return            { verdict:"High risk",       score:"F",  color:R.red,    bg:R.redLight, border:R.redBorder };
};
 
// ─── COMPONENTS ───────────────────────────────────────────────────────────────
const Label = ({ children }) => (
  <div style={{ fontSize:10, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600, letterSpacing:"2.5px", textTransform:"uppercase", color:R.red, marginBottom:6 }}>{children}</div>
);
 
const SectionLabel = ({ children }) => (
  <div style={{ fontSize:10, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, letterSpacing:"3px", textTransform:"uppercase", color:R.muted, marginBottom:12 }}>{children}</div>
);
 
const Field = ({ label, error, hint, children, span=1 }) => (
  <div style={{ gridColumn:`span ${span}`, marginBottom:16 }}>
    <div style={{ fontSize:11, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600, letterSpacing:"2px", textTransform:"uppercase", color: error ? R.red : R.charcoal, marginBottom:6 }}>{label}</div>
    {children}
    {hint  && <div style={{ fontSize:11, color:R.muted, marginTop:4, fontFamily:"'Barlow',sans-serif" }}>{hint}</div>}
    {error && <div style={{ fontSize:11, color:R.red,   marginTop:4, fontFamily:"'Barlow',sans-serif" }}>{error}</div>}
  </div>
);
 
const Divider = () => <div style={{ borderTop:`1px solid ${R.line}`, margin:"20px 0" }} />;
 
const Steps = ({ step }) => (
  <div style={{ display:"flex", alignItems:"center", gap:0, marginBottom:28 }}>
    {[["01","Data entry"],["02","Parameters"],["03","Your verdict"]].map(([n,label],i) => {
      const done = i < step, active = i === step;
      return (
        <div key={i} style={{ display:"flex", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:26, height:26, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
              background: done ? R.red : active ? R.black : "transparent",
              border:`2px solid ${done ? R.red : active ? R.black : R.line}`,
              fontSize:10, fontFamily:"'DM Mono',monospace", color: done||active?"#fff":R.muted, transition:"all .3s" }}>
              {done ? "✓" : n}
            </div>
            <span style={{ fontSize:11, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600, letterSpacing:"1.5px", textTransform:"uppercase", color: active ? R.black : R.muted }}>{label}</span>
          </div>
          {i < 2 && <div style={{ width:36, height:1, background: i<step ? R.red : R.line, margin:"0 12px", transition:"background .4s" }} />}
        </div>
      );
    })}
  </div>
);
 
const Card = ({ children, style={} }) => (
  <div style={{ background:R.white, border:`1px solid ${R.line}`, borderRadius:2, ...style }}>{children}</div>
);
 
// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function SineraTCFI() {
  useEffect(() => { boot(); }, []);
 
  const [step, setStep]   = useState(0);
  const [mode, setMode]   = useState("period");
  const [slider, setSlider] = useState(2);
 
  const getDefaultPeriods = () => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const now = new Date();
    return Array.from({length:6}, (_,i) => {
      const d = new Date(now.getFullYear(), now.getMonth()-5+i, 1);
      return { period: `${months[d.getMonth()]} ${d.getFullYear()}`, f:"", a:"" };
    });
  };
  const [rows, setRows]   = useState(getDefaultPeriods);
  const [biz, setBiz]     = useState({ revenue:"", margin:"", leadTime:"8", currency:"GBP" });
  const [lead, setLead]   = useState({ name:"", email:"", company:"", role:"" });
  const [gdpr, setGdpr]   = useState(false);
  const [errs, setErrs]   = useState({});
  const [busy, setBusy]   = useState(false);
  const [result, setResult] = useState(null);
 
  const periodCalc = useMemo(() => {
    const valid = rows.filter(r => +r.a > 0 && +r.f >= 0 && r.a !== "" && r.f !== "");
    if (!valid.length) return null;
    const n     = valid.length;
    const mape  = (valid.reduce((s,r) => s + Math.abs(+r.a-+r.f)/+r.a, 0)/n)*100;
    const wmape = (valid.reduce((s,r) => s + Math.abs(+r.a-+r.f), 0) / valid.reduce((s,r)=>s+(+r.a),0))*100;
    const bias  = (valid.reduce((s,r) => s + (+r.f-+r.a)/+r.a, 0)/n)*100;
    const overC = valid.filter(r=>+r.f>+r.a).length;
    return { mape, wmape, bias, biasSplit:overC/n, n };
  }, [rows]);
 
  const activeMAPE = mode==="period" ? (periodCalc?.wmape??0) : SLIDER_MAPE[slider];
  const activeBias = mode==="period" ? (periodCalc?.biasSplit??0.55) : SLIDER_BIAS[slider];
  const S = sym(biz.currency||"GBP");
 
  const updateRow = (i,k,v) => setRows(r=>r.map((row,j)=>j===i?{...row,[k]:v}:row));
  const addRow    = () => setRows(r=>[...r,{period:`Period ${r.length+1}`,f:"",a:""}]);
  const removeRow = (i) => rows.length>1 && setRows(r=>r.filter((_,j)=>j!==i));
 
  const validateBiz = () => {
    const e={};
    if (!biz.revenue||isNaN(biz.revenue)||+biz.revenue<=0) e.revenue="Enter a valid revenue figure";
    if (!biz.margin||isNaN(biz.margin)||+biz.margin<=0||+biz.margin>=100) e.margin="Enter gross margin between 1–99%";
    if (!biz.leadTime||isNaN(biz.leadTime)||+biz.leadTime<=0) e.leadTime="Enter planning lead time in weeks";
    return e;
  };
  const validateLead = () => {
    const e={};
    if (!lead.name.trim()) e.name="Required";
    if (!lead.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email="Valid work email required";
    if (!lead.company.trim()) e.company="Required";
    if (!gdpr) e.gdpr="You must agree to continue";
    return e;
  };
 
  const goToStep1 = () => { const e=validateBiz(); if(Object.keys(e).length){setErrs(e);return;} setErrs({}); setStep(2); };
 
  const handleSubmit = async () => {
    const e=validateLead(); if(Object.keys(e).length){setErrs(e);return;}
    setErrs({}); setBusy(true);
    // ── SALESFORCE WEB-TO-LEAD ────────────────────────────────────────────
    try {
      const nameParts = lead.name.trim().split(" ");
      const params = new URLSearchParams({
        oid:          "00Dd3000004duXu",
        first_name:   nameParts[0],
        last_name:    nameParts.slice(1).join(" ") || nameParts[0],
        email:        lead.email,
        company:      lead.company,
        title:        lead.role || "",
        lead_source:  "Forecast Inaccuracy Tool",
        "00Nd3000007peNZ": activeMAPE.toFixed(2),
        "00Nd3000007peAg": biz.revenue,
        "00Nd3000007pePB": biz.currency,
      });
      await fetch("https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8", {
        method:  "POST",
        mode:    "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body:    params.toString(),
      });
    } catch(err) { console.error("SF Web-to-Lead error:", err); }
    // ─────────────────────────────────────────────────────────────────────
    await new Promise(r=>setTimeout(r,800));
    const base = engine({ revenue:+biz.revenue, gm:+biz.margin, mape:activeMAPE, leadWeeks:+biz.leadTime, bias:activeBias, currency:biz.currency });
    const low  = engine({ revenue:+biz.revenue, gm:+biz.margin, mape:activeMAPE*.70, leadWeeks:+biz.leadTime, bias:activeBias, currency:biz.currency });
    const high = engine({ revenue:+biz.revenue, gm:+biz.margin, mape:activeMAPE*1.30, leadWeeks:+biz.leadTime, bias:activeBias, currency:biz.currency });
    setResult({ ...base, low, high });
    setBusy(false); setStep(3);
  };
 
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ background:R.bg, minHeight:"100vh", fontFamily:"'Barlow',sans-serif", padding:"44px 20px" }}>
      <div style={{ maxWidth:700, margin:"0 auto" }}>
 
        {/* ── HEADER ── */}
        <div className="fu" style={{ marginBottom:36 }}>
          <h1 style={{ fontSize:"clamp(26px,4vw,40px)", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, color:R.black, lineHeight:1.1, marginBottom:10, letterSpacing:"-0.5px" }}>
            What Is Your Forecast<br/>
            <span style={{ color:R.red }}>Inaccuracy Costing You?</span>
          </h1>
          <p style={{ color:R.grey, fontSize:14, lineHeight:1.75, maxWidth:520, fontWeight:400 }}>
            Enter your monthly or quarterly forecast vs actual figures — or use the quick estimate if you don't have the data to hand. We apply 11 industry benchmarks and return your cost of forecast inaccuracy in under 4 minutes.
          </p>
        </div>
 
        <div className="fu2"><Steps step={step} /></div>
 
        {/* ══════════════════════════════════════════════════════════
            STEP 0 — DATA ENTRY
        ══════════════════════════════════════════════════════════ */}
        {step === 0 && (
          <div className="fu">
            {/* Mode tabs */}
            <div style={{ display:"flex", background:R.white, border:`1px solid ${R.line}`, borderRadius:2, padding:3, gap:3, marginBottom:18, width:"fit-content" }}>
              {[["period","I have period data"],["slider","Quick estimate"]].map(([m,label])=>(
                <button key={m} className="tab-btn" onClick={()=>setMode(m)} style={{
                  background: mode===m ? R.black : "transparent",
                  color: mode===m ? "#fff" : R.muted,
                  boxShadow: mode===m ? "0 1px 3px rgba(0,0,0,.15)" : "none",
                }}>{label}</button>
              ))}
            </div>
 
            {/* PERIOD TABLE */}
            {mode === "period" && (
              <Card style={{ overflow:"hidden", marginBottom:16 }}>
                <div style={{ background:R.black, padding:"10px 18px" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"160px 1fr 1fr 36px", gap:10 }}>
                    {["Period","Forecast (£/$)","Actual (£/$)",""].map((h,i)=>(
                      <div key={i} style={{ fontSize:9, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600, letterSpacing:"2.5px", textTransform:"uppercase", color:"rgba(255,255,255,.5)", textAlign:i>0&&i<3?"right":"left" }}>{h}</div>
                    ))}
                  </div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,.3)", marginTop:6, fontFamily:"'Barlow',sans-serif" }}>
                    Enter monthly or quarterly totals — pull from your ERP, finance report, or spreadsheet
                  </div>
                </div>
                {rows.map((row,i)=>(
                  <div key={i} className="row-h" style={{ display:"grid", gridTemplateColumns:"160px 1fr 1fr 36px", padding:"8px 18px", gap:10, borderBottom:`1px solid ${R.bg}`, background:R.white, alignItems:"center", transition:"background .12s" }}>
                    <input className="s-inp" value={row.period} onChange={e=>updateRow(i,"period",e.target.value)}
                      style={{ fontSize:12, fontFamily:"'DM Mono',monospace", padding:"7px 10px" }} />
                    <input className="s-inp" type="number" value={row.f} placeholder="0" onChange={e=>updateRow(i,"f",e.target.value)}
                      style={{ textAlign:"right", fontSize:12, fontFamily:"'DM Mono',monospace", padding:"7px 10px" }} />
                    <input className="s-inp" type="number" value={row.a} placeholder="0" onChange={e=>updateRow(i,"a",e.target.value)}
                      style={{ textAlign:"right", fontSize:12, fontFamily:"'DM Mono',monospace", padding:"7px 10px" }} />
                    <button className="del-btn" onClick={()=>removeRow(i)} style={{ background:"none", border:"none", color:R.muted, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", transition:"color .12s" }}>×</button>
                  </div>
                ))}
                <div style={{ padding:"12px 18px", borderTop:`1px solid ${R.bg}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <button className="add-row" onClick={addRow} style={{ opacity: rows.length >= 12 ? 0.4 : 1, pointerEvents: rows.length >= 12 ? "none" : "auto" }}>+ Add period</button>
                  <span style={{ fontSize:11, color:R.muted, fontFamily:"'Barlow',sans-serif" }}>Up to 12 periods</span>
                </div>
              </Card>
            )}
 
            {/* SLIDER */}
            {mode === "slider" && (
              <Card style={{ padding:"24px 28px", marginBottom:16 }}>
                <SectionLabel>Self-assessment</SectionLabel>
                <div style={{ fontSize:14, color:R.charcoal, marginBottom:22, fontWeight:500 }}>How accurately does your team forecast sales demand?</div>
                <input type="range" min={0} max={4} step={1} value={slider} onChange={e=>setSlider(+e.target.value)} style={{ marginBottom:12 }} />
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:R.muted, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600, letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:20 }}>
                  <span>Very accurate</span><span>Frequently wrong</span>
                </div>
                <div style={{ background:R.bg, border:`1px solid ${R.line}`, borderLeft:`3px solid ${R.red}`, borderRadius:2, padding:"14px 18px" }}>
                  <div style={{ fontSize:14, color:R.black, fontWeight:600, marginBottom:4 }}>{SLIDER_LABELS[slider]}</div>
                  <div style={{ fontSize:12, color:R.muted }}>Mapped MAPE estimate: <strong style={{ fontFamily:"'DM Mono',monospace", color:R.black, fontStyle:"normal" }}>{SLIDER_MAPE[slider]}%</strong></div>
                </div>
                <div style={{ marginTop:12, fontSize:11, color:R.muted }}>For a more precise result, switch to "I have period data" above and enter your monthly figures.</div>
              </Card>
            )}
 
            {/* Live preview */}
            {mode === "period" && periodCalc && (
              <Card style={{ padding:"18px 24px", marginBottom:16, borderLeft:`3px solid ${R.red}` }}>
                <SectionLabel>Live calculation · {periodCalc.n} period{periodCalc.n!==1?"s":""} entered</SectionLabel>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
                  {[["WMAPE",`${periodCalc.wmape.toFixed(1)}%`,"Primary metric — weighted"],["MAPE",`${periodCalc.mape.toFixed(1)}%`,"Unweighted average"],["Bias",`${periodCalc.bias>0?"+":""}${periodCalc.bias.toFixed(1)}%`,periodCalc.bias>1?"Over-forecasting":periodCalc.bias<-1?"Under-forecasting":"Balanced"]].map(([l,v,s],i)=>(
                    <div key={i}>
                      <div style={{ fontSize:26, fontFamily:"'DM Mono',monospace", fontWeight:500, color:R.red }}>{v}</div>
                      <div style={{ fontSize:10, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600, letterSpacing:"2px", textTransform:"uppercase", color:R.black, marginTop:2 }}>{l}</div>
                      <div style={{ fontSize:11, color:R.muted, marginTop:2 }}>{s}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
 
            <div style={{ display:"flex", justifyContent:"flex-end" }}>
              <button className="s-btn" onClick={()=>setStep(1)} disabled={mode==="period"&&(!periodCalc||periodCalc.n<1)}>Continue →</button>
            </div>
          </div>
        )}
 
        {/* ══════════════════════════════════════════════════════════
            STEP 1 — BUSINESS PARAMETERS
        ══════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="fu">
            <Card style={{ padding:"28px 32px", marginBottom:16 }}>
              <SectionLabel>Company parameters</SectionLabel>
              <Divider />
 
              {/* Currency */}
              <Field label="Reporting currency">
                <div style={{ display:"flex", gap:8 }}>
                  {[["GBP","£ GBP — Sterling"],["USD","$ USD — Dollar"]].map(([v,label])=>(
                    <button key={v} onClick={()=>setBiz(b=>({...b,currency:v}))}
                      style={{ flex:1, padding:"10px", border:`1.5px solid ${biz.currency===v?R.red:R.line}`, borderRadius:2, background:biz.currency===v?R.red:"#fff",
                        color:biz.currency===v?"#fff":R.grey, fontSize:13, fontFamily:"'Barlow',sans-serif", fontWeight:600, cursor:"pointer", transition:"all .15s" }}>
                      {label}
                    </button>
                  ))}
                </div>
              </Field>
 
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <Field label={`Annual revenue (${S})`} error={errs.revenue} hint="Last 12 months manufacturing revenue" span={2}>
                  <div style={{ display:"flex" }}>
                    <span style={{ background:R.bg, border:`1px solid ${R.line}`, borderRight:"none", borderRadius:"2px 0 0 2px", padding:"10px 12px", fontSize:13, color:R.muted, fontFamily:"'DM Mono',monospace" }}>{S}</span>
                    <input className="s-inp" type="number" placeholder="10,000,000" value={biz.revenue}
                      onChange={e=>{setBiz(b=>({...b,revenue:e.target.value}));setErrs(er=>({...er,revenue:null}));}}
                      style={{ borderRadius:"0 2px 2px 0", borderLeft:"none" }} />
                  </div>
                </Field>
 
                <Field label="Gross margin %" error={errs.margin} hint="Revenue minus COGS">
                  <div style={{ display:"flex" }}>
                    <input className="s-inp" type="number" placeholder="38" min="1" max="99" value={biz.margin}
                      onChange={e=>{setBiz(b=>({...b,margin:e.target.value}));setErrs(er=>({...er,margin:null}));}}
                      style={{ borderRadius:"2px 0 0 2px", borderRight:"none" }} />
                    <span style={{ background:R.bg, border:`1px solid ${R.line}`, borderLeft:"none", borderRadius:"0 2px 2px 0", padding:"10px 12px", fontSize:13, color:R.muted, fontFamily:"'DM Mono',monospace" }}>%</span>
                  </div>
                </Field>
 
                <Field label="Planning lead time" error={errs.leadTime} hint="Weeks your schedule is frozen">
                  <div style={{ display:"flex" }}>
                    <input className="s-inp" type="number" placeholder="8" min="1" max="52" value={biz.leadTime}
                      onChange={e=>{setBiz(b=>({...b,leadTime:e.target.value}));setErrs(er=>({...er,leadTime:null}));}}
                      style={{ borderRadius:"2px 0 0 2px", borderRight:"none" }} />
                    <span style={{ background:R.bg, border:`1px solid ${R.line}`, borderLeft:"none", borderRadius:"0 2px 2px 0", padding:"10px 12px", fontSize:13, color:R.muted, fontFamily:"'DM Mono',monospace" }}>wks</span>
                  </div>
                </Field>
              </div>
 
              <Divider />
              {/* MAPE carry badge */}
              <div style={{ background:R.bg, border:`1px solid ${R.line}`, borderLeft:`3px solid ${R.red}`, borderRadius:2, padding:"14px 18px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:10, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, letterSpacing:"2.5px", textTransform:"uppercase", color:R.black, marginBottom:3 }}>Forecast error (WMAPE)</div>
                  <div style={{ fontSize:12, color:R.muted }}>Carried from {mode==="period"?"your period data":"confidence estimate"}</div>
                </div>
                <div style={{ fontSize:28, fontFamily:"'DM Mono',monospace", fontWeight:500, color:R.red }}>{activeMAPE.toFixed(1)}%</div>
              </div>
            </Card>
 
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <button className="s-btn-ghost" onClick={()=>setStep(0)}>← Back</button>
              <button className="s-btn" onClick={goToStep1}>Calculate my cost →</button>
            </div>
          </div>
        )}
 
        {/* ══════════════════════════════════════════════════════════
            STEP 2 — EMAIL GATE
        ══════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="fu">
            {/* Blurred preview */}
            <div style={{ position:"relative", marginBottom:16 }}>
              <div style={{ filter:"blur(6px)", pointerEvents:"none", userSelect:"none" }}>
                <Card style={{ padding:"24px 28px", marginBottom:10 }}>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                    {[["Base case","████████"],["% of revenue","██.█%"],["Verdict","██"]].map(([l,v],i)=>(
                      <div key={i} style={{ background:R.bg, borderRadius:2, padding:"14px 16px", textAlign:"center" }}>
                        <div style={{ fontSize:22, fontFamily:"'DM Mono',monospace", color:R.black }}>{v}</div>
                        <div style={{ fontSize:9, color:R.muted, marginTop:4, textTransform:"uppercase", letterSpacing:"2px", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600 }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
              <div style={{ position:"absolute", inset:0, background:"rgba(247,247,247,0.9)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8 }}>
                <div style={{ width:40, height:40, background:R.red, borderRadius:2, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="5" y="8" width="8" height="8" rx="1" fill="white"/><path d="M6 8V6a3 3 0 016 0v2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:18, color:R.black, letterSpacing:"-.2px" }}>Your diagnostic results are ready</div>
                <div style={{ fontSize:13, color:R.grey }}>Enter your details below to unlock the full verdict</div>
              </div>
            </div>
 
            {/* Lead form */}
            <Card style={{ padding:"28px 32px" }}>
              <SectionLabel>Unlock your report</SectionLabel>
              <div style={{ fontSize:14, color:R.charcoal, marginBottom:20, lineHeight:1.6 }}>
                We'll send you the full breakdown — cost by category, benchmark comparison, and where to cut first.
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                {[
                  {k:"name",    l:"Full name",              ph:"Jane Smith",              span:1},
                  {k:"company", l:"Company",                ph:"Acme Manufacturing",      span:1},
                  {k:"email",   l:"Work email",             ph:"jane@company.com",        span:2},
                  {k:"role",    l:"Your role (optional)",   ph:"CFO, Finance Director…",  span:2},
                ].map(({k,l,ph,span})=>(
                  <Field key={k} label={l} error={errs[k]} span={span}>
                    <input className="s-inp" placeholder={ph} value={lead[k]}
                      onChange={e=>{setLead(f=>({...f,[k]:e.target.value}));setErrs(er=>({...er,[k]:null}));}} />
                  </Field>
                ))}
              </div>
              <Divider />
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <button className="s-btn-ghost" onClick={()=>setStep(1)}>← Back</button>
                <button className="s-btn" onClick={handleSubmit} disabled={busy}
                  style={{ minWidth:180, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  {busy ? (
                    <><svg style={{ animation:"spin 1s linear infinite" }} width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="rgba(255,255,255,.3)" strokeWidth="1.5"/><path d="M7 1.5a5.5 5.5 0 015.5 5.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg>Calculating…</>
                  ) : "View my verdict →"}
                </button>
              </div>
              <div style={{ margin:"16px 0 0", display:"flex", gap:10, alignItems:"flex-start" }}>
                <input type="checkbox" id="gdpr" checked={gdpr} onChange={e=>{ setGdpr(e.target.checked); setErrs(er=>({...er,gdpr:null})); }}
                  style={{ marginTop:3, accentColor:R.red, width:14, height:14, cursor:"pointer", flexShrink:0 }} />
                <div>
                  <label htmlFor="gdpr" style={{ fontSize:12, color:R.grey, lineHeight:1.6, cursor:"pointer" }}>
                    I agree to Sinera Sales Lab storing my details to send this report and follow up. You can unsubscribe at any time.{" "}
                    <a href="https://sinerasaleslab.com/privacy-policy/" target="_blank" rel="noreferrer" style={{ color:R.red }}>Privacy Policy</a>
                  </label>
                  {errs.gdpr && <div style={{ fontSize:11, color:R.red, marginTop:3 }}>{errs.gdpr}</div>}
                </div>
              </div>
            </Card>
          </div>
        )}
 
        {/* ══════════════════════════════════════════════════════════
            STEP 3 — RESULTS
        ══════════════════════════════════════════════════════════ */}
        {step === 3 && result && (() => {
          const g = GRADE(activeMAPE);
          const cats = [
            { label:"Inventory overstock",  val:result.c1, color:R.amber  },
            { label:"Stockout & lost margin",val:result.c2, color:R.red   },
            { label:"Production disruption", val:result.c3, color:"#1e40af"},
            { label:"Planning & admin",      val:result.c4, color:"#5b21b6"},
          ];
          const maxC = Math.max(...cats.map(c=>c.val));
          return (
            <div>
              {/* Verdict header */}
              <div className="fu" style={{ background:R.black, borderRadius:2, padding:"28px 32px", marginBottom:12, display:"grid", gridTemplateColumns:"auto 1fr", gap:28, alignItems:"center" }}>
                <div style={{ width:84, height:84, borderRadius:2, background:R.red, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2 }}>
                  <div style={{ fontSize:34, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, color:"#fff", lineHeight:1 }}>{g.score}</div>
                  <div style={{ fontSize:9, letterSpacing:"2.5px", textTransform:"uppercase", color:"rgba(255,255,255,.6)", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600 }}>Verdict</div>
                </div>
                <div>
                  <div style={{ fontSize:10, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600, letterSpacing:"2.5px", textTransform:"uppercase", color:"rgba(255,255,255,.4)", marginBottom:6 }}>Forecast accuracy · {lead.company||"Your company"}</div>
                  <div style={{ fontSize:36, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, color:"#fff", lineHeight:1.1, marginBottom:10, letterSpacing:"-.5px" }}>{activeMAPE.toFixed(1)}% WMAPE</div>
                  <span style={{ display:"inline-block", background:g.bg, color:g.color, fontSize:11, fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", padding:"5px 14px", borderRadius:2, border:`1px solid ${g.border}`, fontFamily:"'Barlow Condensed',sans-serif" }}>{g.verdict}</span>
                </div>
              </div>
 
              {/* Scenarios */}
              <div className="fu2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
                {[
                  {label:"Conservative",  val:result.low.total,  p:result.low.total/+biz.revenue*100,  color:R.green},
                  {label:"Base case",     val:result.total,       p:result.total/+biz.revenue*100,       color:R.red, main:true},
                  {label:"High",          val:result.high.total,  p:result.high.total/+biz.revenue*100,  color:"#b45309"},
                ].map(({label,val,p,color,main})=>(
                  <Card key={label} style={{ padding:"18px 16px", textAlign:"center", borderColor:main?R.red:R.line, borderWidth:main?1.5:1 }}>
                    <div style={{ fontSize:10, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", color:R.muted, marginBottom:6 }}>{label}</div>
                    <div style={{ fontSize:main?28:20, fontFamily:"'DM Mono',monospace", fontWeight:500, color }}>{fmt(val,S)}</div>
                    <div style={{ fontSize:11, color, marginTop:4, fontFamily:"'Barlow',sans-serif" }}>{p.toFixed(1)}% of revenue</div>
                    {main && <div style={{ fontSize:10, color:R.muted, marginTop:3 }}>Most likely estimate</div>}
                  </Card>
                ))}
              </div>
 
              {/* Breakdown */}
              <div className="fu3">
                <Card style={{ padding:"22px 26px", marginBottom:12 }}>
                  <SectionLabel>Cost breakdown</SectionLabel>
                  {cats.map(({label,val,color})=>(
                    <div key={label} style={{ marginBottom:14 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                        <span style={{ fontSize:13, color:R.charcoal }}>{label}</span>
                        <div style={{ display:"flex", gap:14, alignItems:"baseline" }}>
                          <span style={{ fontSize:11, color:R.muted, fontFamily:"'DM Mono',monospace" }}>{((val/result.total)*100).toFixed(0)}%</span>
                          <span style={{ fontSize:14, fontFamily:"'DM Mono',monospace", fontWeight:500, color }}>{fmt(val,S)}</span>
                        </div>
                      </div>
                      <div style={{ background:R.bg, borderRadius:1, height:5, overflow:"hidden" }}>
                        <div style={{ background:color, height:"100%", width:`${(val/maxC)*100}%`, transition:"width .9s cubic-bezier(.22,.68,0,1.2)" }} />
                      </div>
                    </div>
                  ))}
                </Card>
              </div>
 
              {/* Benchmark */}
              <div className="fu4">
                <Card style={{ padding:"22px 26px", marginBottom:12 }}>
                  <SectionLabel>Industry benchmark</SectionLabel>
                  <div style={{ position:"relative", height:6, background:R.bg, borderRadius:3, marginBottom:8, overflow:"hidden" }}>
                    <div style={{ position:"absolute", inset:0, background:`linear-gradient(90deg, ${R.green} 0%, #84cc16 22%, #f59e0b 55%, ${R.red} 100%)`, borderRadius:3 }} />
                    <div style={{ position:"absolute", top:"50%", left:`${Math.min(activeMAPE/60*100,97)}%`, transform:"translate(-50%,-50%)", width:14, height:14, borderRadius:2, background:R.black, border:"2px solid #fff", boxShadow:"0 1px 4px rgba(0,0,0,.3)", transition:"left 1s ease" }} />
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600, letterSpacing:"1.5px", textTransform:"uppercase", color:R.muted, marginBottom:14 }}>
                    {[["<10% · Best-in-class"],["10–20% · Good"],["20–40% · Average"],["40%+ · High risk"]].map(([l],i)=><span key={i}>{l}</span>)}
                  </div>
                  <div style={{ background:R.bg, border:`1px solid ${R.line}`, borderLeft:`3px solid ${R.green}`, borderRadius:2, padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ fontSize:13, color:R.charcoal }}>Best-in-class manufacturers (&lt;10% MAPE) run this cost at <strong>1.5–2.5% of revenue</strong></div>
                    <div style={{ fontSize:14, fontFamily:"'DM Mono',monospace", color:R.red, fontWeight:500, marginLeft:16, whiteSpace:"nowrap" }}>vs your {(result.total/+biz.revenue*100).toFixed(1)}%</div>
                  </div>
                </Card>
              </div>
 
              {/* Metrics row */}
              <div className="fu5" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
                <Card style={{ padding:"18px 20px" }}>
                  <SectionLabel>Cost per MAPE point</SectionLabel>
                  <div style={{ fontSize:24, fontFamily:"'DM Mono',monospace", color:R.black }}>{fmt(result.total/activeMAPE, S)}</div>
                  <div style={{ fontSize:12, color:R.muted, marginTop:4 }}>Saved annually per percentage point eliminated</div>
                </Card>
                <Card style={{ padding:"18px 20px", background:R.greenBg, borderColor:R.greenLine }}>
                  <SectionLabel>50% MAPE reduction saves</SectionLabel>
                  <div style={{ fontSize:24, fontFamily:"'DM Mono',monospace", color:R.green }}>{fmt(result.total-result.low.total, S)}</div>
                  <div style={{ fontSize:12, color:R.green, marginTop:4, opacity:.8 }}>annually — conservative estimate</div>
                </Card>
              </div>
 
              {/* CTA */}
              <div style={{ background:R.red, borderRadius:2, padding:"28px 32px", marginBottom:14 }}>
                <div style={{ fontSize:10, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, letterSpacing:"3px", textTransform:"uppercase", color:"rgba(255,255,255,.6)", marginBottom:8 }}>Your next step</div>
                <div style={{ fontSize:20, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, color:"#fff", marginBottom:8, lineHeight:1.2 }}>This is a directional estimate.<br/>A calibrated diagnostic gives you the exact figure.</div>
                <p style={{ margin:"0 0 20px", fontSize:13, color:"rgba(255,255,255,.75)", lineHeight:1.7 }}>
                  Sinera's diagnostic identifies which cost category is driving your exposure — and whether the root cause is structural or recoverable. Fixed scope, 5 days, no implementation.
                </p>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                  <a href="https://outlook.office.com/bookwithme/user/56a6b02253c942c9be2dc6efc834fbb4@sinerasaleslab.co.uk/meetingtype/agc2UJU3SEmHpe6CStUpQg2?anonymous&ismsaljsauthenabled" target="_blank" rel="noreferrer" style={{ background:"#fff", color:R.red, borderRadius:2, padding:"12px 24px", fontSize:13, fontFamily:"'Barlow',sans-serif", fontWeight:700, cursor:"pointer", letterSpacing:".5px", textTransform:"uppercase", textDecoration:"none", display:"inline-block" }}>Book a free 30-min call</a>
 
                </div>
              </div>
 
              {/* Methodology note */}
              <div style={{ fontSize:11, color:R.muted, lineHeight:1.9, padding:"0 2px", fontFamily:"'Barlow',sans-serif" }}>
                <strong style={{ color:R.grey }}>Methodology:</strong> WMAPE = Σ|A−F|/ΣA·100. TCFI = C1 (inventory overstock) + C2 (stockout lost margin) + C3 (production disruption) + C4 (admin overhead). Benchmark defaults: inventory holding 22%/yr, obsolescence 5%, lost-sales rate 70%, expediting premium 12%, changeovers 0.6/MAPE point. Lead time multiplier applied to C1 only. Scenarios at base MAPE ±30%.
              </div>
            </div>
          );
        })()}
 
      </div>
    </div>
  );
}
