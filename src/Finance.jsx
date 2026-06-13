import { useMemo, useState } from "react";
import { supabase } from "./supabase";
import { EXPENSE_STATUS, PAYMENT_METHODS, money } from "./constants";

const emptyForm = { expense_date: new Date().toISOString().slice(0, 10), store_id: "", category_id: "", description: "", amount: "", payment_method: "Pix", observation: "", status: "pago" };

export default function Finance({ expenses, stores, categories, selectedStoreId, profile, range, reload, flash }) {
  const [form, setForm] = useState(emptyForm), [editing, setEditing] = useState(null), [query, setQuery] = useState(""), [category, setCategory] = useState(""), [file, setFile] = useState(null);
  const storeId = editing?.store_id || (selectedStoreId === "all" ? form.store_id : selectedStoreId);
  const baseExpenses = useMemo(() => expenses.filter(e => (selectedStoreId === "all" || e.store_id === selectedStoreId) && e.expense_date >= range.start && e.expense_date <= range.end), [expenses, selectedStoreId, range.start, range.end]);
  const filtered = useMemo(() => baseExpenses.filter(e => (!query || `${e.description} ${e.observation}`.toLowerCase().includes(query.toLowerCase())) && (!category || e.category_id === category)), [baseExpenses, query, category]);
  const total = filtered.reduce((a, e) => a + Number(e.amount), 0);
  const days = Math.max(1, Math.round((new Date(range.end) - new Date(range.start)) / 86400000) + 1), previousEnd = new Date(range.start+"T12:00"), previousStart = new Date(range.start+"T12:00");
  previousEnd.setDate(previousEnd.getDate()-1); previousStart.setDate(previousStart.getDate()-days);
  const previousTotal = expenses.filter(e=>(selectedStoreId==="all"||e.store_id===selectedStoreId)&&e.expense_date>=previousStart.toISOString().slice(0,10)&&e.expense_date<=previousEnd.toISOString().slice(0,10)).reduce((a,e)=>a+Number(e.amount),0);
  const comparison = previousTotal ? (total-previousTotal)/previousTotal*100 : 0;
  const grouped = categories.map(c => ({ name: c.name, total: filtered.filter(e => e.category_id === c.id).reduce((a, e) => a + Number(e.amount), 0) })).filter(x => x.total > 0).sort((a, b) => b.total - a.total);
  const storeGroups = stores.map(s => ({ name: s.name, total: filtered.filter(e => e.store_id === s.id).reduce((a, e) => a + Number(e.amount), 0) })).filter(x => x.total > 0);

  const submit = async (event) => {
    event.preventDefault();
    if (!storeId) return flash("Selecione uma loja.");
    let receipt_path = editing?.receipt_path || null;
    if (file) {
      const path = `${storeId}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
      const upload = await supabase.storage.from("expense-receipts").upload(path, file);
      if (upload.error) return flash(upload.error.message);
      receipt_path = path;
    }
    const payload = { ...form, amount: Number(form.amount), store_id: storeId, created_by: editing?.created_by || profile.id, receipt_path };
    const result = editing ? await supabase.from("expenses").update(payload).eq("id", editing.id) : await supabase.from("expenses").insert(payload);
    if (result.error) flash(result.error.message); else { flash(editing ? "Despesa atualizada." : "Despesa cadastrada."); setForm(emptyForm); setEditing(null); setFile(null); reload(); }
  };
  const edit = (expense) => { setEditing(expense); setForm({ expense_date: expense.expense_date, store_id: expense.store_id, category_id: expense.category_id, description: expense.description, amount: expense.amount, payment_method: expense.payment_method, observation: expense.observation, status: expense.status }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const remove = async (expense) => {
    if (!confirm(`Excluir a despesa "${expense.description}"? Esta ação ficará registrada no histórico.`)) return;
    const { error } = await supabase.from("expenses").delete().eq("id", expense.id);
    if (error) flash(error.message); else { flash("Despesa excluída."); reload(); }
  };
  const exportCsv = () => {
    const rows = [["Data","Loja","Categoria","Descrição","Valor","Pagamento","Status","Observação"], ...filtered.map(e => [e.expense_date,e.store?.name,e.category?.name,e.description,e.amount,e.payment_method,EXPENSE_STATUS[e.status],e.observation])];
    const blob = new Blob(["\ufeff"+rows.map(r=>r.map(x=>`"${String(x??"").replaceAll('"','""')}"`).join(";")).join("\n")], { type: "text/csv;charset=utf-8" });
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`financeiro-${range.start}-${range.end}.csv`; a.click();
  };
  return <div className="finance-page">
    <div className="page-head"><div><p className="eyebrow">Controle de despesas</p><h1>Financeiro</h1><p>Período de {new Date(range.start+"T12:00").toLocaleDateString("pt-BR")} até {new Date(range.end+"T12:00").toLocaleDateString("pt-BR")}.</p></div><div className="head-actions"><button className="btn secondary" onClick={exportCsv}>Exportar Excel</button><button className="btn ghost" onClick={()=>window.print()}>Imprimir / PDF</button></div></div>
    <div className="stats"><Stat label="Total de despesas" value={money(total)} note={`${filtered.length} lançamentos`} /><Stat label="Comparação anterior" value={`${comparison>=0?"+":""}${comparison.toLocaleString("pt-BR",{maximumFractionDigits:1})}%`} note={`anterior: ${money(previousTotal)}`} /><Stat label="Despesas pagas" value={money(filtered.filter(e=>e.status==="pago").reduce((a,e)=>a+Number(e.amount),0))} note="no período" /><Stat label="Pendentes/vencidas" value={money(filtered.filter(e=>e.status!=="pago").reduce((a,e)=>a+Number(e.amount),0))} note="requer atenção" /></div>
    <div className="finance-layout">
      <form className="panel expense-form" onSubmit={submit}><div className="panel-head"><h3>{editing ? "Editar despesa" : "Nova despesa"}</h3>{editing&&<button type="button" className="btn ghost" onClick={()=>{setEditing(null);setForm(emptyForm)}}>Cancelar</button>}</div><div className="form-grid">
        <label>Data<input type="date" required value={form.expense_date} onChange={e=>setForm({...form,expense_date:e.target.value})}/></label>
        {selectedStoreId==="all"&&<label>Loja<select required value={form.store_id} onChange={e=>setForm({...form,store_id:e.target.value})}><option value="">Selecione</option>{stores.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>}
        <label>Categoria<select required value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})}><option value="">Selecione</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="span2">Descrição<input required value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
        <label>Valor<input type="number" min="0" step=".01" required value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></label>
        <label>Forma de pagamento<select value={form.payment_method} onChange={e=>setForm({...form,payment_method:e.target.value})}>{PAYMENT_METHODS.map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>{Object.entries(EXPENSE_STATUS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
        <label>Comprovante<input type="file" accept="image/*,.pdf" onChange={e=>setFile(e.target.files[0])}/></label>
        <label className="span2">Observação<textarea rows="2" value={form.observation} onChange={e=>setForm({...form,observation:e.target.value})}/></label>
      </div><button className="btn primary full">{editing?"Salvar alterações":"Cadastrar despesa"}</button></form>
      <article className="panel"><h3>Total por categoria</h3><Bars data={grouped}/><h3 className="section-title">Total por loja</h3><Bars data={storeGroups}/></article>
    </div>
    <div className="toolbar"><label className="search"><span>⌕</span><input placeholder="Buscar despesa..." value={query} onChange={e=>setQuery(e.target.value)}/></label><select value={category} onChange={e=>setCategory(e.target.value)}><option value="">Todas as categorias</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
    <div className="expense-list">{filtered.map(e=><article className="expense-row" key={e.id}><div><span className={`chip ${e.status}`}>{EXPENSE_STATUS[e.status]}</span><h3>{e.description}</h3><p>{new Date(e.expense_date+"T12:00").toLocaleDateString("pt-BR")} · {e.store?.name} · {e.category?.name} · {e.payment_method}</p>{e.observation&&<small>{e.observation}</small>}</div><strong>{money(e.amount)}</strong><div className="row-actions"><button className="btn secondary" onClick={()=>edit(e)}>Editar</button><button className="btn danger" onClick={()=>remove(e)}>Excluir</button></div></article>)}</div>
  </div>;
}

function Stat({label,value,note}) { return <div className="stat"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>; }
function Bars({data}) { const max=Math.max(...data.map(x=>x.total),1); return data.length?<div>{data.slice(0,8).map(x=><div className="bar-row" key={x.name}><b>{x.name}</b><div className="bar"><i style={{width:`${x.total/max*100}%`}}/></div><span>{money(x.total)}</span></div>)}</div>:<p className="muted">Sem dados no período.</p>; }
