import { useState, useEffect } from "react";

const DAYS = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const EGG_DAYS  = ["MON","WED","FRI"];
const RAGI_DAYS = ["TUE","THU","SAT"];
const ITEMS = ["rice","eggs","chikki","ragi","jaggery"];

const HOL_TYPES = [
  { v:"",             l:"— Working Day —" },
  { v:"SUNDAY",       l:"SUNDAY" },
  { v:"HOLIDAY",      l:"HOLIDAY" },
  { v:"SCHOOL HOLIDAY",l:"SCHOOL HOLIDAY" },
  { v:"GOVT HOLIDAY", l:"GOVT HOLIDAY" },
  { v:"VACATION",     l:"VACATION" },
  { v:"CUSTOM",       l:"Custom..." },
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
  ["DISE CODE",               "dise_code",   150],
  ["Implementing Agency",     "agency_name", 150],
  ["Bank Name",               "bank_name",   150],
  ["Bank Account No.",        "account_no",  150],
  ["Working Days",            "working_days", 65],
  ["Average Meals Taken",     "avg_meals",    65],
  ["No. of Cook cum Helpers", "num_cooks",    65],
];

const BAL_ROWS = [
  ["OPENING BALANCE",     "open"],
  ["RECEIVED (ALLOTMENT)","recv"],
  ["TOTAL (O.B.+RECD.)",  "total"],   // auto-calculated
  ["USED",                "used_tot"],
  ["DAMAGED/EXPIRED",     "dmg"],
  ["CLOSING BALANCE",     "close"],   // auto-calculated
];

// ── helpers ──────────────────────────────────────────────
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
    const rice = (p * 0.1).toFixed(2);
    // meals_taken mirrors present
    const meals_taken = String(p);
    if (EGG_DAYS.includes(r.week_day))
      return { ...r, meals_taken, rice_used: rice, eggs_used: String(p), chikki_used: String(p), ragi_used: "", jaggery_used: "" };
    if (RAGI_DAYS.includes(r.week_day))
      return { ...r, meals_taken, rice_used: rice, eggs_used: "", chikki_used: "", ragi_used: (p * 0.01).toFixed(3), jaggery_used: (p * 0.01).toFixed(3) };
    return { ...r, meals_taken, rice_used: rice, eggs_used: "", chikki_used: "", ragi_used: "", jaggery_used: "" };
  }
  if (!r.holiday_type && p === 0)
    return { ...r, meals_taken: "", rice_used: "", eggs_used: "", chikki_used: "", ragi_used: "", jaggery_used: "" };
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
  village:"", month:"", year:"",
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

// ── shared input styles ───────────────────────────────────
const plainInp = {
  border:"none", borderBottom:"1px solid #999", background:"transparent",
  fontFamily:"inherit", fontSize:"inherit", outline:"none", padding:"1px 3px",
};
const cellInp = {
  width:"100%", border:"none", borderBottom:"1px solid #ccc", background:"transparent",
  fontFamily:"inherit", fontSize:"inherit", textAlign:"center", outline:"none", padding:"1px 2px",
};
const selStyle = (color, bold) => ({
  width:"100%", border:"none", background:"transparent",
  fontFamily:"inherit", fontSize:9, outline:"none",
  color: color || "#444", fontWeight: bold ? "bold" : "normal",
});

// Read-only auto-value display
const AutoSpan = ({ val, color }) => (
  <span style={{ fontWeight:"bold", color: color || "#4a148c", display:"block", textAlign:"center" }}>
    {val || "—"}
  </span>
);

// Digit-only cell input (no onChange auto-fill side effects)
const Cell = ({ val, onChange }) => (
  <input
    type="text"
    value={val}
    style={cellInp}
    onChange={e => {
      const v = e.target.value;
      if (/^\d*$/.test(v)) onChange(v);
    }}
  />
);

// Digit-only class count input (replaces type="number")
const ClassCell = ({ val, onChange }) => (
  <input
    type="text"
    value={val}
    style={{
      width:50, border:"none", borderBottom:"1px solid #ccc", background:"transparent",
      fontFamily:"inherit", fontSize:10, textAlign:"center", outline:"none", padding:"1px 2px",
    }}
    onChange={e => {
      const v = e.target.value;
      if (/^\d*$/.test(v)) onChange(v);
    }}
  />
);

// ── component ─────────────────────────────────────────────
export default function App() {
  const [hdr,  setHdr]  = useState(() => load("pmh7", defaultHdr));
  const [rows, setRows] = useState(() => load("pmr7", Array.from({ length:31 }, (_,i) => makeRow(String(i+1)))));
  const [ftr,  setFtr]  = useState(() => load("pmf7", defaultFtr));

  useEffect(() => { save("pmh7", hdr);  }, [hdr]);
  useEffect(() => { save("pmr7", rows); }, [rows]);
  useEffect(() => { save("pmf7", ftr);  }, [ftr]);

  // ── header helpers ──
  const setH = (k, v) => {
    setHdr(h => {
      const next = { ...h, [k]: v };
      if (k === "month" || k === "year") applyCalendar(k === "month" ? v : h.month, k === "year" ? v : h.year, next);
      return next;
    });
  };

  const applyCalendar = (month, year, currentHdr) => {
    const cal = buildCalendar(month, year);
    if (!cal) return;
    setRows(prev => Array.from({ length:31 }, (_, i) => {
      if (i < cal.length) {
        const { date, day } = cal[i];
        const ex = prev[i] || {};
        return autoFill({
          ...makeRow(date, day),
          ...(ex.date === date ? {
            roll: ex.roll, present: ex.present, meals_taken: ex.meals_taken,
            amount_per_child: ex.amount_per_child,
            holiday_type: ex.holiday_type || (day === "SUN" ? "SUNDAY" : ""),
            holiday_custom: ex.holiday_custom,
          } : {}),
        });
      }
      return makeRow("", "MON");
    }));
  };

  const setR = (i, k, v) => setRows(rs => rs.map((r, idx) => {
    if (idx !== i) return r;
    const upd = { ...r, [k]: v };
    if (k === "present" || k === "week_day" || k === "holiday_type") return autoFill(upd);
    return upd;
  }));

  const setF = (k, v) => setFtr(f => ({ ...f, [k]: v }));

  // ── derived totals (auto-calculated, no manual input) ──
  const activeRows  = rows.filter(r => r.date);
  const amtPerDay   = r => (!r.holiday_type && r.date)
    ? (parseFloat(r.meals_taken)||0) * 6.19 : 0;
  const totalRice    = activeRows.reduce((s,r) => s + (parseFloat(r.rice_used)    ||0), 0);
  const totalEggs    = activeRows.reduce((s,r) => s + (parseFloat(r.eggs_used)    ||0), 0);
  const totalChikki  = activeRows.reduce((s,r) => s + (parseFloat(r.chikki_used)  ||0), 0);
  const totalRagi    = activeRows.reduce((s,r) => s + (parseFloat(r.ragi_used)    ||0), 0);
  const totalJaggery = activeRows.reduce((s,r) => s + (parseFloat(r.jaggery_used) ||0), 0);
  const totalAmt     = activeRows.reduce((s,r) => s + amtPerDay(r), 0);

  // ── balance auto-calc (TOTAL and CLOSING BALANCE are always computed) ──
  const balVal = (item, suffix) => {
    const o = parseFloat(hdr[item+"_open"])||0;
    const r = parseFloat(hdr[item+"_recv"])||0;
    const u = parseFloat(hdr[item+"_used_tot"])||0;
    if (suffix === "total")  return (o + r) || "";
    if (suffix === "close")  return (o + r - u) || "";
    return hdr[item+"_"+suffix] || "";
  };

  // ── class-wise totals (auto-calculated) ──
  const boysTotal  = [1,2,3,4,5].reduce((s,c) => s+(parseFloat(ftr[`boys_cls${c}`])||0),  0);
  const girlsTotal = [1,2,3,4,5].reduce((s,c) => s+(parseFloat(ftr[`girls_cls${c}`])||0), 0);
  const grandTotal = boysTotal + girlsTotal;
  const monthLabel = hdr.month ? MONTH_NAMES[parseInt(hdr.month)-1] : "";

  return (
    <div style={{ fontFamily:"Arial, sans-serif", fontSize:11, padding:"10px 14px",
      background:"#fff", width:"100%", maxWidth:"100%", color:"#000" }}>

      <style>{`
        * { box-sizing:border-box; }
        input,select { font-size:11px; }
        table { border-collapse:collapse; }
        td,th { padding:2px 3px; }
        .print-btn { display:inline-block; margin:6px 4px; padding:7px 28px;
          background:#1a237e; color:#fff; border:none; cursor:pointer;
          font-size:13px; border-radius:4px; }
        @media print {
          .no-print { display:none !important; }
          body { margin:0; }
          @page { size:A4 landscape; margin:5mm; }
        }
      `}</style>

      {/* Print button */}
      <div className="no-print" style={{ textAlign:"center", marginBottom:6 }}>
        <button className="print-btn" onClick={() => window.print()}>🖨 Print / Save as PDF</button>
      </div>

      <div style={{ border:"2px solid #000", padding:"7px", width:"100%" }}>

        {/* ── Title ── */}
        <table style={{ width:"100%", marginBottom:3 }}><tbody><tr>
          <td style={{ width:"13%", fontSize:9, color:"#555" }}>
            <div>Classes</div>
            <div style={{ border:"1px solid #aaa", padding:"2px 4px", marginTop:2 }}>
              <div>I to V</div>
            </div>
          </td>
          <td style={{ textAlign:"center", fontWeight:"bold", fontSize:12 }}>
            <div style={{ fontSize:8, fontStyle:"italic", color:"#444" }}>
              Dokka Seethamma Madhyamika Badi Bhojnam &nbsp;&nbsp; VIDYA SAARTHI
            </div>
            <div>DAY WISE CASH VOUCHER FOR SERVING OF PM POSHAN (Mid Day Meal)</div>
          </td>
          <td style={{ width:"17%", textAlign:"right", fontSize:9, color:"#555" }}>
            RICE &nbsp; EGGS &nbsp; CHIKKI &nbsp; RAGI &nbsp; JAGGERY
          </td>
        </tr></tbody></table>

        {/* ── Village / Month / Year ── */}
        <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:5, flexWrap:"wrap" }}>
          {/* <span style={{ fontWeight:"bold" }}>MAKTHAPUR,</span> */}
         <input value={hdr.village} onChange={e => setH("village", e.target.value)}
            style={{ ...plainInp, width:100 }} />
          <span>Village,</span>
          <input value={hdr.village} onChange={e => setH("village", e.target.value)}
            style={{ ...plainInp, width:100 }} />
          <span>Mandal &nbsp; Month:</span>
          <select value={hdr.month} onChange={e => setH("month", e.target.value)} style={{ ...plainInp }}>
            <option value="">-- Month --</option>
            {MONTH_NAMES.map((m,i) => <option key={i} value={String(i+1)}>{m}</option>)}
          </select>
          <span>Year: 20</span>
          <input value={hdr.year} onChange={e => setH("year", e.target.value)}
            maxLength={2} placeholder="YY" style={{ ...plainInp, width:32 }} />
          {hdr.month && hdr.year &&
            <span style={{ color:"#1a237e", fontWeight:"bold", fontSize:10 }}>
              ({monthLabel} 20{hdr.year})
            </span>
          }
        </div>

        {/* ── Info left + Balance right ── */}
        <table style={{ width:"100%", marginBottom:5 }}><tbody><tr valign="top">
          {/* Info fields */}
          <td style={{ width:"38%" }}>
            <table style={{ width:"100%" }}><tbody>
              {INFO_FIELDS.map(([label, key, w]) => (
                <tr key={key}>
                  <td style={{ fontSize:10, paddingRight:5, whiteSpace:"nowrap" }}>{label}</td>
                  <td>
                    <input value={hdr[key]||""} onChange={e => setH(key, e.target.value)}
                      style={{ ...plainInp, width:w, fontSize:10 }} />
                  </td>
                </tr>
              ))}
            </tbody></table>
          </td>

          {/* Balance table */}
          <td style={{ width:"62%", paddingLeft:10 }}>
            <table style={{ width:"100%", border:"1px solid #888", fontSize:10 }}>
              <thead>
                <tr style={{ background:"#f0f0f0" }}>
                  <th style={{ border:"1px solid #888", padding:"2px 5px", width:"28%", textAlign:"left" }}></th>
                  {ITEMS.map(k => (
                    <th key={k} style={{ border:"1px solid #888", textAlign:"center", textTransform:"uppercase" }}>{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BAL_ROWS.map(([label, suffix]) => {
                  const isCalc = suffix === "total" || suffix === "close";
                  return (
                    <tr key={suffix} style={{ background: suffix==="close" ? "#ffe" : suffix==="total" ? "#f9f9ff" : "transparent" }}>
                      <td style={{ border:"1px solid #ccc", fontSize:9, whiteSpace:"nowrap", padding:"1px 4px",
                        fontWeight: isCalc ? "bold" : "normal" }}>{label}</td>
                      {ITEMS.map(item => {
                        const val = balVal(item, suffix);
                        return (
                          <td key={item} style={{ border:"1px solid #ccc", textAlign:"center" }}>
                            {isCalc
                              ? <span style={{ fontSize:10, fontWeight:"bold" }}>{val}</span>
                              : <input
                                  value={hdr[item+"_"+suffix]||""}
                                  onChange={e => setH(item+"_"+suffix, e.target.value)}
                                  style={{ width:"100%", border:"none", background:"transparent",
                                    fontFamily:"inherit", fontSize:10, textAlign:"center", outline:"none", padding:"1px 2px" }} />
                            }
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </td>
        </tr></tbody></table>

        {/* ── MAIN DAILY TABLE ── */}
        <table style={{ tableLayout:"fixed", width:"100%", border:"1px solid #000", fontSize:10 }}>
          <colgroup>
            <col style={{ width:"3%" }} />
            <col style={{ width:"5%" }} />
            <col style={{ width:"5%" }} />
            <col style={{ width:"10%" }} />
            <col style={{ width:"4.5%" }} />
            <col style={{ width:"5%" }} />
            <col style={{ width:"5%" }} />
            <col style={{ width:"6%" }} />
            <col style={{ width:"6%" }} />
            <col style={{ width:"6%" }} />
            <col style={{ width:"6%" }} />
            <col style={{ width:"6.5%" }} />
            <col style={{ width:"6%" }} />
            <col style={{ width:"8%" }} />
          </colgroup>
          <thead>
            <tr style={{ background:"#d0d8f0" }}>
              {["Sl","DATE","Day","Holiday / Status","Roll","Present","Meals\nTaken",
                "RICE\nKGs","EGGS\nNos.","CHIKKI\nNos.","RAGI\nKGs","JAGGERY\nKGs","Amt/Child\nRs.","Amt/Day\nRs."
              ].map((h,i) => (
                <th key={i} style={{ border:"1px solid #888", whiteSpace:"pre-line", textAlign:"center" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              if (!r.date) return null;
              const isHol = !!r.holiday_type;
              const colorKey = r.holiday_type === "CUSTOM" ? "CUSTOM" : r.holiday_type;
              const hc = HOL_COLORS[colorKey] || { bg:"#f5f5f5", text:"#333" };
              const label = r.holiday_type === "CUSTOM" ? (r.holiday_custom || "HOLIDAY") : r.holiday_type;
              const amt = amtPerDay(r);
              const rowBg = isHol ? hc.bg : (i % 2 === 0 ? "#fff" : "#f9f9f9");

              return (
                <tr key={i} style={{ background: rowBg }}>
                  <td style={{ border:"1px solid #ccc", textAlign:"center" }}>{i+1}</td>
                  <td style={{ border:"1px solid #ccc", textAlign:"center", fontWeight:"bold" }}>{r.date}</td>

                  {/* ── Day dropdown ── */}
                  <td style={{ border:"1px solid #ccc", padding:"1px 2px" }}>
                    <select
                      value={r.week_day}
                      onChange={e => {
                        const day = e.target.value;
                        setR(i, "week_day", day);
                        if (day === "SUN") setR(i, "holiday_type", "SUNDAY");
                        else if (r.holiday_type === "SUNDAY") setR(i, "holiday_type", "");
                      }}
                      style={{
                        ...selStyle(r.week_day === "SUN" ? "#c00" : "#000", r.week_day === "SUN"),
                        width:"100%",
                      }}>
                      {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </td>

                  {/* ── Holiday selector ── */}
                  <td style={{ border:"1px solid #ccc", padding:"1px 2px" }}>
                    <select
                      value={r.holiday_type === "CUSTOM" ? "CUSTOM" : r.holiday_type}
                      onChange={e => {
                        setR(i, "holiday_type", e.target.value);
                        if (e.target.value !== "CUSTOM") setR(i, "holiday_custom", "");
                      }}
                      style={{
                        ...selStyle(isHol ? hc.text : "#444", isHol),
                        width: r.holiday_type === "CUSTOM" ? "50%" : "100%",
                      }}>
                      {HOL_TYPES.map(h => <option key={h.v} value={h.v}>{h.l}</option>)}
                    </select>
                    {r.holiday_type === "CUSTOM" && (
                      <input value={r.holiday_custom}
                        onChange={e => setR(i, "holiday_custom", e.target.value)}
                        placeholder="Name"
                        style={{ width:"48%", border:"none", borderBottom:"1px solid #aaa",
                          background:"transparent", fontFamily:"inherit", fontSize:9,
                          outline:"none", color: hc.text }} />
                    )}
                  </td>

                  {isHol ? (
                    <td colSpan={10} style={{ border:"1px solid #ccc", textAlign:"center",
                      color: hc.text, fontWeight:"bold", letterSpacing:3, fontSize:10, background: hc.bg }}>
                      {label}
                    </td>
                  ) : (
                    <>
                      <td style={{ border:"1px solid #ccc" }}>
                        <Cell val={r.roll} onChange={v => setR(i,"roll",v)} />
                      </td>
                      <td style={{ border:"1px solid #ccc" }}>
                        <Cell val={r.present} onChange={v => setR(i,"present",v)} />
                      </td>
                      {/* MEALS TAKEN — auto mirrors Present, read-only */}
                      <td style={{ border:"1px solid #ccc" }}>
                        <AutoSpan val={r.meals_taken} color="#333" />
                      </td>

                      {/* RICE — always auto, read-only */}
                      <td style={{ border:"1px solid #ccc" }}>
                        <AutoSpan val={r.rice_used} color="#4a148c" />
                      </td>

                      {/* EGGS — always auto, read-only */}
                      <td style={{ border:"1px solid #ccc" }}>
                        <AutoSpan val={r.eggs_used} color="#1b5e20" />
                      </td>

                      {/* CHIKKI — always auto, read-only */}
                      <td style={{ border:"1px solid #ccc" }}>
                        <AutoSpan val={r.chikki_used} color="#e65100" />
                      </td>

                      {/* RAGI — always auto, read-only */}
                      <td style={{ border:"1px solid #ccc" }}>
                        <AutoSpan val={r.ragi_used} color="#0d47a1" />
                      </td>

                      {/* JAGGERY — always auto, read-only */}
                      <td style={{ border:"1px solid #ccc" }}>
                        <AutoSpan val={r.jaggery_used} color="#880e4f" />
                      </td>

                      <td style={{ border:"1px solid #ccc", textAlign:"center", fontWeight:"bold", color:"#333" }}>
                        6.19
                      </td>
                      <td style={{ border:"1px solid #ccc", textAlign:"center", fontWeight:"bold",
                        color: amt ? "#006400" : "#aaa" }}>
                        {amt ? amt.toFixed(2) : "—"}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}

            {/* TOTAL ROW — fully auto-calculated */}
            <tr style={{ background:"#e8eaf6", fontWeight:"bold" }}>
              <td colSpan={4} style={{ border:"1px solid #888", textAlign:"center" }}>TOTAL</td>
              <td style={{ border:"1px solid #888" }} /><td style={{ border:"1px solid #888" }} />
              <td style={{ border:"1px solid #888" }} />
              <td style={{ border:"1px solid #888", textAlign:"center" }}>{totalRice    ? totalRice.toFixed(2)    : ""}</td>
              <td style={{ border:"1px solid #888", textAlign:"center" }}>{totalEggs    || ""}</td>
              <td style={{ border:"1px solid #888", textAlign:"center" }}>{totalChikki  || ""}</td>
              <td style={{ border:"1px solid #888", textAlign:"center" }}>{totalRagi    ? totalRagi.toFixed(3)    : ""}</td>
              <td style={{ border:"1px solid #888", textAlign:"center" }}>{totalJaggery ? totalJaggery.toFixed(3) : ""}</td>
              <td style={{ border:"1px solid #888" }} />
              <td style={{ border:"1px solid #888", textAlign:"center", color:"#006400" }}>{totalAmt ? totalAmt.toFixed(2) : ""}</td>
            </tr>
          </tbody>
        </table>

        {/* ── Total in words ── */}
        <div style={{ marginTop:4, fontSize:10 }}>
          <strong>TOTAL (Round off) (in words): Rupees&nbsp;</strong>
          <input value={ftr.total_amount_words} onChange={e => setF("total_amount_words", e.target.value)}
            style={{ ...plainInp, width:"55%", fontSize:10 }} />
          <strong>&nbsp;only</strong>
        </div>

        {/* ── Class-wise count ── */}
        <div style={{ marginTop:10 }}>
          <div style={{ fontSize:10, fontWeight:"bold", marginBottom:4, borderBottom:"1px solid #888", paddingBottom:2 }}>
            Class-wise Student Count (Classes I – V)
          </div>
          <table style={{ width:"auto" }}>
            <thead>
              <tr style={{ background:"#e0e0e0" }}>
                <th style={{ border:"1px solid #888", padding:"2px 14px" }}>Gender</th>
                {[1,2,3,4,5].map(c => (
                  <th key={c} style={{ border:"1px solid #888", padding:"2px 20px" }}>Class {c}</th>
                ))}
                <th style={{ border:"1px solid #888", padding:"2px 20px" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {[["Boys","boys"],["Girls","girls"]].map(([label, pfx]) => (
                <tr key={pfx}>
                  <td style={{ border:"1px solid #ccc", padding:"2px 14px" }}>{label}</td>
                  {[1,2,3,4,5].map(c => (
                    <td key={c} style={{ border:"1px solid #ccc", textAlign:"center" }}>
                      {/* ✅ Replaced type="number" with digit-only ClassCell */}
                      <ClassCell
                        val={ftr[`${pfx}_cls${c}`]}
                        onChange={v => setF(`${pfx}_cls${c}`, v)}
                      />
                    </td>
                  ))}
                  {/* ✅ Auto-calculated total — no input */}
                  <td style={{ border:"1px solid #ccc", textAlign:"center", fontWeight:"bold",
                    background:"#f5f5f5", padding:"2px 10px" }}>
                    {(pfx === "boys" ? boysTotal : girlsTotal) || ""}
                  </td>
                </tr>
              ))}
              {/* ✅ Grand total row — fully auto-calculated */}
              <tr style={{ background:"#e8eaf6", fontWeight:"bold" }}>
                <td style={{ border:"1px solid #ccc", padding:"2px 14px" }}>Total</td>
                {[1,2,3,4,5].map(c => (
                  <td key={c} style={{ border:"1px solid #ccc", textAlign:"center", padding:"2px 10px" }}>
                    {((parseFloat(ftr[`boys_cls${c}`])||0) + (parseFloat(ftr[`girls_cls${c}`])||0)) || ""}
                  </td>
                ))}
                <td style={{ border:"1px solid #ccc", textAlign:"center", background:"#d0d8f0", padding:"2px 10px" }}>
                  {grandTotal || ""}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Signatures ── */}
        <table style={{ width:"100%", marginTop:16, fontSize:10 }}><tbody>
          <tr valign="bottom">
            <td style={{ width:"38%" }}>
              <div>Signature:&nbsp;
                <input value={ftr.sign_name} onChange={e => setF("sign_name", e.target.value)}
                  style={{ ...plainInp, width:150, fontSize:10 }} />
              </div>
              <div style={{ marginTop:4 }}>Date:&nbsp;
                <input value={ftr.sign_date} onChange={e => setF("sign_date", e.target.value)}
                  style={{ ...plainInp, width:110, fontSize:10 }} />
              </div>
            </td>
            <td style={{ width:"32%", textAlign:"center" }}>
              <div style={{ fontStyle:"italic", fontSize:9, color:"#555" }}>
                Signature of the Mandal Educational Officer
              </div>
            </td>
            <td style={{ width:"30%", textAlign:"right" }}>
              <div>
                <input value={ftr.head_master_name}
                  onChange={e => setF("head_master_name", e.target.value)}
                  placeholder="Head Master Name"
                  style={{ ...plainInp, width:175, fontSize:10, textAlign:"right" }} />
              </div>
              <div style={{ fontWeight:"bold", fontSize:10 }}>Head Master</div>
              <div>
                <input value={ftr.school_name}
                  onChange={e => setF("school_name", e.target.value)}
                  placeholder="MPPS / School Name"
                  style={{ ...plainInp, width:195, fontSize:10, textAlign:"right" }} />
              </div>
              <div style={{ fontSize:9, color:"#555" }}>SPSR Nellore (D)</div>
            </td>
          </tr>
        </tbody></table>

      </div>

      {/* Footer hint */}
      <div className="no-print" style={{ textAlign:"center", marginTop:8, fontSize:10, color:"#888" }}>
        ✅ Auto-saved &nbsp;|&nbsp;
        <span style={{ color:"#4a148c" }}>Rice = Present × 100g always</span> &nbsp;|&nbsp;
        <span style={{ color:"#1b5e20" }}>Mon/Wed/Fri → Eggs &amp; Chikki = Present × 1</span> &nbsp;|&nbsp;
        <span style={{ color:"#0d47a1" }}>Tue/Thu/Sat → Ragi &amp; Jaggery = Present × 10g</span>
      </div>
    </div>
  );
}