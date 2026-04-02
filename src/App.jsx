import { useState, useEffect } from "react";

const DAYS_OF_WEEK = ["MON","TUE","WED","THU","FRI","SAT","SUN"];

const HOLIDAY_TYPES = [
  { value: "", label: "— Working Day —" },
  { value: "SUNDAY", label: "SUNDAY" },
  { value: "HOLIDAY", label: "HOLIDAY" },
  { value: "SCHOOL HOLIDAY", label: "SCHOOL HOLIDAY" },
  { value: "GOVT HOLIDAY", label: "GOVT HOLIDAY" },
  { value: "VACATION", label: "VACATION" },
  { value: "CUSTOM", label: "Custom..." },
];

const HOLIDAY_COLORS = {
  "SUNDAY":         { bg:"#fff8e1", text:"#c00" },
  "HOLIDAY":        { bg:"#fce4ec", text:"#880e4f" },
  "SCHOOL HOLIDAY": { bg:"#e8f5e9", text:"#1b5e20" },
  "GOVT HOLIDAY":   { bg:"#e3f2fd", text:"#0d47a1" },
  "VACATION":       { bg:"#f3e5f5", text:"#4a148c" },
  "CUSTOM":         { bg:"#fff3e0", text:"#e65100" },
};

function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

const defaultHeader = {
  dise_code: "", village: "", mandal: "", month: "", year: "",
  agency_name: "", bank_name: "", account_no: "",
  working_days: "", avg_meals: "", num_cooks: "",
  opening_balance: "", received_allotment: "",
  total_rec: "", damaged_expired: "",
  rice_open: "", rice_recv: "", rice_total: "", rice_used_tot: "", rice_balance: "",
  eggs_open: "", eggs_recv: "", eggs_total: "", eggs_used_tot: "", eggs_balance: "",
  chikki_open: "", chikki_recv: "", chikki_total: "", chikki_used_tot: "", chikki_balance: "",
  ragi_open: "", ragi_recv: "", ragi_total: "", ragi_used_tot: "", ragi_balance: "",
  jaggery_open: "", jaggery_recv: "", jaggery_total: "", jaggery_used_tot: "", jaggery_balance: "",
};

const defaultRow = () => ({
  date: "", week_day: "MON",
  holiday_type: "",
  holiday_custom: "",
  roll: "", present: "",
  meals_taken: "", meals_not_taken: "",
  rice_used: "", rice_not_used: "",
  eggs_used: "", chikki_used: "", ragi_used: "", jaggery_used: "",
  amount_per_child: "",
});

const defaultFooter = {
  total_amount_words: "",
  boys_cls1: "", boys_cls2: "", boys_cls3: "", boys_cls4: "", boys_cls5: "",
  girls_cls1: "", girls_cls2: "", girls_cls3: "", girls_cls4: "", girls_cls5: "",
  sign_name: "", sign_date: "", head_master_name: "", school_name: "",
};

export default function App() {
  const [hdr, setHdr] = useState(() => load("pmh3", defaultHeader));
  const [rows, setRows] = useState(() => load("pmr3", Array.from({length:31}, defaultRow)));
  const [ftr, setFtr] = useState(() => load("pmf3", defaultFooter));

  useEffect(() => { save("pmh3", hdr); }, [hdr]);
  useEffect(() => { save("pmr3", rows); }, [rows]);
  useEffect(() => { save("pmf3", ftr); }, [ftr]);

  const setH = (k, v) => setHdr(h => ({...h, [k]: v}));
  const setR = (i, k, v) => setRows(rs => rs.map((r, idx) => idx===i ? {...r, [k]: v} : r));
  const setF = (k, v) => setFtr(f => ({...f, [k]: v}));

  const amtPerDay = (r) => {
    if (r.holiday_type) return 0;
    const p = parseFloat(r.present)||0;
    const a = parseFloat(r.amount_per_child)||0;
    return p && a ? p * a : 0;
  };

  const totalAmt     = rows.reduce((s,r) => s + amtPerDay(r), 0);
  const totalRice    = rows.reduce((s,r) => s + (parseFloat(r.rice_used)||0), 0);
  const totalEggs    = rows.reduce((s,r) => s + (parseFloat(r.eggs_used)||0), 0);
  const totalChikki  = rows.reduce((s,r) => s + (parseFloat(r.chikki_used)||0), 0);
  const totalRagi    = rows.reduce((s,r) => s + (parseFloat(r.ragi_used)||0), 0);
  const totalJaggery = rows.reduce((s,r) => s + (parseFloat(r.jaggery_used)||0), 0);

  const cell = (val, onChange, type="text", w=60, placeholder="") => (
    <input type={type} value={val} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      style={{width:w, border:"none", borderBottom:"1px solid #333", background:"transparent",
        fontFamily:"inherit", fontSize:"inherit", textAlign:"center", outline:"none", padding:"1px 2px"}} />
  );

  const hCell = (val, onChange, w=80) => (
    <input value={val} onChange={e=>onChange(e.target.value)}
      style={{width:w, border:"none", borderBottom:"1px solid #999", background:"transparent",
        fontFamily:"inherit", fontSize:"inherit", outline:"none", padding:"1px 3px"}} />
  );

  // Closing balance: opening + received - damaged ONLY (no totalAmt subtraction)
  const closingBalance =
    (parseFloat(hdr.opening_balance)||0) +
    (parseFloat(hdr.received_allotment)||0) -
    (parseFloat(hdr.damaged_expired)||0);

  const boysClassTotal  = [1,2,3,4,5].reduce((s,c) => s + (parseFloat(ftr[`boys_cls${c}`])||0), 0);
  const girlsClassTotal = [1,2,3,4,5].reduce((s,c) => s + (parseFloat(ftr[`girls_cls${c}`])||0), 0);
  const classGrandTotal = boysClassTotal + girlsClassTotal;

  return (
    <div style={{fontFamily:"Arial, sans-serif", fontSize:11, padding:12, background:"#fff", maxWidth:1000, margin:"0 auto"}}>
      <style>{`
        * { box-sizing:border-box; }
        input,select { font-size:11px; }
        table { border-collapse:collapse; }
        td,th { padding:1px 3px; }
        .outer { border:2px solid #000; padding:6px; }
        .print-btn { display:block; margin:10px auto; padding:8px 28px; background:#1a237e; color:#fff; border:none; cursor:pointer; font-size:13px; border-radius:4px; }
        @media print { .no-print{display:none;} body{margin:0;} }
      `}</style>

      <button className="no-print print-btn" onClick={() => window.print()}>🖨 Print / Save as PDF</button>

      <div className="outer">

        {/* Top header */}
        <table style={{width:"100%", marginBottom:2}}>
          <tbody><tr>
            <td style={{width:"15%", fontSize:9, color:"#555"}}>
              <div>Classes</div>
              <div style={{border:"1px solid #aaa", padding:"2px 4px", marginTop:2}}>
                <div>I to V</div><div>VI to VIII</div>
              </div>
            </td>
            <td style={{textAlign:"center", fontWeight:"bold", fontSize:13}}>
              <div style={{fontSize:8, fontStyle:"italic", color:"#444"}}>
                Dokka Seethamma Madhyamika Badi Bhojnam &nbsp;&nbsp;&nbsp; VIDYA SAARTHI
              </div>
              <div>DAY WISE CASH VOUCHER FOR SERVING OF PM POSHAN (Mid day Meal)</div>
            </td>
            <td style={{width:"15%", textAlign:"right", fontSize:9, color:"#555"}}>
              RICE &nbsp; EGGS &nbsp; CHIKKI &nbsp; RAGI &nbsp; JAGGERY
            </td>
          </tr></tbody>
        </table>

        {/* Village / Month */}
        <div style={{display:"flex", gap:8, alignItems:"center", marginBottom:4, flexWrap:"wrap", fontSize:11}}>
          <span style={{fontWeight:"bold"}}>MAKTHAPUR,</span>
          <span>Village,</span>
          {hCell(hdr.village, v=>setH("village",v), 90)}
          <span>Mandal (For the Month of</span>
          {hCell(hdr.month, v=>setH("month",v), 70)}
          <span>20</span>
          <input value={hdr.year||""} onChange={e=>setH("year",e.target.value)}
            style={{width:28, border:"none", borderBottom:"1px solid #999", background:"transparent", fontFamily:"inherit", fontSize:"inherit", outline:"none"}} />
          <span>)</span>
        </div>

        {/* Info + Balance table */}
        <table style={{width:"100%", marginBottom:4}}><tbody><tr valign="top">
          <td style={{width:"45%"}}>
            <table style={{width:"100%"}}><tbody>
              {[
                ["DISE CODE","dise_code",130],
                ["Implementing Agency Name","agency_name",130],
                ["Bank Name","bank_name",130],
                ["Bank Account No.","account_no",130],
                ["Working Days","working_days",60],
                ["Average Meals Taken","avg_meals",60],
                ["Number of Cook cum Helpers","num_cooks",60],
              ].map(([label,key,w]) => (
                <tr key={key}>
                  <td style={{fontSize:10, paddingRight:4, whiteSpace:"nowrap"}}>{label}</td>
                  <td><input value={hdr[key]||""} onChange={e=>setH(key,e.target.value)}
                    style={{width:w, border:"none", borderBottom:"1px solid #999", background:"transparent", fontFamily:"inherit", fontSize:10, outline:"none", padding:"1px 2px"}} /></td>
                </tr>
              ))}
            </tbody></table>
          </td>
          <td style={{width:"55%"}}>
            <table style={{width:"100%", border:"1px solid #888", fontSize:10}}>
              <thead>
                <tr style={{background:"#f0f0f0"}}>
                  <th style={{border:"1px solid #888", padding:"2px 4px"}}></th>
                  <th style={{border:"1px solid #888"}}>PM Poshan</th>
                  <th style={{border:"1px solid #888"}}>RICE</th>
                  <th style={{border:"1px solid #888"}}>EGGS</th>
                  <th style={{border:"1px solid #888"}}>CHIKKI</th>
                  <th style={{border:"1px solid #888"}}>RAGI</th>
                  <th style={{border:"1px solid #888"}}>JAGGERY</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["OPENING BALANCE",              "opening_balance",   "rice_open","eggs_open","chikki_open","ragi_open","jaggery_open"],
                  ["RECEIVED (ALLOTMENT)",          "received_allotment","rice_recv","eggs_recv","chikki_recv","ragi_recv","jaggery_recv"],
                  ["TOTAL (O.B. + RECD.)",          "total_rec",        "rice_total","eggs_total","chikki_total","ragi_total","jaggery_total"],
                  ["USED FOR EGG DIST / RICE USED", null,               "rice_used_tot","eggs_used_tot","chikki_used_tot","ragi_used_tot","jaggery_used_tot"],
                  ["DAMAGED OR EXPIRED",            "damaged_expired",  "rice_balance","eggs_balance","chikki_balance","ragi_balance","jaggery_balance"],
                ].map(([label,k0,k1,k2,k3,k4,k5]) => (
                  <tr key={label}>
                    <td style={{border:"1px solid #ccc", fontSize:9, whiteSpace:"nowrap", padding:"1px 3px"}}>{label}</td>
                    {[k0,k1,k2,k3,k4,k5].map((k,ci) => (
                      <td key={ci} style={{border:"1px solid #ccc", textAlign:"center"}}>
                        {k
                          ? <input value={hdr[k]||""} onChange={e=>setH(k,e.target.value)}
                              style={{width:46, border:"none", background:"transparent", fontFamily:"inherit", fontSize:10, textAlign:"center", outline:"none"}} />
                          : <span style={{color:"#aaa", fontSize:8}}>—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr style={{background:"#ffe", fontWeight:"bold"}}>
                  <td style={{border:"1px solid #ccc", fontSize:9, padding:"1px 3px"}}>CLOSING BALANCE</td>
                  <td style={{border:"1px solid #ccc", textAlign:"center", fontSize:10}}>
                    {closingBalance || ""}
                  </td>
                  {["rice","eggs","chikki","ragi","jaggery"].map(k => {
                    const tot  = (parseFloat(hdr[k+"_open"])||0)+(parseFloat(hdr[k+"_recv"])||0);
                    const used = (parseFloat(hdr[k+"_used_tot"])||0);
                    return <td key={k} style={{border:"1px solid #ccc", textAlign:"center", fontSize:10}}>{(tot-used)||""}</td>;
                  })}
                </tr>
              </tbody>
            </table>
          </td>
        </tr></tbody></table>

        {/* MAIN DAILY TABLE */}
        <table style={{width:"100%", border:"1px solid #000", fontSize:10}}>
          <thead>
            <tr style={{background:"#d0d8f0"}}>
              <th rowSpan={2} style={{border:"1px solid #888", width:22}}>Sl.<br/>No.</th>
              <th rowSpan={2} style={{border:"1px solid #888", width:50}}>DATE</th>
              <th rowSpan={2} style={{border:"1px solid #888", width:34}}>Week<br/>Day</th>
              <th rowSpan={2} style={{border:"1px solid #888", width:100}}>Holiday / Status</th>
              <th rowSpan={2} style={{border:"1px solid #888", width:32}}>Roll</th>
              <th rowSpan={2} style={{border:"1px solid #888", width:32}}>Present</th>
              <th rowSpan={2} style={{border:"1px solid #888", width:34}}>Meals<br/>Taken</th>
              <th rowSpan={2} style={{border:"1px solid #888", width:34}}>Meals<br/>Not Taken</th>
              <th colSpan={2} style={{border:"1px solid #888"}}>RICE (KGs)</th>
              <th rowSpan={2} style={{border:"1px solid #888", width:34}}>EGGS<br/>Nos.</th>
              <th rowSpan={2} style={{border:"1px solid #888", width:34}}>CHIKKI<br/>Nos.</th>
              <th rowSpan={2} style={{border:"1px solid #888", width:34}}>RAGI<br/>KGs</th>
              <th rowSpan={2} style={{border:"1px solid #888", width:38}}>JAGGERY<br/>KGs</th>
              <th rowSpan={2} style={{border:"1px solid #888", width:42}}>Amt/Child<br/>Rs.</th>
              <th rowSpan={2} style={{border:"1px solid #888", width:50}}>Amt/Day<br/>Rs.</th>
            </tr>
            <tr style={{background:"#d0d8f0"}}>
              <th style={{border:"1px solid #888", width:32}}>Used</th>
              <th style={{border:"1px solid #888", width:32}}>Not Used</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const isHoliday = !!r.holiday_type;
              const colorKey  = r.holiday_type === "CUSTOM" ? "CUSTOM" : r.holiday_type;
              const hColor    = HOLIDAY_COLORS[colorKey] || {bg:"#f5f5f5", text:"#333"};
              const label     = r.holiday_type === "CUSTOM" ? (r.holiday_custom || "HOLIDAY") : r.holiday_type;
              const amt       = amtPerDay(r);
              const rowBg     = isHoliday ? hColor.bg : i%2===0 ? "#fff" : "#f9f9f9";

              return (
                <tr key={i} style={{background:rowBg}}>
                  <td style={{border:"1px solid #ccc", textAlign:"center"}}>{i+1}</td>
                  <td style={{border:"1px solid #ccc", textAlign:"center"}}>
                    {cell(r.date, v=>setR(i,"date",v), "text", 48, `${i+1}`)}
                  </td>
                  <td style={{border:"1px solid #ccc", textAlign:"center"}}>
                    <select value={r.week_day} onChange={e=>setR(i,"week_day",e.target.value)}
                      style={{width:36, border:"none", background:"transparent", fontFamily:"inherit", fontSize:10, outline:"none"}}>
                      {DAYS_OF_WEEK.map(d=><option key={d}>{d}</option>)}
                    </select>
                  </td>

                  {/* Holiday selector — always shown */}
                  <td style={{border:"1px solid #ccc", textAlign:"center", padding:"1px 2px"}}>
                    <select
                      value={r.holiday_type==="CUSTOM"?"CUSTOM":r.holiday_type}
                      onChange={e=>{
                        setR(i,"holiday_type",e.target.value);
                        if(e.target.value!=="CUSTOM") setR(i,"holiday_custom","");
                      }}
                      style={{width: r.holiday_type==="CUSTOM"?56:94, border:"none", background:"transparent",
                        fontFamily:"inherit", fontSize:9, outline:"none",
                        color: isHoliday ? hColor.text : "#444", fontWeight: isHoliday?"bold":"normal"}}>
                      {HOLIDAY_TYPES.map(h=><option key={h.value} value={h.value}>{h.label}</option>)}
                    </select>
                    {r.holiday_type==="CUSTOM" && (
                      <input value={r.holiday_custom} onChange={e=>setR(i,"holiday_custom",e.target.value)}
                        placeholder="Enter name"
                        style={{width:52, border:"none", borderBottom:"1px solid #aaa", background:"transparent",
                          fontFamily:"inherit", fontSize:9, outline:"none", color:hColor.text}} />
                    )}
                  </td>

                  {isHoliday ? (
                    <td colSpan={12} style={{border:"1px solid #ccc", textAlign:"center",
                      color:hColor.text, fontWeight:"bold", letterSpacing:3, fontSize:10, background:hColor.bg}}>
                      {label}
                    </td>
                  ) : (
                    <>
                      <td style={{border:"1px solid #ccc"}}>{cell(r.roll,             v=>setR(i,"roll",v),            "number",30)}</td>
                      <td style={{border:"1px solid #ccc"}}>{cell(r.present,          v=>setR(i,"present",v),         "number",30)}</td>
                      <td style={{border:"1px solid #ccc"}}>{cell(r.meals_taken,      v=>setR(i,"meals_taken",v),     "number",32)}</td>
                      <td style={{border:"1px solid #ccc"}}>{cell(r.meals_not_taken,  v=>setR(i,"meals_not_taken",v), "number",32)}</td>
                      <td style={{border:"1px solid #ccc"}}>{cell(r.rice_used,        v=>setR(i,"rice_used",v),       "number",30)}</td>
                      <td style={{border:"1px solid #ccc"}}>{cell(r.rice_not_used,    v=>setR(i,"rice_not_used",v),   "number",30)}</td>
                      <td style={{border:"1px solid #ccc"}}>{cell(r.eggs_used,        v=>setR(i,"eggs_used",v),       "number",30)}</td>
                      <td style={{border:"1px solid #ccc"}}>{cell(r.chikki_used,      v=>setR(i,"chikki_used",v),     "number",30)}</td>
                      <td style={{border:"1px solid #ccc"}}>{cell(r.ragi_used,        v=>setR(i,"ragi_used",v),       "number",30)}</td>
                      <td style={{border:"1px solid #ccc"}}>{cell(r.jaggery_used,     v=>setR(i,"jaggery_used",v),    "number",36)}</td>
                      <td style={{border:"1px solid #ccc"}}>{cell(r.amount_per_child, v=>setR(i,"amount_per_child",v),"number",40)}</td>
                      <td style={{border:"1px solid #ccc", textAlign:"center", fontWeight:"bold", color:amt?"#006400":"#aaa"}}>
                        {amt ? amt.toFixed(2) : "—"}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}

            {/* TOTAL ROW */}
            <tr style={{background:"#e8eaf6", fontWeight:"bold"}}>
              <td colSpan={4} style={{border:"1px solid #888", textAlign:"center"}}>TOTAL</td>
              <td style={{border:"1px solid #888"}}></td>
              <td style={{border:"1px solid #888"}}></td>
              <td style={{border:"1px solid #888"}}></td>
              <td style={{border:"1px solid #888"}}></td>
              <td style={{border:"1px solid #888", textAlign:"center"}}>{totalRice    ? totalRice.toFixed(2)    : ""}</td>
              <td style={{border:"1px solid #888"}}></td>
              <td style={{border:"1px solid #888", textAlign:"center"}}>{totalEggs    || ""}</td>
              <td style={{border:"1px solid #888", textAlign:"center"}}>{totalChikki  || ""}</td>
              <td style={{border:"1px solid #888", textAlign:"center"}}>{totalRagi    ? totalRagi.toFixed(2)    : ""}</td>
              <td style={{border:"1px solid #888", textAlign:"center"}}>{totalJaggery ? totalJaggery.toFixed(2) : ""}</td>
              <td style={{border:"1px solid #888"}}></td>
              <td style={{border:"1px solid #888", textAlign:"center", color:"#006400"}}>{totalAmt ? totalAmt.toFixed(2) : ""}</td>
            </tr>
          </tbody>
        </table>

        {/* Total in words */}
        <div style={{marginTop:4, fontSize:10}}>
          <strong>TOTAL (Round off) (in words): Rupees&nbsp;</strong>
          <input value={ftr.total_amount_words} onChange={e=>setF("total_amount_words",e.target.value)}
            style={{width:420, border:"none", borderBottom:"1px solid #999", background:"transparent", fontFamily:"inherit", fontSize:10, outline:"none"}} />
          <strong>&nbsp;only</strong>
        </div>

        {/* Class-wise count */}
        <div style={{marginTop:10}}>
          <div style={{fontSize:10, fontWeight:"bold", marginBottom:4, borderBottom:"1px solid #888", paddingBottom:2}}>
            Class-wise Student Count (Classes I – V)
          </div>
          <table style={{border:"1px solid #888", fontSize:10}}>
            <thead>
              <tr style={{background:"#e0e0e0"}}>
                <th style={{border:"1px solid #888", padding:"2px 10px"}}>Gender</th>
                {[1,2,3,4,5].map(c=>(
                  <th key={c} style={{border:"1px solid #888", padding:"2px 14px"}}>Class {c}</th>
                ))}
                <th style={{border:"1px solid #888", padding:"2px 14px"}}>Total</th>
              </tr>
            </thead>
            <tbody>
              {[["Boys","boys"],["Girls","girls"]].map(([label,pfx]) => (
                <tr key={pfx}>
                  <td style={{border:"1px solid #ccc", padding:"2px 10px"}}>{label}</td>
                  {[1,2,3,4,5].map(c=>(
                    <td key={c} style={{border:"1px solid #ccc", textAlign:"center"}}>
                      {cell(ftr[`${pfx}_cls${c}`], v=>setF(`${pfx}_cls${c}`,v), "number", 42)}
                    </td>
                  ))}
                  <td style={{border:"1px solid #ccc", textAlign:"center", fontWeight:"bold", background:"#f5f5f5"}}>
                    {(pfx==="boys" ? boysClassTotal : girlsClassTotal) || ""}
                  </td>
                </tr>
              ))}
              <tr style={{background:"#e8eaf6", fontWeight:"bold"}}>
                <td style={{border:"1px solid #ccc", padding:"2px 10px"}}>Total</td>
                {[1,2,3,4,5].map(c=>(
                  <td key={c} style={{border:"1px solid #ccc", textAlign:"center"}}>
                    {((parseFloat(ftr[`boys_cls${c}`])||0)+(parseFloat(ftr[`girls_cls${c}`])||0)) || ""}
                  </td>
                ))}
                <td style={{border:"1px solid #ccc", textAlign:"center", background:"#d0d8f0"}}>
                  {classGrandTotal || ""}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Signature */}
        <table style={{width:"100%", marginTop:16, fontSize:10}}><tbody>
          <tr valign="bottom">
            <td style={{width:"40%"}}>
              <div>Signature: <input value={ftr.sign_name} onChange={e=>setF("sign_name",e.target.value)}
                style={{width:140, border:"none", borderBottom:"1px solid #999", background:"transparent", fontFamily:"inherit", fontSize:10, outline:"none"}} /></div>
              <div style={{marginTop:4}}>Date: <input value={ftr.sign_date} onChange={e=>setF("sign_date",e.target.value)}
                style={{width:100, border:"none", borderBottom:"1px solid #999", background:"transparent", fontFamily:"inherit", fontSize:10, outline:"none"}} /></div>
            </td>
            <td style={{width:"30%"}}>
              <div style={{fontStyle:"italic", fontSize:9, color:"#555"}}>Signature of the Mandal Educational Officer</div>
            </td>
            <td style={{width:"30%", textAlign:"right"}}>
              <div><input value={ftr.head_master_name} onChange={e=>setF("head_master_name",e.target.value)}
                placeholder="Head Master Name"
                style={{width:160, border:"none", borderBottom:"1px solid #999", background:"transparent", fontFamily:"inherit", fontSize:10, outline:"none", textAlign:"right"}} /></div>
              <div style={{fontWeight:"bold", fontSize:10}}>Head Master</div>
              <div><input value={ftr.school_name} onChange={e=>setF("school_name",e.target.value)}
                placeholder="MPPS / School Name"
                style={{width:180, border:"none", borderBottom:"1px solid #999", background:"transparent", fontFamily:"inherit", fontSize:10, outline:"none", textAlign:"right"}} /></div>
              <div style={{fontSize:9, color:"#555"}}>SPSR Nellore (D)</div>
            </td>
          </tr>
        </tbody></table>

      </div>

      <div className="no-print" style={{textAlign:"center", marginTop:8, fontSize:10, color:"#888"}}>
        ✅ Data auto-saved. &nbsp;|&nbsp; Amount per Day = Present × Amount per Child &nbsp;|&nbsp;
        Holiday types: <span style={{color:"#c00"}}>Sunday</span> &nbsp;
        <span style={{color:"#880e4f"}}>Holiday</span> &nbsp;
        <span style={{color:"#1b5e20"}}>School Holiday</span> &nbsp;
        <span style={{color:"#0d47a1"}}>Govt Holiday</span> &nbsp;
        <span style={{color:"#4a148c"}}>Vacation</span> &nbsp;
        <span style={{color:"#e65100"}}>Custom</span>
      </div>
    </div>
  );
}