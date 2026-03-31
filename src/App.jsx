import { useState, useMemo, useEffect } from "react";

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
    .persona-card { border:1.5px solid #e8e8e8; border-radius:3px; padding:28px 24px; cursor:pointer; transition:all .2s; background:#fff; }
    .persona-card:hover { border-color:#e30003; box-shadow:0 4px 20px rgba(227,0,3,.12); transform:translateY(-2px); }
    .tab-btn { background:transparent; border:none; cursor:pointer; font-family:'Barlow',sans-serif; font-size:12px; font-weight:600; padding:8px 18px; border-radius:2px; transition:all .15s; letter-spacing:.5px; text-transform:uppercase; }
    .add-row { background:none; border:1px dashed #ddd; border-radius:2px; padding:7px 16px; font-size:11px; font-family:'DM Mono',monospace; color:#999; cursor:pointer; transition:all .15s; letter-spacing:1px; }
    .add-row:hover { background:#f5f5f5; color:#555; border-color:#bbb; }
    .del-btn:hover { color:#e30003 !important; }
    @media (max-width:600px) {
      .persona-grid { grid-template-columns: 1fr !important; }
      .step-label { display:none !important; }
      .step-conn { width:20px !important; margin:0 6px !important; }
      .s-btn { padding:12px 18px !important; font-size:12px !important; }
      .s-btn-ghost { padding:11px 14px !important; font-size:12px !important; }
    }
  `;
  document.head.appendChild(style);
};

const R = {
  red:"#e30003", redDark:"#c50002", redLight:"#fff0f0", redBorder:"#ffb3b3",
  black:"#111111", charcoal:"#333333", grey:"#666666", muted:"#999999",
  line:"#e8e8e8", bg:"#f7f7f7", white:"#ffffff",
  green:"#166534", greenBg:"#f0fdf4", greenLine:"#86efac",
  amber:"#92400e", amberBg:"#fffbeb", amberLine:"#fde68a",
  blue:"#1e40af", blueBg:"#eff6ff", blueLine:"#bfdbfe",
  purple:"#5b21b6", purpleBg:"#faf5ff", purpleLine:"#ddd6fe",
};

// ── CFO engine ────────────────────────────────────────────────────────────────
const D = { h:.22, obs:.05, stor:.03, ls:.70, exp:.12, pen:.02, k:.6, lPct:.18, otExp:.15, otPrem:.35, adm:.003 };
const coCost = (c) => c === "GBP" ? 7000 : 8500;
const sym = (c) => c === "GBP" ? "£" : "$";
const fmt = (n, S) => n >= 1e6 ? `${S}${(n/1e6).toFixed(2)}M` : n >= 1e3 ? `${S}${(n/1e3).toFixed(1)}K` : `${S}${Math.round(n).toLocaleString()}`;

const cfoEngine = ({ revenue, gm, mape, leadWeeks, bias, currency }) => {
  const e=mape/100, gp=gm/100, cogs=1-gp;
  const risk=revenue*e, over=risk*bias, under=risk*(1-bias);
  const ltM=1+leadWeeks/52, invLT=over*cogs*ltM;
  const c1=invLT*(D.h+D.obs+D.stor);
  const c2=(under*D.ls*gp)+(under*(1-D.ls)*D.exp)+(under*D.pen);
  const c3=(mape*D.k*coCost(currency))+(revenue*D.lPct*D.otExp*D.otPrem*e);
  const c4=revenue*D.adm;
  return { c1, c2, c3, c4, total:c1+c2+c3+c4 };
};

// ── CRO engine ────────────────────────────────────────────────────────────────
const croEngine = ({ revenue, gm, mape, reps, quota, otd, bias }) => {
  const e=mape/100, gp=gm/100;
  const under=revenue*e*(1-bias);
  const otdFail=(100-otd)/100;
  const r1=under*0.70;                             // Lost revenue: under-forecast × lost-sale rate
  const r2=revenue*otdFail*0.15;                   // Revenue at risk: OTD failures × churn factor
  const r3=Number(reps)*Number(quota)*0.20;        // Rep capacity: 20% time lost to firefighting
  const r4=(under+revenue*otdFail)*0.03;           // Margin dilution: discounts + freight absorption
  return { r1, r2, r3, r4, total:r1+r2+r3+r4 };
};

const CFO_GRADE = (w) => {
  if (w<10) return { verdict:"Best-in-class", score:"A+", color:R.green,  bg:R.greenBg,  border:R.greenLine };
  if (w<20) return { verdict:"Good",          score:"B",  color:"#15803d",bg:R.greenBg,  border:R.greenLine };
  if (w<30) return { verdict:"Average",       score:"C",  color:R.amber,  bg:R.amberBg,  border:R.amberLine };
  if (w<45) return { verdict:"Below average", score:"D",  color:"#b45309",bg:R.amberBg,  border:R.amberLine };
  return           { verdict:"High risk",     score:"F",  color:R.red,    bg:R.redLight, border:R.redBorder };
};

const CRO_GRADE = (pct) => { // pct = total/revenue*100
  if (pct<3)  return { verdict:"Low exposure",     score:"A+", color:R.green,  bg:R.greenBg,  border:R.greenLine };
  if (pct<5)  return { verdict:"Moderate",         score:"B",  color:"#15803d",bg:R.greenBg,  border:R.greenLine };
  if (pct<8)  return { verdict:"Significant",      score:"C",  color:R.amber,  bg:R.amberBg,  border:R.amberLine };
  if (pct<12) return { verdict:"High impact",      score:"D",  color:"#b45309",bg:R.amberBg,  border:R.amberLine };
  return             { verdict:"Critical",         score:"F",  color:R.red,    bg:R.redLight, border:R.redBorder };
};

const SLIDER_LABELS = ["Rarely miss — very confident","Accurate, occasional surprises","Mixed — some periods hard to predict","Often surprised by actuals","Frequently wrong, significant gaps"];
const SLIDER_MAPE   = [8, 15, 22, 32, 44];
const SLIDER_BIAS   = [.50,.52,.55,.57,.60];

const useMobile = () => {
  const [mobile, setMobile] = useState(() => window.innerWidth < 600);
  useEffect(() => {
    const h = () => setMobile(window.innerWidth < 600);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return mobile;
};

const SectionLabel = ({ children }) => (
  <div style={{ fontSize:10, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, letterSpacing:"3px", textTransform:"uppercase", color:R.muted, marginBottom:12 }}>{children}</div>
);
const Field = ({ label, error, hint, children, span=1 }) => (
  <div style={{ gridColumn:`span ${span}`, marginBottom:16 }}>
    <div style={{ fontSize:11, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600, letterSpacing:"2px", textTransform:"uppercase", color:error?R.red:R.charcoal, marginBottom:6 }}>{label}</div>
    {children}
    {hint  && <div style={{ fontSize:11, color:R.muted, marginTop:4 }}>{hint}</div>}
    {error && <div style={{ fontSize:11, color:R.red,   marginTop:4 }}>{error}</div>}
  </div>
);
const Divider = () => <div style={{ borderTop:`1px solid ${R.line}`, margin:"20px 0" }} />;
const Card = ({ children, style={} }) => (
  <div style={{ background:R.white, border:`1px solid ${R.line}`, borderRadius:2, ...style }}>{children}</div>
);
const Steps = ({ step, mobile }) => (
  <div style={{ display:"flex", alignItems:"center", gap:0, marginBottom:28 }}>
    {[["01","Data entry"],["02","Parameters"],["03","Results"],["04","Done"]].map(([n,label],i) => {
      const done=i<step, active=i===step;
      return (
        <div key={i} style={{ display:"flex", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:26, height:26, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
              background:done?R.red:active?R.black:"transparent",
              border:`2px solid ${done?R.red:active?R.black:R.line}`,
              fontSize:10, fontFamily:"'DM Mono',monospace", color:done||active?"#fff":R.muted, transition:"all .3s", flexShrink:0 }}>
              {done?"✓":n}
            </div>
            {!mobile && <span className="step-label" style={{ fontSize:11, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600, letterSpacing:"1.5px", textTransform:"uppercase", color:active?R.black:R.muted }}>{label}</span>}
          </div>
          {i<3 && <div className="step-conn" style={{ width:mobile?20:32, height:1, background:i<step?R.red:R.line, margin:mobile?"0 6px":"0 10px", transition:"background .4s" }} />}
        </div>
      );
    })}
  </div>
);

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconCFO = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect x="4" y="8" width="24" height="18" rx="2" stroke="#e30003" strokeWidth="1.8"/>
    <path d="M4 13h24" stroke="#e30003" strokeWidth="1.8"/>
    <rect x="8" y="17" width="5" height="5" rx="1" fill="#e30003" opacity=".3"/>
    <rect x="15" y="17" width="5" height="5" rx="1" fill="#e30003" opacity=".6"/>
    <rect x="22" y="15" width="2" height="7" rx="1" fill="#e30003"/>
    <path d="M10 6v4M22 6v4" stroke="#e30003" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);
const IconCRO = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="10" r="4" stroke="#e30003" strokeWidth="1.8"/>
    <path d="M8 26c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="#e30003" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M22 14l3-3m0 0l2 2m-2-2v4" stroke="#e30003" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function SineraTCFI() {
  useEffect(() => { boot(); }, []);
  const mobile = useMobile();

  const [persona, setPersona] = useState(null); // 'cfo' | 'cro'
  const [step, setStep]       = useState(0);
  const [mode, setMode]       = useState("period");
  const [slider, setSlider]   = useState(2);

  const getDefaultPeriods = () => {
    const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const now=new Date();
    return Array.from({length:6},(_,i)=>{
      const d=new Date(now.getFullYear(),now.getMonth()-5+i,1);
      return {period:`${months[d.getMonth()]} ${d.getFullYear()}`,f:"",a:""};
    });
  };
  const [rows,  setRows]  = useState(getDefaultPeriods);
  const [biz,   setBiz]   = useState({ revenue:"", margin:"", leadTime:"8", currency:"GBP" });
  const [cro,   setCro]   = useState({ reps:"", quota:"", otd:"88" });
  const [lead,  setLead]  = useState({ name:"", email:"", company:"", role:"" });
  const [gdpr,  setGdpr]  = useState(false);
  const [errs,  setErrs]  = useState({});
  const [busy,  setBusy]  = useState(false);

  const periodCalc = useMemo(() => {
    const valid=rows.filter(r=>+r.a>0&&+r.f>=0&&r.a!=="");
    if (!valid.length) return null;
    const n=valid.length;
    const wmape=(valid.reduce((s,r)=>s+Math.abs(+r.a-+r.f),0)/valid.reduce((s,r)=>s+(+r.a),0))*100;
    const mape=(valid.reduce((s,r)=>s+Math.abs(+r.a-+r.f)/+r.a,0)/n)*100;
    const bias=(valid.reduce((s,r)=>s+(+r.f-+r.a)/+r.a,0)/n)*100;
    const overC=valid.filter(r=>+r.f>+r.a).length;
    return {mape,wmape,bias,biasSplit:overC/n,n};
  }, [rows]);

  const activeMAPE = mode==="period"?(periodCalc?.wmape??0):SLIDER_MAPE[slider];
  const activeBias = mode==="period"?(periodCalc?.biasSplit??0.55):SLIDER_BIAS[slider];
  const S = sym(biz.currency||"GBP");

  // Compute results
  const cfoResult = useMemo(() => {
    if (!biz.revenue||!biz.margin) return null;
    return cfoEngine({ revenue:+biz.revenue, gm:+biz.margin, mape:activeMAPE, leadWeeks:+biz.leadTime||8, bias:activeBias, currency:biz.currency });
  }, [biz, activeMAPE, activeBias]);

  const croResult = useMemo(() => {
    if (!biz.revenue||!biz.margin||!cro.reps||!cro.quota) return null;
    return croEngine({ revenue:+biz.revenue, gm:+biz.margin, mape:activeMAPE, reps:+cro.reps, quota:+cro.quota, otd:+cro.otd||88, bias:activeBias });
  }, [biz, cro, activeMAPE, activeBias]);

  const updateRow=(i,k,v)=>setRows(r=>r.map((row,j)=>j===i?{...row,[k]:v}:row));
  const addRow=()=>setRows(r=>[...r,{period:`Period ${r.length+1}`,f:"",a:""}]);
  const removeRow=(i)=>rows.length>1&&setRows(r=>r.filter((_,j)=>j!==i));

  const validateBiz=()=>{
    const e={};
    if (!biz.revenue||isNaN(biz.revenue)||+biz.revenue<=0) e.revenue="Enter a valid revenue figure";
    if (!biz.margin||isNaN(biz.margin)||+biz.margin<=0||+biz.margin>=100) e.margin="Enter gross margin between 1–99%";
    if (persona==="cfo"&&(!biz.leadTime||isNaN(biz.leadTime)||+biz.leadTime<=0)) e.leadTime="Enter planning lead time in weeks";
    if (persona==="cro"&&(!cro.reps||+cro.reps<=0)) e.reps="Enter number of sales reps";
    if (persona==="cro"&&(!cro.quota||+cro.quota<=0)) e.quota="Enter average annual quota per rep";
    return e;
  };
  const validateLead=()=>{
    const e={};
    if (!lead.name.trim()) e.name="Required";
    if (!lead.email.includes('@')||!lead.email.includes('.')) e.email="Valid work email required";
    if (!lead.company.trim()) e.company="Required";
    if (!gdpr) e.gdpr="You must agree to continue";
    return e;
  };

  const goToResults=()=>{
    const e=validateBiz();
    if (Object.keys(e).length){setErrs(e);return;}
    setErrs({});setStep(2);
  };

  const handleSubmit=async()=>{
    const e=validateLead();if(Object.keys(e).length){setErrs(e);return;}
    setErrs({});setBusy(true);
    try {
      const nameParts=lead.name.trim().split(" ");
      const params=new URLSearchParams({
        oid:"00Dd3000004duXu",
        first_name:nameParts[0], last_name:nameParts.slice(1).join(" ")||nameParts[0],
        email:lead.email, company:lead.company,
        title:lead.role||(persona==="cfo"?"CFO / Finance":"CRO / Sales"),
        lead_source:"Forecast Inaccuracy Tool",
        "00Nd3000007peNZ":activeMAPE.toFixed(2),
        "00Nd3000007peAg":biz.revenue,
        "00Nd3000007pePB":biz.currency + "-" + (persona||"CFO").toUpperCase(),
      });
      await fetch("https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8",{
        method:"POST",mode:"no-cors",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:params.toString(),
      });
    } catch(err){console.error("SF error:",err);}
    await new Promise(r=>setTimeout(r,600));
    setBusy(false);setStep(3);
  };

  const cardPad   = mobile?"16px":"28px 32px";
  const cardPadSm = mobile?"14px 16px":"24px 28px";
  const isCFO = persona==="cfo";
  const isCRO = persona==="cro";

  // ── PERSONA SELECTOR ────────────────────────────────────────────────────────
  if (!persona) return (
    <div style={{ background:R.bg, minHeight:"100vh", fontFamily:"'Barlow',sans-serif", padding:mobile?"24px 14px":"44px 20px" }}>
      <div style={{ maxWidth:700, margin:"0 auto" }}>
        <div className="fu" style={{ marginBottom:40 }}>
          <div style={{ fontSize:10, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, letterSpacing:"3px", textTransform:"uppercase", color:R.red, marginBottom:10 }}>Sinera Sales Lab</div>
          <h1 style={{ fontSize:"clamp(22px,5vw,38px)", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, color:R.black, lineHeight:1.1, marginBottom:12, letterSpacing:"-0.5px" }}>
            What Is Your Forecast<br/><span style={{ color:R.red }}>Inaccuracy Costing You?</span>
          </h1>
          <p style={{ color:R.grey, fontSize:mobile?13:14, lineHeight:1.75 }}>
            Select your perspective. We apply industry benchmark research to quantify the impact of forecast inaccuracy in under 4 minutes.
          </p>
        </div>

        <div className="fu2 persona-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:32 }}>

          {/* CFO Card */}
          <div className="persona-card" onClick={()=>{setPersona("cfo");}} style={{ position:"relative" }}>
            <div style={{ marginBottom:16 }}><IconCFO /></div>
            <div style={{ fontSize:11, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, letterSpacing:"2.5px", textTransform:"uppercase", color:R.red, marginBottom:6 }}>Financial impact</div>
            <div style={{ fontSize:mobile?16:20, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, color:R.black, marginBottom:8, lineHeight:1.2 }}>Cost of Forecast Inaccuracy</div>
            <div style={{ fontSize:13, color:R.grey, lineHeight:1.6, marginBottom:16 }}>
              Quantify the annual financial cost across inventory, stockouts, production disruption, and planning overhead.
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {["CFO","Finance Director","COO"].map(t=>(
                <span key={t} style={{ fontSize:10, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600, letterSpacing:"1.5px", textTransform:"uppercase", background:R.bg, border:`1px solid ${R.line}`, borderRadius:2, padding:"3px 8px", color:R.charcoal }}>{t}</span>
              ))}
            </div>
            <div style={{ marginTop:20, display:"flex", alignItems:"center", gap:6, fontSize:12, fontWeight:600, color:R.red, fontFamily:"'Barlow',sans-serif" }}>
              Calculate financial cost <span style={{ fontSize:16 }}>→</span>
            </div>
          </div>

          {/* CRO Card */}
          <div className="persona-card" onClick={()=>{setPersona("cro");}} style={{ position:"relative" }}>
            <div style={{ marginBottom:16 }}><IconCRO /></div>
            <div style={{ fontSize:11, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, letterSpacing:"2.5px", textTransform:"uppercase", color:R.red, marginBottom:6 }}>Revenue impact</div>
            <div style={{ fontSize:mobile?16:20, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, color:R.black, marginBottom:8, lineHeight:1.2 }}>Revenue Lost to Forecast Inaccuracy</div>
            <div style={{ fontSize:13, color:R.grey, lineHeight:1.6, marginBottom:16 }}>
              Quantify revenue lost to stockouts, OTD failures, sales rep firefighting, and commercial margin dilution.
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {["CRO","VP Sales","Commercial Director"].map(t=>(
                <span key={t} style={{ fontSize:10, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600, letterSpacing:"1.5px", textTransform:"uppercase", background:R.bg, border:`1px solid ${R.line}`, borderRadius:2, padding:"3px 8px", color:R.charcoal }}>{t}</span>
              ))}
            </div>
            <div style={{ marginTop:20, display:"flex", alignItems:"center", gap:6, fontSize:12, fontWeight:600, color:R.red, fontFamily:"'Barlow',sans-serif" }}>
              Calculate revenue impact <span style={{ fontSize:16 }}>→</span>
            </div>
          </div>
        </div>

        <div className="fu3" style={{ textAlign:"center" }}>
          <div style={{ fontSize:12, color:R.muted }}>Both tools use the same forecast accuracy data — switch perspective at any time</div>
        </div>
      </div>
    </div>
  );

  // ── MAIN TOOL ───────────────────────────────────────────────────────────────
  return (
    <div style={{ background:R.bg, minHeight:"100vh", fontFamily:"'Barlow',sans-serif", padding:mobile?"24px 14px":"44px 20px" }}>
      <div style={{ maxWidth:700, margin:"0 auto" }}>

        {/* Header */}
        <div className="fu" style={{ marginBottom:28 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
            <button onClick={()=>{setPersona(null);setStep(0);setErrs({});}} style={{ background:"none", border:`1px solid ${R.line}`, borderRadius:2, padding:"4px 10px", fontSize:11, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600, letterSpacing:"1.5px", textTransform:"uppercase", color:R.muted, cursor:"pointer", transition:"all .15s" }}
              onMouseOver={e=>e.target.style.borderColor="#aaa"} onMouseOut={e=>e.target.style.borderColor=R.line}>
              ← Switch
            </button>
            <span style={{ fontSize:10, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", color:R.red }}>
              {isCFO?"Financial Impact":"Revenue Impact"}
            </span>
          </div>
          <h1 style={{ fontSize:"clamp(20px,4vw,34px)", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, color:R.black, lineHeight:1.15, marginBottom:8, letterSpacing:"-0.3px" }}>
            {isCFO ? <>What Is Forecast Inaccuracy<br/><span style={{ color:R.red }}>Costing Your Business?</span></> : <>How Much Revenue Is Forecast<br/><span style={{ color:R.red }}>Inaccuracy Costing Your Team?</span></>}
          </h1>
          <p style={{ color:R.grey, fontSize:mobile?13:14, lineHeight:1.7 }}>
            {isCFO ? "Enter your forecast data. We apply 11 industry benchmark defaults and return your total cost of forecast inaccuracy." : "Enter your forecast data and sales team parameters. We quantify revenue lost across 4 categories using research benchmarks."}
          </p>
        </div>

        <div className="fu2"><Steps step={step} mobile={mobile} /></div>

        {/* ── STEP 0: DATA ENTRY ─────────────────────────────────────────────── */}
        {step===0 && (
          <div className="fu">
            <div style={{ display:"flex", background:R.white, border:`1px solid ${R.line}`, borderRadius:2, padding:3, gap:3, marginBottom:18, width:"fit-content" }}>
              {[["period","I have period data"],["slider","Quick estimate"]].map(([m,label])=>(
                <button key={m} className="tab-btn" onClick={()=>setMode(m)} style={{
                  background:mode===m?R.black:"transparent", color:mode===m?"#fff":R.muted,
                  boxShadow:mode===m?"0 1px 3px rgba(0,0,0,.15)":"none",
                  fontSize:mobile?11:12, padding:mobile?"7px 12px":"8px 18px",
                }}>{label}</button>
              ))}
            </div>

            {mode==="period" && (
              <Card style={{ overflow:"hidden", marginBottom:16 }}>
                <div style={{ background:R.black, padding:mobile?"8px 12px":"10px 18px" }}>
                  {mobile ? (
                    <div style={{ fontSize:9, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600, letterSpacing:"2px", textTransform:"uppercase", color:"rgba(255,255,255,.5)" }}>Period · Forecast · Actual</div>
                  ) : (
                    <div style={{ display:"grid", gridTemplateColumns:"160px 1fr 1fr 36px", gap:10 }}>
                      {["Period","Forecast (£/$)","Actual (£/$)",""].map((h,i)=>(
                        <div key={i} style={{ fontSize:9, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600, letterSpacing:"2.5px", textTransform:"uppercase", color:"rgba(255,255,255,.5)", textAlign:i>0&&i<3?"right":"left" }}>{h}</div>
                      ))}
                    </div>
                  )}
                  <div style={{ fontSize:10, color:"rgba(255,255,255,.3)", marginTop:6 }}>
                    {mobile?"Pull from your ERP or spreadsheet":"Enter monthly or quarterly totals — pull from your ERP, finance report, or spreadsheet"}
                  </div>
                </div>
                {rows.map((row,i)=>(
                  mobile ? (
                    <div key={i} className="row-h" style={{ padding:"10px 12px", borderBottom:`1px solid ${R.bg}`, background:R.white }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                        <input className="s-inp" value={row.period} onChange={e=>updateRow(i,"period",e.target.value)} style={{ fontSize:12, fontFamily:"'DM Mono',monospace", padding:"6px 8px", flex:1 }} />
                        <button className="del-btn" onClick={()=>removeRow(i)} style={{ background:"none", border:"none", color:R.muted, cursor:"pointer", fontSize:18, lineHeight:1, padding:"0 2px" }}>×</button>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                        {[["f","Forecast"],["a","Actual"]].map(([k,lbl])=>(
                          <div key={k}>
                            <div style={{ fontSize:9, color:R.muted, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600, letterSpacing:"2px", textTransform:"uppercase", marginBottom:3 }}>{lbl}</div>
                            <input className="s-inp" type="number" value={row[k]} placeholder="0" onChange={e=>updateRow(i,k,e.target.value)} style={{ textAlign:"right", fontSize:13, fontFamily:"'DM Mono',monospace", padding:"7px 8px" }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div key={i} className="row-h" style={{ display:"grid", gridTemplateColumns:"160px 1fr 1fr 36px", padding:"8px 18px", gap:10, borderBottom:`1px solid ${R.bg}`, background:R.white, alignItems:"center" }}>
                      <input className="s-inp" value={row.period} onChange={e=>updateRow(i,"period",e.target.value)} style={{ fontSize:12, fontFamily:"'DM Mono',monospace", padding:"7px 10px" }} />
                      <input className="s-inp" type="number" value={row.f} placeholder="0" onChange={e=>updateRow(i,"f",e.target.value)} style={{ textAlign:"right", fontSize:12, fontFamily:"'DM Mono',monospace", padding:"7px 10px" }} />
                      <input className="s-inp" type="number" value={row.a} placeholder="0" onChange={e=>updateRow(i,"a",e.target.value)} style={{ textAlign:"right", fontSize:12, fontFamily:"'DM Mono',monospace", padding:"7px 10px" }} />
                      <button className="del-btn" onClick={()=>removeRow(i)} style={{ background:"none", border:"none", color:R.muted, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
                    </div>
                  )
                ))}
                <div style={{ padding:mobile?"10px 12px":"12px 18px", borderTop:`1px solid ${R.bg}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <button className="add-row" onClick={addRow} style={{ opacity:rows.length>=12?0.4:1, pointerEvents:rows.length>=12?"none":"auto" }}>+ Add period</button>
                  <span style={{ fontSize:11, color:R.muted }}>Up to 12 periods</span>
                </div>
              </Card>
            )}

            {mode==="slider" && (
              <Card style={{ padding:cardPadSm, marginBottom:16 }}>
                <SectionLabel>Self-assessment</SectionLabel>
                <div style={{ fontSize:14, color:R.charcoal, marginBottom:22, fontWeight:500 }}>How accurately does your team forecast demand?</div>
                <input type="range" min={0} max={4} step={1} value={slider} onChange={e=>setSlider(+e.target.value)} style={{ marginBottom:12 }} />
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:R.muted, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600, letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:20 }}>
                  <span>Very accurate</span><span>Frequently wrong</span>
                </div>
                <div style={{ background:R.bg, border:`1px solid ${R.line}`, borderLeft:`3px solid ${R.red}`, borderRadius:2, padding:"14px 18px" }}>
                  <div style={{ fontSize:14, color:R.black, fontWeight:600, marginBottom:4 }}>{SLIDER_LABELS[slider]}</div>
                  <div style={{ fontSize:12, color:R.muted }}>Mapped WMAPE estimate: <strong style={{ fontFamily:"'DM Mono',monospace", color:R.black }}>{SLIDER_MAPE[slider]}%</strong></div>
                </div>
              </Card>
            )}

            {mode==="period" && periodCalc && (
              <Card style={{ padding:cardPadSm, marginBottom:16, borderLeft:`3px solid ${R.red}` }}>
                <SectionLabel>Live calculation · {periodCalc.n} period{periodCalc.n!==1?"s":""} entered</SectionLabel>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:mobile?12:20 }}>
                  {[["WMAPE",`${periodCalc.wmape.toFixed(1)}%`,"Primary metric"],["MAPE",`${periodCalc.mape.toFixed(1)}%`,"Unweighted"],["Bias",`${periodCalc.bias>0?"+":""}${periodCalc.bias.toFixed(1)}%`,periodCalc.bias>1?"Over-forecasting":periodCalc.bias<-1?"Under-forecasting":"Balanced"]].map(([l,v,s],i)=>(
                    <div key={i}>
                      <div style={{ fontSize:mobile?18:24, fontFamily:"'DM Mono',monospace", fontWeight:500, color:R.red }}>{v}</div>
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

        {/* ── STEP 1: PARAMETERS ─────────────────────────────────────────────── */}
        {step===1 && (
          <div className="fu">
            <Card style={{ padding:cardPad, marginBottom:16 }}>
              <SectionLabel>{isCFO?"Company parameters":"Sales & company parameters"}</SectionLabel>
              <Divider />

              <Field label="Reporting currency">
                <div style={{ display:"flex", gap:8 }}>
                  {[["GBP","£ GBP — Sterling"],["USD","$ USD — Dollar"]].map(([v,label])=>(
                    <button key={v} onClick={()=>setBiz(b=>({...b,currency:v}))} style={{ flex:1, padding:"10px", border:`1.5px solid ${biz.currency===v?R.red:R.line}`, borderRadius:2, background:biz.currency===v?R.red:"#fff", color:biz.currency===v?"#fff":R.grey, fontSize:mobile?12:13, fontFamily:"'Barlow',sans-serif", fontWeight:600, cursor:"pointer", transition:"all .15s" }}>
                      {mobile?(v==="GBP"?"£ GBP":"$ USD"):label}
                    </button>
                  ))}
                </div>
              </Field>

              <div style={{ display:"grid", gridTemplateColumns:mobile?"1fr":"1fr 1fr", gap:16 }}>
                <Field label={`Annual revenue (${S})`} error={errs.revenue} hint="Last 12 months manufacturing revenue" span={mobile?1:2}>
                  <div style={{ display:"flex" }}>
                    <span style={{ background:R.bg, border:`1px solid ${R.line}`, borderRight:"none", borderRadius:"2px 0 0 2px", padding:"10px 12px", fontSize:13, color:R.muted, fontFamily:"'DM Mono',monospace" }}>{S}</span>
                    <input className="s-inp" type="number" placeholder="10,000,000" value={biz.revenue} onChange={e=>{setBiz(b=>({...b,revenue:e.target.value}));setErrs(er=>({...er,revenue:null}));}} style={{ borderRadius:"0 2px 2px 0", borderLeft:"none" }} />
                  </div>
                </Field>

                <Field label="Gross margin %" error={errs.margin} hint="Revenue minus COGS">
                  <div style={{ display:"flex" }}>
                    <input className="s-inp" type="number" placeholder="38" min="1" max="99" value={biz.margin} onChange={e=>{setBiz(b=>({...b,margin:e.target.value}));setErrs(er=>({...er,margin:null}));}} style={{ borderRadius:"2px 0 0 2px", borderRight:"none" }} />
                    <span style={{ background:R.bg, border:`1px solid ${R.line}`, borderLeft:"none", borderRadius:"0 2px 2px 0", padding:"10px 12px", fontSize:13, color:R.muted, fontFamily:"'DM Mono',monospace" }}>%</span>
                  </div>
                </Field>

                {isCFO && (
                  <Field label="Planning lead time" error={errs.leadTime} hint="Weeks your schedule is frozen">
                    <div style={{ display:"flex" }}>
                      <input className="s-inp" type="number" placeholder="8" min="1" max="52" value={biz.leadTime} onChange={e=>{setBiz(b=>({...b,leadTime:e.target.value}));setErrs(er=>({...er,leadTime:null}));}} style={{ borderRadius:"2px 0 0 2px", borderRight:"none" }} />
                      <span style={{ background:R.bg, border:`1px solid ${R.line}`, borderLeft:"none", borderRadius:"0 2px 2px 0", padding:"10px 12px", fontSize:13, color:R.muted, fontFamily:"'DM Mono',monospace" }}>wks</span>
                    </div>
                  </Field>
                )}

                {isCRO && (<>
                  <Field label="Sales reps" error={errs.reps} hint="Number of quota-carrying reps">
                    <input className="s-inp" type="number" placeholder="12" min="1" value={cro.reps} onChange={e=>{setCro(c=>({...c,reps:e.target.value}));setErrs(er=>({...er,reps:null}));}} />
                  </Field>

                  <Field label={`Avg annual quota / rep (${S})`} error={errs.quota} hint="Average revenue target per rep">
                    <div style={{ display:"flex" }}>
                      <span style={{ background:R.bg, border:`1px solid ${R.line}`, borderRight:"none", borderRadius:"2px 0 0 2px", padding:"10px 12px", fontSize:13, color:R.muted, fontFamily:"'DM Mono',monospace" }}>{S}</span>
                      <input className="s-inp" type="number" placeholder="800,000" value={cro.quota} onChange={e=>{setCro(c=>({...c,quota:e.target.value}));setErrs(er=>({...er,quota:null}));}} style={{ borderRadius:"0 2px 2px 0", borderLeft:"none" }} />
                    </div>
                  </Field>

                  <Field label="Current OTD rate %" hint="% of orders delivered on time (default 88%)">
                    <div style={{ display:"flex" }}>
                      <input className="s-inp" type="number" placeholder="88" min="1" max="100" value={cro.otd} onChange={e=>setCro(c=>({...c,otd:e.target.value}))} style={{ borderRadius:"2px 0 0 2px", borderRight:"none" }} />
                      <span style={{ background:R.bg, border:`1px solid ${R.line}`, borderLeft:"none", borderRadius:"0 2px 2px 0", padding:"10px 12px", fontSize:13, color:R.muted, fontFamily:"'DM Mono',monospace" }}>%</span>
                    </div>
                  </Field>
                </>)}
              </div>

              <Divider />
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
              <button className="s-btn" onClick={goToResults}>See my results →</button>
            </div>
          </div>
        )}

        {/* ── STEP 2: RESULTS + EMAIL GATE ───────────────────────────────────── */}
        {step===2 && (() => {
          const res  = isCFO ? cfoResult : croResult;
          const totalPct = res ? (res.total / +biz.revenue * 100) : 0;
          const grade = isCFO ? CFO_GRADE(activeMAPE) : CRO_GRADE(totalPct);

          const cfoCats = res ? [
            { code:"C1", label:"Inventory Overstock",     desc:"Carrying cost on excess stock",              val:res.c1, pct:res.c1/res.total*100, bg:"#92400e", light:"#fffbeb" },
            { code:"C2", label:"Stockout & Lost Margin",  desc:"Lost sales and expediting cost",             val:res.c2, pct:res.c2/res.total*100, bg:R.red,     light:"#fff0f0" },
            { code:"C3", label:"Production Disruption",   desc:"Changeover cost and overtime premium",       val:res.c3, pct:res.c3/res.total*100, bg:R.blue,    light:R.blueBg  },
            { code:"C4", label:"Planning Overhead",       desc:"Time and resource cost of managing variance", val:res.c4, pct:res.c4/res.total*100, bg:R.purple,  light:R.purpleBg},
          ] : [];
          const croCats = res ? [
            { code:"R1", label:"Lost Revenue — Stockouts",   desc:"Unfulfilled demand from under-forecasting",      val:res.r1, pct:res.r1/res.total*100, bg:"#92400e", light:"#fffbeb" },
            { code:"R2", label:"Revenue at Risk — OTD",      desc:"Customer attrition from delivery failures",      val:res.r2, pct:res.r2/res.total*100, bg:R.red,     light:"#fff0f0" },
            { code:"R3", label:"Sales Capacity Lost",        desc:"Rep time lost to supply firefighting",           val:res.r3, pct:res.r3/res.total*100, bg:R.blue,    light:R.blueBg  },
            { code:"R4", label:"Commercial Margin Dilution", desc:"Emergency discounts and freight absorption",     val:res.r4, pct:res.r4/res.total*100, bg:R.purple,  light:R.purpleBg},
          ] : [];
          const cats = isCFO ? cfoCats : croCats;

          return (
            <div className="fu">
              {/* ── Summary (always visible) ── */}
              <Card style={{ overflow:"hidden", marginBottom:16 }}>
                {/* Score card */}
                <div style={{ background:R.black, padding:mobile?"16px 18px":"20px 28px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:mobile?14:20 }}>
                    <div style={{ background:R.red, borderRadius:3, width:mobile?68:80, height:mobile?68:80, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <div style={{ fontSize:mobile?26:32, fontWeight:700, color:"#fff", lineHeight:1, fontFamily:"'Barlow Condensed',sans-serif" }}>{grade.score}</div>
                      <div style={{ fontSize:8, fontWeight:700, color:"rgba(255,255,255,.5)", letterSpacing:"2px", textTransform:"uppercase", fontFamily:"'Barlow Condensed',sans-serif" }}>GRADE</div>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:9, color:"rgba(255,255,255,.4)", textTransform:"uppercase", letterSpacing:"2px", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600, marginBottom:4 }}>
                        {isCFO?"Forecast accuracy":"Forecast accuracy"} · {lead.company||"Your company"}
                      </div>
                      <div style={{ fontSize:mobile?22:28, fontWeight:700, color:"#fff", lineHeight:1, fontFamily:"'DM Mono',monospace", marginBottom:8 }}>{activeMAPE.toFixed(1)}% WMAPE</div>
                      <span style={{ background:grade.bg, color:grade.color, fontSize:10, fontWeight:700, letterSpacing:"1px", textTransform:"uppercase", padding:"3px 10px", borderRadius:2, fontFamily:"'Barlow Condensed',sans-serif" }}>{grade.verdict}</span>
                    </div>
                    {!mobile && res && (
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:9, color:"rgba(255,255,255,.4)", textTransform:"uppercase", letterSpacing:"1.5px", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600, marginBottom:4 }}>Annual revenue</div>
                        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:16, fontWeight:700, color:R.red }}>{fmt(+biz.revenue,S)}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Total cost banner */}
                {res && (
                  <div style={{ background:R.red, padding:mobile?"14px 18px":"16px 28px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
                    <div>
                      <div style={{ fontSize:9, fontWeight:700, color:"rgba(255,255,255,.6)", textTransform:"uppercase", letterSpacing:"2px", fontFamily:"'Barlow Condensed',sans-serif", marginBottom:3 }}>
                        {isCFO?"Estimated total cost of forecast inaccuracy":"Estimated total revenue impact"}
                      </div>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,.5)", fontFamily:"'Barlow',sans-serif" }}>Base case · Industry benchmark defaults</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:mobile?24:30, fontWeight:700, color:"#fff", lineHeight:1 }}>{fmt(res.total,S)}</div>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,.7)", marginTop:3 }}>{totalPct.toFixed(1)}% of revenue</div>
                    </div>
                  </div>
                )}
              </Card>

              {/* ── Blurred breakdown + email gate ── */}
              <Card style={{ overflow:"hidden", marginBottom:16 }}>
                <div style={{ padding:mobile?"14px 16px":"18px 24px", borderBottom:`1px solid ${R.line}` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:32, height:32, background:R.red, borderRadius:2, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><rect x="5" y="8" width="8" height="8" rx="1" fill="white"/><path d="M6 8V6a3 3 0 016 0v2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:R.black, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:"-.2px" }}>
                        {isCFO?"Full C1–C4 cost breakdown":"Full R1–R4 revenue breakdown"}
                      </div>
                      <div style={{ fontSize:12, color:R.grey }}>Enter your details below — we'll email you the complete analysis</div>
                    </div>
                  </div>
                </div>

                {/* Blurred categories */}
                <div style={{ position:"relative" }}>
                  <div style={{ filter:"blur(5px)", pointerEvents:"none", userSelect:"none", padding:mobile?"12px 16px":"16px 24px" }}>
                    {cats.map((cat,i)=>(
                      <div key={i} style={{ display:"flex", border:`1px solid ${R.line}`, borderRadius:2, overflow:"hidden", marginBottom:8 }}>
                        <div style={{ background:cat.bg, width:44, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          <div style={{ fontSize:10, fontWeight:700, color:"#fff", fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:"1px" }}>{cat.code}</div>
                        </div>
                        <div style={{ padding:"10px 14px", background:cat.light, flex:1 }}>
                          <div style={{ fontSize:12, fontWeight:700, color:R.black, marginBottom:1 }}>{cat.label}</div>
                          <div style={{ fontSize:11, color:R.grey }}>{cat.desc}</div>
                        </div>
                        <div style={{ padding:"10px 14px", background:cat.light, textAlign:"right", flexShrink:0 }}>
                          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:13, fontWeight:700, color:cat.bg }}>{fmt(cat.val,S)}</div>
                          <div style={{ fontSize:10, color:R.muted }}>{cat.pct.toFixed(0)}% of total</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ position:"absolute", inset:0, background:"rgba(247,247,247,0.6)", backdropFilter:"blur(2px)" }} />
                </div>

                {/* Email form */}
                <div style={{ padding:mobile?"16px":"20px 24px", borderTop:`1px solid ${R.line}` }}>
                  <SectionLabel>{isCFO?"Send me the cost breakdown":"Send me the revenue analysis"}</SectionLabel>
                  <div style={{ display:"grid", gridTemplateColumns:mobile?"1fr":"1fr 1fr", gap:12, marginBottom:12 }}>
                    {[
                      {k:"name",    l:"Full name",          ph:"Jane Smith",         span:mobile?1:1},
                      {k:"company", l:"Company",            ph:"Acme Manufacturing", span:mobile?1:1},
                      {k:"email",   l:"Work email",         ph:"jane@company.com",   span:mobile?1:2},
                      {k:"role",    l:"Your role (optional)",ph:isCFO?"CFO, Finance Director…":"CRO, VP Sales…", span:mobile?1:2},
                    ].map(({k,l,ph,span})=>(
                      <Field key={k} label={l} error={errs[k]} span={span}>
                        <input className="s-inp" placeholder={ph} value={lead[k]} onChange={e=>{setLead(f=>({...f,[k]:e.target.value}));setErrs(er=>({...er,[k]:null}));}} />
                      </Field>
                    ))}
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12, marginBottom:14 }}>
                    <button className="s-btn-ghost" onClick={()=>setStep(1)}>← Back</button>
                    <button className="s-btn" onClick={handleSubmit} disabled={busy} style={{ minWidth:mobile?140:180, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                      {busy?(<><svg style={{ animation:"spin 1s linear infinite" }} width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="rgba(255,255,255,.3)" strokeWidth="1.5"/><path d="M7 1.5a5.5 5.5 0 015.5 5.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg>Sending…</>):"Send full report →"}
                    </button>
                  </div>
                  <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                    <input type="checkbox" id="gdpr" checked={gdpr} onChange={e=>{setGdpr(e.target.checked);setErrs(er=>({...er,gdpr:null}));}} style={{ marginTop:3, accentColor:R.red, width:14, height:14, cursor:"pointer", flexShrink:0 }} />
                    <div>
                      <label htmlFor="gdpr" style={{ fontSize:12, color:R.grey, lineHeight:1.6, cursor:"pointer" }}>
                        I agree to Sinera Sales Lab storing my details to send this report and follow up.{" "}
                        <a href="https://sinerasaleslab.com/privacy-policy/" target="_blank" rel="noreferrer" style={{ color:R.red }}>Privacy Policy</a>
                      </label>
                      {errs.gdpr && <div style={{ fontSize:11, color:R.red, marginTop:3 }}>{errs.gdpr}</div>}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          );
        })()}

        {/* ── STEP 3: CONFIRMATION ───────────────────────────────────────────── */}
        {step===3 && (
          <div className="fu">
            <div style={{ textAlign:"center", padding:mobile?"32px 0 24px":"48px 0 32px" }}>
              <div style={{ width:72, height:72, background:R.red, borderRadius:2, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M6 16l7 7L26 9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div style={{ fontSize:mobile?20:26, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, color:R.black, marginBottom:10 }}>Your report is on its way</div>
              <div style={{ fontSize:14, color:R.grey, lineHeight:1.7, maxWidth:420, margin:"0 auto 28px" }}>
                We have sent your full {isCFO?"cost breakdown":"revenue impact analysis"} to <strong style={{ color:R.black }}>{lead.email}</strong>. Check your inbox — including spam.
              </div>
            </div>

            <Card style={{ padding:cardPadSm, marginBottom:12 }}>
              <SectionLabel>What happens next</SectionLabel>
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                {[
                  ["01","Review the full breakdown",isCFO?"Your report shows C1–C4 costs, your benchmark position, and cost per MAPE point.":"Your report shows R1–R4 revenue impact, OTD analysis, and rep capacity loss."],
                  ["02","Pressure-test the assumptions","Every benchmark default is listed. The diagnostic replaces them with your actual data."],
                  ["03","Book a free 30-min call","Walk through the numbers with Sinera and validate assumptions against your real figures."],
                ].map(([n,title,desc])=>(
                  <div key={n} style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
                    <div style={{ width:28, height:28, borderRadius:2, background:R.red, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:2 }}>
                      <span style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color:"#fff", fontWeight:500 }}>{n}</span>
                    </div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:R.black, marginBottom:3 }}>{title}</div>
                      <div style={{ fontSize:12, color:R.grey, lineHeight:1.6 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div style={{ background:R.black, borderRadius:2, padding:mobile?"20px 16px":"24px 28px", display:"flex", flexDirection:mobile?"column":"row", justifyContent:"space-between", alignItems:mobile?"flex-start":"center", gap:16 }}>
              <div>
                <div style={{ fontSize:14, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, color:"#fff", marginBottom:4 }}>Ready to validate the numbers?</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,.55)" }}>Fixed scope · 5 days · No implementation required</div>
              </div>
              <a href="https://outlook.office.com/bookwithme/user/56a6b02253c942c9be2dc6efc834fbb4@sinerasaleslab.co.uk/meetingtype/agc2UJU3SEmHpe6CStUpQg2?anonymous&ismsaljsauthenabled"
                target="_blank" rel="noreferrer"
                style={{ background:R.red, color:"#fff", borderRadius:2, padding:"12px 24px", fontSize:13, fontFamily:"'Barlow',sans-serif", fontWeight:700, cursor:"pointer", letterSpacing:".5px", textTransform:"uppercase", textDecoration:"none", display:"inline-block", whiteSpace:"nowrap" }}>
                Book a free 30-min call
              </a>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
