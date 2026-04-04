import { useState, useEffect } from "react";

const DAYS = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const EGG_DAYS    = ["MON","TUE","WED","THU","FRI"];
const CHIKKI_DAYS = ["MON","WED","FRI"];
const RAGI_DAYS   = ["TUE","THU","SAT"];
const ITEMS = ["rice","eggs","chikki","ragi","jaggery"];

const HOL_TYPES = [
  { v:"",              l:"— Working Day —" },
  { v:"SUNDAY",        l:"SUNDAY" },
  { v:"HOLIDAY",       l:"HOLIDAY" },
  { v:"SCHOOL HOLIDAY",l:"SCHOOL HOLIDAY" },
  { v:"GOVT HOLIDAY",  l:"GOVT HOLIDAY" },
  { v:"VACATION",      l:"VACATION" },
  { v:"CUSTOM",        l:"Custom..." },
];

const HOL_COLORS = {
  "SUNDAY":         { bg:"#fff8e1", text:"#c00" },
  "HOLIDAY":        { bg:"#fce4ec", text:"#880e4f" },
  "SCHOOL HOLIDAY": { bg:"#e8f5e9", text:"#1b5e20" },
  "GOVT HOLIDAY":   { bg:"#e3f2fd", text:"#0d47a1" },
  "VACATION":       { bg:"#f3e5f5", text:"#4a148c" },
  "CUSTOM":         { bg:"#fff3e0", text:"#e65100" },
};

const INFO_FIELDS = [
  ["DISE CODE",               "dise_code",   120],
  ["Implementing Agency",     "agency_name", 120],
  ["Bank Name",               "bank_name",   120],
  ["Bank Account No.",        "account_no",  120],
  ["Working Days",            "working_days", 50],
  ["Average Meals Taken",     "avg_meals",    50],
  ["No. of Cook cum Helpers", "num_cooks",    50],
];

const BAL_ROWS = [
  ["OPENING BALANCE",      "open"],
  ["RECEIVED (ALLOTMENT)", "recv"],
  ["TOTAL (O.B.+RECD.)",   "total"],
  ["USED",                 "used_tot"],
  ["DAMAGED/EXPIRED",      "dmg"],
  ["CLOSING BALANCE",      "close"],
];

function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

function makeRow(date = "", day = "MON") {
  return {
    date, week_day: day,
    holiday_type: day === "SUN" ? "SUNDAY" : "",
    holiday_custom: "",
    roll: "", present: "", meals_taken: "",
    rice_used: "", eggs_used: "", chikki_used: "",
    ragi_used: "", jaggery_used: "",
    amount_per_child: "",
  };
}

function autoFill(r) {
  const p = parseFloat(r.present) || 0;
  if (!r.holiday_type && p > 0) {
    const rice         = (p * 0.1).toFixed(2);
    const meals_taken  = String(p);
    const eggs_used    = EGG_DAYS.includes(r.week_day)    ? String(p) : "";
    const chikki_used  = CHIKKI_DAYS.includes(r.week_day) ? String(p) : "";
    const ragi_used    = RAGI_DAYS.includes(r.week_day)   ? (p * 0.01).toFixed(3) : "";
    const jaggery_used = RAGI_DAYS.includes(r.week_day)   ? (p * 0.01).toFixed(3) : "";
    return { ...r, meals_taken, rice_used: rice, eggs_used, chikki_used, ragi_used, jaggery_used };
  }
  if (!r.holiday_type && p === 0)
    return { ...r, meals_taken:"", rice_used:"", eggs_used:"", chikki_used:"", ragi_used:"", jaggery_used:"" };
  return r;
}

function buildCalendar(month, year) {
  const m = parseInt(month), y = parseInt("20" + year);
  if (!m || !y || y < 2000 || y > 2099) return null;
  const dim = new Date(y, m, 0).getDate();
  return Array.from({ length: dim }, (_, i) => {
    const d = new Date(y, m - 1, i + 1);
    return { date: String(i + 1), day: DAYS[d.getDay()] };
  });
}

const defaultHdr = {
  village:"", mandal:"", month:"", year:"",
  dise_code:"", agency_name:"", bank_name:"", account_no:"",
  working_days:"", avg_meals:"", num_cooks:"",
  rice_open:"",    rice_recv:"",    rice_used_tot:"",    rice_dmg:"",
  eggs_open:"",    eggs_recv:"",    eggs_used_tot:"",    eggs_dmg:"",
  chikki_open:"",  chikki_recv:"",  chikki_used_tot:"",  chikki_dmg:"",
  ragi_open:"",    ragi_recv:"",    ragi_used_tot:"",    ragi_dmg:"",
  jaggery_open:"", jaggery_recv:"", jaggery_used_tot:"", jaggery_dmg:"",
};

const defaultFtr = {
  total_amount_words:"",
  boys_cls1:"", boys_cls2:"", boys_cls3:"", boys_cls4:"", boys_cls5:"",
  girls_cls1:"", girls_cls2:"", girls_cls3:"", girls_cls4:"", girls_cls5:"",
  sign_name:"", sign_date:"", head_master_name:"", school_name:"",
};

const pi = { border:"none", borderBottom:"1px solid #999", background:"transparent", fontFamily:"inherit", fontSize:"inherit", outline:"none", padding:"0 2px" };
const ci = { width:"100%", border:"none", background:"transparent", fontFamily:"inherit", fontSize:"inherit", textAlign:"center", outline:"none", padding:"0" };
const ss = (color, bold) => ({ width:"100%", border:"none", background:"transparent", fontFamily:"inherit", fontSize:"inherit", outline:"none", color: color||"#444", fontWeight: bold?"bold":"normal" });
const AS = ({ val, color }) => <span style={{ fontWeight:"bold", color:color||"#4a148c", display:"block", textAlign:"center", lineHeight:"1" }}>{val||"—"}</span>;
const Cell = ({ val, onChange }) => <input type="text" value={val} style={ci} onChange={e => { if(/^\d*$/.test(e.target.value)) onChange(e.target.value); }} />;
const CC = ({ val, onChange }) => <input type="text" value={val} style={{ width:34, border:"none", borderBottom:"1px solid #ccc", background:"transparent", fontFamily:"inherit", fontSize:"inherit", textAlign:"center", outline:"none", padding:"0" }} onChange={e => { if(/^\d*$/.test(e.target.value)) onChange(e.target.value); }} />;

export default function App() {
  const [hdr,  setHdr]  = useState(() => load("pmh8", defaultHdr));
  const [rows, setRows] = useState(() => load("pmr8", Array.from({ length:31 }, (_,i) => makeRow(String(i+1)))));
  const [ftr,  setFtr]  = useState(() => load("pmf8", defaultFtr));

  useEffect(() => { save("pmh8", hdr); },  [hdr]);
  useEffect(() => { save("pmr8", rows); }, [rows]);
  useEffect(() => { save("pmf8", ftr); },  [ftr]);

  const setH = (k, v) => {
    setHdr(h => {
      const next = { ...h, [k]: v };
      if (k === "month" || k === "year") applyCalendar(k==="month"?v:h.month, k==="year"?v:h.year);
      return next;
    });
  };

  const applyCalendar = (month, year) => {
    const cal = buildCalendar(month, year);
    if (!cal) return;
    setRows(prev => Array.from({ length:31 }, (_, i) => {
      if (i < cal.length) {
        const { date, day } = cal[i];
        const ex = prev[i] || {};
        return autoFill({ ...makeRow(date, day), ...(ex.date===date ? {
          roll: ex.roll, present: ex.present, meals_taken: ex.meals_taken,
          holiday_type: ex.holiday_type || (day==="SUN"?"SUNDAY":""),
          holiday_custom: ex.holiday_custom,
        } : {}) });
      }
      return makeRow("", "MON");
    }));
  };

  const setR = (i, k, v) => setRows(rs => rs.map((r, idx) => {
    if (idx !== i) return r;
    const upd = { ...r, [k]: v };
    if (k==="present"||k==="week_day"||k==="holiday_type") return autoFill(upd);
    return upd;
  }));

  const setF = (k, v) => setFtr(f => ({ ...f, [k]: v }));

  const AR = rows.filter(r => r.date);
  const apd = r => (!r.holiday_type && r.date) ? (parseFloat(r.meals_taken)||0)*6.19 : 0;
  const tRice    = AR.reduce((s,r)=>s+(parseFloat(r.rice_used)||0),0);
  const tEggs    = AR.reduce((s,r)=>s+(parseFloat(r.eggs_used)||0),0);
  const tChikki  = AR.reduce((s,r)=>s+(parseFloat(r.chikki_used)||0),0);
  const tRagi    = AR.reduce((s,r)=>s+(parseFloat(r.ragi_used)||0),0);
  const tJaggery = AR.reduce((s,r)=>s+(parseFloat(r.jaggery_used)||0),0);
  const tAmt     = AR.reduce((s,r)=>s+apd(r),0);

  const bv = (item, suffix) => {
    const o=parseFloat(hdr[item+"_open"])||0, rv=parseFloat(hdr[item+"_recv"])||0, u=parseFloat(hdr[item+"_used_tot"])||0;
    if(suffix==="total") return (o+rv)||"";
    if(suffix==="close") return (o+rv-u)||"";
    return hdr[item+"_"+suffix]||"";
  };

  const bT  = [1,2,3,4,5].reduce((s,c)=>s+(parseFloat(ftr[`boys_cls${c}`])||0),0);
  const gT  = [1,2,3,4,5].reduce((s,c)=>s+(parseFloat(ftr[`girls_cls${c}`])||0),0);
  const grd = bT+gT;
  const ml  = hdr.month ? MONTH_NAMES[parseInt(hdr.month)-1] : "";

  const RH = 11;

  return (
    <div style={{ fontFamily:"Arial, sans-serif", background:"#e8e8e8", padding:"6px" }}>

      <style>{`
        * { box-sizing: border-box; }
        table { border-collapse: collapse; }
        .pbtn { padding:6px 22px; background:#1a237e; color:#fff; border:none; cursor:pointer; font-size:12px; border-radius:4px; margin:3px; }

        /* ── Responsive scroll wrappers ── */
        .scroll-x {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        /* ── Mobile layout ── */
        .info-balance-wrap {
          display: flex;
          gap: 8px;
          margin-bottom: 6px;
          flex-wrap: wrap;
        }
        .info-panel   { flex: 0 0 220px; min-width: 0; }
        .balance-panel { flex: 1; min-width: 260px; }

        .bottom-wrap {
          display: flex;
          gap: 8px;
          margin-top: 4px;
          flex-wrap: wrap;
        }
        .classwise-panel { flex: 0 0 310px; min-width: 0; }
        .sig-panel       { flex: 1; min-width: 200px; }

        @media (max-width: 600px) {
          .info-panel    { flex: 0 0 100%; }
          .balance-panel { flex: 0 0 100%; }
          .classwise-panel { flex: 0 0 100%; }
          .sig-panel     { flex: 0 0 100%; }
          .title-side    { display: none; }
          #pg            { font-size: 8px; }
        }

        /* ─── PRINT ─── */
        @media print {
          html,body { margin:0!important; padding:0!important; background:#fff!important; }
          .noprint  { display:none!important; }

          @page { size:A4 landscape; margin:0; }

          #pg {
            position:fixed!important;
            top:0!important; left:0!important;
            width:1047px!important;
            height:742px!important;
            overflow:hidden!important;
            transform-origin:top left!important;
            transform:scale(1.0)!important;
            background:#fff!important;
            padding:4px 6px!important;
            font-size:7.6px!important;
          }
          .scroll-x { overflow: visible !important; }
          .info-balance-wrap { flex-wrap: nowrap !important; }
          .bottom-wrap       { flex-wrap: nowrap !important; }
          .info-panel        { flex: 0 0 220px !important; }
          .balance-panel     { flex: 1 !important; }
          .classwise-panel   { flex: 0 0 310px !important; }
          .sig-panel         { flex: 1 !important; }
          .title-side        { display: table-cell !important; }
        }
      `}</style>

      {/* ── Screen toolbar ── */}
      <div className="noprint" style={{ textAlign:"center", marginBottom:6 }}>
        <button className="pbtn" onClick={()=>window.print()}>🖨 Print / Save as PDF</button>
        <div style={{ fontSize:10, color:"#555", marginTop:2 }}>
          Print settings → <strong>A4 · Landscape · Margins: None · Scale: Fit to page</strong>
        </div>
      </div>

      <div id="pg" style={{ background:"#fff", fontSize:9, padding:"5px 8px", width:"100%", color:"#000" }}>
        <div style={{ border:"2px solid #000", padding:"3px 5px" }}>

          {/* ── Title row ── */}
          <table style={{ width:"100%", marginBottom:1 }}><tbody><tr>
            <td className="title-side" style={{ width:"10%", fontSize:"0.85em", color:"#555", lineHeight:1.2 }}>
              Classes<br/><span style={{ border:"1px solid #aaa", padding:"0 3px" }}>I to V</span>
            </td>
            <td style={{ textAlign:"center", lineHeight:1.3 }}>
              <div style={{ fontSize:"0.8em", fontStyle:"italic", color:"#444" }}>Dokka Seethamma Madhyamika Badi Bhojnam &nbsp; VIDYA SAARTHI</div>
              <div style={{ fontWeight:"bold", fontSize:"1.1em" }}>DAY WISE CASH VOUCHER FOR SERVING OF PM POSHAN (Mid Day Meal)</div>
            </td>
            <td className="title-side" style={{ width:"15%", textAlign:"right", fontSize:"0.8em", color:"#555" }}>RICE &nbsp;EGGS &nbsp;CHIKKI &nbsp;RAGI &nbsp;JAGGERY</td>
          </tr></tbody></table>

          {/* ── Village/Month/Year ── */}
          <div style={{ display:"flex", gap:4, alignItems:"center", marginBottom:2, flexWrap:"wrap" }}>
            <input value={hdr.village} onChange={e=>setH("village",e.target.value)} style={{ ...pi, width:80 }} placeholder="Village"/>
            <span>Village,</span>
            <input value={hdr.mandal} onChange={e=>setH("mandal",e.target.value)} style={{ ...pi, width:80 }} placeholder="Mandal"/>
            <span>Mandal,&nbsp;Month:</span>
            <select value={hdr.month} onChange={e=>setH("month",e.target.value)} style={{ ...pi, padding:0 }}>
              <option value="">--</option>
              {MONTH_NAMES.map((m,i)=><option key={i} value={String(i+1)}>{m}</option>)}
            </select>
            <span>Year:&nbsp;20</span>
            <input value={hdr.year} onChange={e=>setH("year",e.target.value)} maxLength={2} placeholder="YY" style={{ ...pi, width:22 }}/>
            {hdr.month&&hdr.year&&<span style={{ color:"#1a237e", fontWeight:"bold" }}>({ml} 20{hdr.year})</span>}
          </div>

          {/* ── Info + Balance ── */}
          <div className="info-balance-wrap">
            <div className="info-panel">
              <table><tbody>
                {INFO_FIELDS.map(([lbl,key,w])=>(
                  <tr key={key} style={{ lineHeight:"1.35" }}>
                    <td style={{ fontSize:"0.88em", paddingRight:3, whiteSpace:"nowrap" }}>{lbl}</td>
                    <td><input value={hdr[key]||""} onChange={e=>setH(key,e.target.value)} style={{ ...pi, width:w }}/></td>
                  </tr>
                ))}
              </tbody></table>
            </div>
            <div className="balance-panel">
              <div className="scroll-x">
                <table style={{ width:"100%", border:"1px solid #888", fontSize:"0.88em", minWidth:320 }}>
                  <thead>
                    <tr style={{ background:"#f0f0f0" }}>
                      <th style={{ border:"1px solid #888", padding:"0 4px", width:"24%", textAlign:"left" }}></th>
                      {ITEMS.map(k=><th key={k} style={{ border:"1px solid #888", textAlign:"center", textTransform:"uppercase" }}>{k}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {BAL_ROWS.map(([lbl,sfx])=>{
                      const isC = sfx==="total"||sfx==="close";
                      return (
                        <tr key={sfx} style={{ background:sfx==="close"?"#ffe":sfx==="total"?"#f9f9ff":"transparent" }}>
                          <td style={{ border:"1px solid #ccc", fontSize:"0.85em", whiteSpace:"nowrap", padding:"0 3px", fontWeight:isC?"bold":"normal" }}>{lbl}</td>
                          {ITEMS.map(item=>{
                            const val = bv(item,sfx);
                            return (
                              <td key={item} style={{ border:"1px solid #ccc", textAlign:"center", padding:"0" }}>
                                {isC ? <span style={{ fontWeight:"bold" }}>{val}</span>
                                     : <input value={hdr[item+"_"+sfx]||""} onChange={e=>setH(item+"_"+sfx,e.target.value)}
                                         style={{ width:"100%", border:"none", background:"transparent", fontFamily:"inherit", fontSize:"inherit", textAlign:"center", outline:"none", padding:"0" }}/>}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── Daily table (horizontally scrollable on mobile) ── */}
          <div className="scroll-x">
            <table style={{ tableLayout:"fixed", width:"100%", border:"1px solid #000", fontSize:"0.88em", lineHeight:"1", minWidth:680 }}>
              <colgroup>
                <col style={{ width:"2.4%" }}/><col style={{ width:"3.5%" }}/><col style={{ width:"4%" }}/>
                <col style={{ width:"8.5%" }}/><col style={{ width:"3.8%" }}/><col style={{ width:"4%" }}/>
                <col style={{ width:"4%" }}/><col style={{ width:"5.2%" }}/><col style={{ width:"5.2%" }}/>
                <col style={{ width:"5.2%" }}/><col style={{ width:"5.2%" }}/><col style={{ width:"5.5%" }}/>
                <col style={{ width:"5%" }}/><col style={{ width:"6%" }}/>
              </colgroup>
              <thead>
                <tr style={{ background:"#d0d8f0" }}>
                  {["Sl","DATE","Day","Holiday / Status","Roll","Present","Meals\nTaken",
                    "RICE\nKGs","EGGS\nNos.","CHIKKI\nNos.","RAGI\nKGs","JAGGERY\nKGs","Amt/Child\nRs.","Amt/Day\nRs."
                  ].map((h,i)=>(
                    <th key={i} style={{ border:"1px solid #888", whiteSpace:"pre-line", textAlign:"center", padding:"1px 0", fontSize:"0.9em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r,i)=>{
                  if (!r.date) return null;
                  const isH = !!r.holiday_type;
                  const ck = r.holiday_type==="CUSTOM"?"CUSTOM":r.holiday_type;
                  const hc = HOL_COLORS[ck]||{ bg:"#f5f5f5", text:"#333" };
                  const lbl = r.holiday_type==="CUSTOM"?(r.holiday_custom||"HOLIDAY"):r.holiday_type;
                  const amt = apd(r);
                  return (
                    <tr key={i} style={{ background: isH?hc.bg:(i%2===0?"#fff":"#f9f9f9"), height:RH }}>
                      <td style={{ border:"1px solid #ccc", textAlign:"center", padding:"0" }}>{i+1}</td>
                      <td style={{ border:"1px solid #ccc", textAlign:"center", fontWeight:"bold", padding:"0" }}>{r.date}</td>
                      <td style={{ border:"1px solid #ccc", padding:"0" }}>
                        <select value={r.week_day} onChange={e=>{ const d=e.target.value; setR(i,"week_day",d); if(d==="SUN") setR(i,"holiday_type","SUNDAY"); else if(r.holiday_type==="SUNDAY") setR(i,"holiday_type",""); }}
                          style={{ ...ss(r.week_day==="SUN"?"#c00":"#000", r.week_day==="SUN"), width:"100%" }}>
                          {DAYS.map(d=><option key={d} value={d}>{d}</option>)}
                        </select>
                      </td>
                      <td style={{ border:"1px solid #ccc", padding:"0" }}>
                        <select value={r.holiday_type==="CUSTOM"?"CUSTOM":r.holiday_type}
                          onChange={e=>{ setR(i,"holiday_type",e.target.value); if(e.target.value!=="CUSTOM") setR(i,"holiday_custom",""); }}
                          style={{ ...ss(isH?hc.text:"#444",isH), width:r.holiday_type==="CUSTOM"?"50%":"100%" }}>
                          {HOL_TYPES.map(h=><option key={h.v} value={h.v}>{h.l}</option>)}
                        </select>
                        {r.holiday_type==="CUSTOM"&&<input value={r.holiday_custom} onChange={e=>setR(i,"holiday_custom",e.target.value)}
                          placeholder="Name" style={{ width:"48%", border:"none", borderBottom:"1px solid #aaa", background:"transparent", fontFamily:"inherit", fontSize:"inherit", outline:"none", color:hc.text }}/>}
                      </td>
                      {isH ? (
                        <td colSpan={10} style={{ border:"1px solid #ccc", textAlign:"center", color:hc.text, fontWeight:"bold", letterSpacing:2, background:hc.bg, padding:"0" }}>{lbl}</td>
                      ) : (
                        <>
                          <td style={{ border:"1px solid #ccc", padding:"0" }}><Cell val={r.roll}    onChange={v=>setR(i,"roll",v)}/></td>
                          <td style={{ border:"1px solid #ccc", padding:"0" }}><Cell val={r.present} onChange={v=>setR(i,"present",v)}/></td>
                          <td style={{ border:"1px solid #ccc", padding:"0" }}><AS val={r.meals_taken}  color="#333"/></td>
                          <td style={{ border:"1px solid #ccc", padding:"0" }}><AS val={r.rice_used}    color="#4a148c"/></td>
                          <td style={{ border:"1px solid #ccc", padding:"0" }}><AS val={r.eggs_used}    color="#1b5e20"/></td>
                          <td style={{ border:"1px solid #ccc", padding:"0" }}><AS val={r.chikki_used}  color="#e65100"/></td>
                          <td style={{ border:"1px solid #ccc", padding:"0" }}><AS val={r.ragi_used}    color="#0d47a1"/></td>
                          <td style={{ border:"1px solid #ccc", padding:"0" }}><AS val={r.jaggery_used} color="#880e4f"/></td>
                          <td style={{ border:"1px solid #ccc", textAlign:"center", fontWeight:"bold", color:"#333", padding:"0" }}>6.19</td>
                          <td style={{ border:"1px solid #ccc", textAlign:"center", fontWeight:"bold", color:amt?"#006400":"#aaa", padding:"0" }}>{amt?amt.toFixed(2):"—"}</td>
                        </>
                      )}
                    </tr>
                  );
                })}
                {/* TOTAL */}
                <tr style={{ background:"#e8eaf6", fontWeight:"bold" }}>
                  <td colSpan={4} style={{ border:"1px solid #888", textAlign:"center", padding:"0" }}>TOTAL</td>
                  <td style={{ border:"1px solid #888" }}/><td style={{ border:"1px solid #888" }}/><td style={{ border:"1px solid #888" }}/>
                  <td style={{ border:"1px solid #888", textAlign:"center", padding:"0" }}>{tRice    ?tRice.toFixed(2):""}</td>
                  <td style={{ border:"1px solid #888", textAlign:"center", padding:"0" }}>{tEggs    ||""}</td>
                  <td style={{ border:"1px solid #888", textAlign:"center", padding:"0" }}>{tChikki  ||""}</td>
                  <td style={{ border:"1px solid #888", textAlign:"center", padding:"0" }}>{tRagi    ?tRagi.toFixed(3):""}</td>
                  <td style={{ border:"1px solid #888", textAlign:"center", padding:"0" }}>{tJaggery ?tJaggery.toFixed(3):""}</td>
                  <td style={{ border:"1px solid #888" }}/>
                  <td style={{ border:"1px solid #888", textAlign:"center", color:"#006400", padding:"0" }}>{tAmt?tAmt.toFixed(2):""}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── Total in words ── */}
          <div style={{ marginTop:2, fontSize:"0.88em" }}>
            <strong>TOTAL (in words): Rs.&nbsp;</strong>
            <input value={ftr.total_amount_words} onChange={e=>setF("total_amount_words",e.target.value)}
              style={{ ...pi, width:"50%" }}/><strong>&nbsp;only</strong>
          </div>

          {/* ── Bottom: Class-wise | Signatures ── */}
          <div className="bottom-wrap">

            {/* Class-wise */}
            <div className="classwise-panel">
              <div style={{ fontWeight:"bold", fontSize:"0.88em", borderBottom:"1px solid #888", marginBottom:1 }}>Class-wise Student Count (I – V)</div>
              <div className="scroll-x">
                <table style={{ fontSize:"0.88em", minWidth:260 }}>
                  <thead>
                    <tr style={{ background:"#e0e0e0" }}>
                      <th style={{ border:"1px solid #888", padding:"0 7px" }}>Gender</th>
                      {[1,2,3,4,5].map(c=><th key={c} style={{ border:"1px solid #888", padding:"0 10px" }}>Cls {c}</th>)}
                      <th style={{ border:"1px solid #888", padding:"0 10px" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[["Boys","boys"],["Girls","girls"]].map(([lbl,pfx])=>(
                      <tr key={pfx}>
                        <td style={{ border:"1px solid #ccc", padding:"0 7px" }}>{lbl}</td>
                        {[1,2,3,4,5].map(c=>(
                          <td key={c} style={{ border:"1px solid #ccc", textAlign:"center", padding:"0" }}>
                            <CC val={ftr[`${pfx}_cls${c}`]} onChange={v=>setF(`${pfx}_cls${c}`,v)}/>
                          </td>
                        ))}
                        <td style={{ border:"1px solid #ccc", textAlign:"center", fontWeight:"bold", background:"#f5f5f5", padding:"0 6px" }}>
                          {(pfx==="boys"?bT:gT)||""}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ background:"#e8eaf6", fontWeight:"bold" }}>
                      <td style={{ border:"1px solid #ccc", padding:"0 7px" }}>Total</td>
                      {[1,2,3,4,5].map(c=>(
                        <td key={c} style={{ border:"1px solid #ccc", textAlign:"center", padding:"0 6px" }}>
                          {((parseFloat(ftr[`boys_cls${c}`])||0)+(parseFloat(ftr[`girls_cls${c}`])||0))||""}
                        </td>
                      ))}
                      <td style={{ border:"1px solid #ccc", textAlign:"center", background:"#d0d8f0", padding:"0 6px" }}>{grd||""}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signatures */}
            <div className="sig-panel" style={{ fontSize:"0.88em" }}>
              <table style={{ width:"100%", height:"100%" }}><tbody><tr valign="bottom">
                <td style={{ width:"35%" }}>
                  <div>Signature:&nbsp;<input value={ftr.sign_name} onChange={e=>setF("sign_name",e.target.value)} style={{ ...pi, width:100 }}/></div>
                  <div style={{ marginTop:3 }}>Date:&nbsp;<input value={ftr.sign_date} onChange={e=>setF("sign_date",e.target.value)} style={{ ...pi, width:90 }}/></div>
                </td>
                <td style={{ width:"28%", textAlign:"center" }}>
                  <div style={{ fontStyle:"italic", fontSize:"0.88em", color:"#555" }}>Signature of the<br/>Mandal Educational Officer</div>
                </td>
                <td style={{ width:"37%", textAlign:"right" }}>
                  <div><input value={ftr.head_master_name} onChange={e=>setF("head_master_name",e.target.value)} placeholder="Head Master Name" style={{ ...pi, width:140, textAlign:"right" }}/></div>
                  <div style={{ fontWeight:"bold" }}>Head Master</div>
                  <div><input value={ftr.school_name} onChange={e=>setF("school_name",e.target.value)} placeholder="MPPS / School Name" style={{ ...pi, width:155, textAlign:"right" }}/></div>
                  <div style={{ fontSize:"0.85em", color:"#555" }}>SPSR Nellore (D)</div>
                </td>
              </tr></tbody></table>
            </div>

          </div>

        </div>
      </div>

      {/* Screen footer hint */}
      <div className="noprint" style={{ textAlign:"center", marginTop:5, fontSize:9, color:"#777" }}>
        ✅ Auto-saved &nbsp;|&nbsp;
        <span style={{ color:"#4a148c" }}>Rice×100g always</span> &nbsp;|&nbsp;
        <span style={{ color:"#1b5e20" }}>Eggs Mon–Fri</span> &nbsp;|&nbsp;
        <span style={{ color:"#e65100" }}>Chikki Mon/Wed/Fri</span> &nbsp;|&nbsp;
        <span style={{ color:"#0d47a1" }}>Ragi+Jaggery Tue/Thu/Sat</span>
      </div>
    </div>
  );
}