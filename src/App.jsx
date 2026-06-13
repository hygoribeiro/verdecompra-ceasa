import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase, configured } from "./supabase";
import { CATEGORIES, UNITS, TYPES, STATUS, ROLES, money, num, margin, cost, price, sale, profit } from "./constants";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const submit = async (e) => {
    e.preventDefault(); setMessage("Entrando...");
    const result = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    setMessage(result.error ? "E-mail ou senha inválidos." : "");
  };
  return <main className="auth-page"><section className="auth-card"><div className="brand auth-brand"><div className="brand-mark">VR</div><div><strong>VERDURÃO RIBEIRO</strong><span>Controle CEASA</span></div></div><p className="eyebrow">Acesso seguro</p><h1>Entrar</h1><p className="muted">Use o e-mail e a senha fornecidos pelo administrador.</p><form onSubmit={submit}><label>E-mail<input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label><label>Senha<input type="password" minLength="6" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label><button className="btn primary full">Entrar</button></form>{message && <p className="auth-message">{message}</p>}</section></main>;
}

function MissingConfig() {
  return <main className="auth-page"><section className="auth-card"><h1>Configure o Supabase</h1><p>Crie o arquivo <code>.env.local</code> usando <code>.env.example</code> e reinicie o app.</p></section></main>;
}

function Stat({ label, value, note }) { return <div className="stat"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>; }
function Totals({ items, margins }) {
  return items.reduce((a, i) => ({ spent: a.spent + Number(i.paid_total || 0), sale: a.sale + sale(i, margins), profit: a.profit + profit(i, margins) }), { spent: 0, sale: 0, profit: 0 });
}

export default function App() {
  const [session, setSession] = useState(null), [profile, setProfile] = useState(null), [products, setProducts] = useState([]), [lists, setLists] = useState([]), [selectedListId, setSelectedListId] = useState(null), [items, setItems] = useState([]), [margins, setMargins] = useState({}), [view, setView] = useState("lista"), [search, setSearch] = useState(""), [category, setCategory] = useState(""), [loading, setLoading] = useState(true), [notice, setNotice] = useState(""), [dark, setDark] = useState(false);
  const activeList = lists.find(l => l.id === selectedListId) || lists.find(l => l.status === "aberta") || lists[0];
  const isAdmin = profile?.role === "administrador", canPlan = ["administrador", "funcionario"].includes(profile?.role), canBuy = ["administrador", "comprador"].includes(profile?.role);
  const canEditPlan = canPlan && activeList?.status === "aberta", canEditPurchase = canBuy && activeList?.status === "aberta";
  const flash = (text) => { setNotice(text); setTimeout(() => setNotice(""), 2500); };
  const load = useCallback(async () => {
    if (!session) return;
    const [pr, ps, ls, ms] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", session.user.id).single(),
      supabase.from("products").select("*").order("name"),
      supabase.from("shopping_lists").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("category_margins").select("*"),
    ]);
    setProfile(pr.data); setProducts(ps.data || []); setLists(ls.data || []); setMargins(Object.fromEntries((ms.data || []).map(x => [x.category, x.margin])));
    const availableLists = ls.data || [];
    const listId = availableLists.some(x => x.id === selectedListId) ? selectedListId : availableLists.find(x => x.status === "aberta")?.id || availableLists[0]?.id;
    if (listId && listId !== selectedListId) setSelectedListId(listId);
    if (listId) { const it = await supabase.from("list_items").select("*, product:products(*)").eq("list_id", listId).order("created_at"); setItems(it.data || []); }
    else setItems([]);
    setLoading(false);
  }, [session, selectedListId]);
  useEffect(() => {
    if (!configured) return;
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!session) return;
    const channel = supabase.channel("ceasa-live").on("postgres_changes", { event: "*", schema: "public", table: "list_items" }, load).on("postgres_changes", { event: "*", schema: "public", table: "shopping_lists" }, load).on("postgres_changes", { event: "*", schema: "public", table: "products" }, load).subscribe();
    return () => supabase.removeChannel(channel);
  }, [session, load]);
  const updateItem = async (id, patch) => { const { error } = await supabase.from("list_items").update(patch).eq("id", id); if (error) flash(error.message); else load(); };
  const addProduct = async () => {
    const name = prompt("Nome do novo produto:"); if (!name) return;
    const { error } = await supabase.from("products").insert({ name, category: "outros", purchase_unit: "kg", type: "normal" }); if (error) flash(error.message); else load();
  };
  const addToList = async (productId) => {
    if (!activeList) { flash("Crie uma lista antes de adicionar produtos."); return; }
    if (activeList.status === "finalizada") { flash("Listas finalizadas ficam disponíveis somente para consulta."); return; }
    const { error } = await supabase.from("list_items").insert({ list_id: activeList.id, product_id: productId, status: "comprar", planned_quantity: 1 }); if (error) flash(error.message); else load();
  };
  const createList = async () => { const title = prompt("Nome da nova lista:", `Compra ${new Date().toLocaleDateString("pt-BR")}`); if (!title) return; const { data, error } = await supabase.from("shopping_lists").insert({ title, created_by: session.user.id }).select().single(); if (error) flash(error.message); else { setSelectedListId(data.id); setView("lista"); } };
  const filtered = useMemo(() => items.filter(i => (!search || i.product.name.toLowerCase().includes(search.toLowerCase())) && (!category || i.product.category === category)), [items, search, category]);
  const totals = Totals({ items, margins }), bought = items.filter(i => i.status === "comprado");
  if (!configured) return <MissingConfig />; if (!session) return <Login />; if (loading) return <main className="auth-page"><h2>Carregando Verdurão Ribeiro...</h2></main>;
  return <div className={dark ? "dark app-shell" : "app-shell"}>
    <header className="topbar"><div className="brand"><div className="brand-mark">VR</div><div><strong>VERDURÃO RIBEIRO</strong><span>Controle CEASA</span></div></div><div className="header-actions"><button className="icon-btn" onClick={() => setDark(!dark)}>{dark ? "☀" : "◐"}</button><button className="profile-btn" onClick={() => supabase.auth.signOut()}><span>{ROLES[profile?.role] || "Usuário"}</span><b>{(profile?.full_name || session.user.email)[0].toUpperCase()}</b></button></div></header>
    <nav className="nav">{[["lista","☷","Lista"],["comprador","✓","Comprar"],["historico","◷","Listas"],["relatorios","▥","Relatórios"],["config","⚙","Ajustes"]].map(([id,ico,label]) => <button key={id} className={view === id ? "active" : ""} onClick={() => setView(id)}><span>{ico}</span>{label}</button>)}</nav>
    <main>
      {view === "lista" && <><div className="page-head"><div><p className="eyebrow">{activeList?.status === "finalizada" ? "Lista finalizada · somente consulta" : "Sincronizada em tempo real"}</p><h1>{activeList?.title || "Lista de compra"}</h1><p>Planejamento compartilhado da equipe.</p></div>{canPlan && <div className="head-actions"><button className="btn secondary" onClick={createList}>Nova lista</button><button className="btn primary" onClick={addProduct}>+ Cadastrar produto</button></div>}</div><div className="stats"><Stat label="Na lista" value={items.length} note={`${bought.length} comprados`} /><Stat label="Total gasto" value={money(totals.spent)} note="atualizado online" /><Stat label="Venda estimada" value={money(totals.sale)} note="preços sugeridos" /><Stat label="Lucro estimado" value={money(totals.profit)} note="lucro bruto" /></div><div className="toolbar"><label className="search"><span>⌕</span><input placeholder="Buscar produto..." value={search} onChange={e=>setSearch(e.target.value)} /></label><select value={category} onChange={e=>setCategory(e.target.value)}><option value="">Todas as categorias</option>{Object.entries(CATEGORIES).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select><button className="btn ghost" onClick={() => window.print()}>Imprimir / PDF</button></div><div className="product-grid">{filtered.map(i=><ProductCard key={i.id} item={i} margins={margins} canPlan={canEditPlan} updateItem={updateItem} />)}</div>{canEditPlan && <section className="panel catalog-panel"><div className="panel-head"><h3>Adicionar produto à lista</h3></div><div className="compact-products">{products.filter(p=>!items.some(i=>i.product_id===p.id)).map(p=><div className="catalog-row" key={p.id}><span><b>{p.name}</b> · {CATEGORIES[p.category]}</span><button className="btn secondary" onClick={()=>addToList(p.id)}>Adicionar</button></div>)}</div></section>}</>}
      {view === "comprador" && <Buyer items={items} margins={margins} canBuy={canEditPurchase} updateItem={updateItem} totals={totals} activeList={activeList} userId={session.user.id} reload={load} flash={flash} />}
      {view === "historico" && <History lists={lists} selectedListId={activeList?.id} selectList={(id) => { setSelectedListId(id); setView("lista"); }} createList={createList} canPlan={canPlan} />}
      {view === "relatorios" && <Reports items={items} margins={margins} totals={totals} />}
      {view === "config" && <Settings margins={margins} profile={profile} isAdmin={isAdmin} products={products} reload={load} flash={flash} />}
    </main>{notice && <div className="toast show">{notice}</div>}
  </div>;
}

function History({ lists, selectedListId, selectList, createList, canPlan }) {
  return <><div className="page-head"><div><p className="eyebrow">Últimas 20 listas salvas</p><h1>Histórico de listas</h1><p>Abra compras anteriores sem apagar os dados.</p></div>{canPlan && <button className="btn primary" onClick={createList}>+ Nova lista</button>}</div><div className="history-cards">{lists.map(list=><article className={`history-card ${list.id===selectedListId?"selected":""}`} key={list.id}><div><span className={`chip ${list.status}`}>{list.status}</span><h3>{list.title}</h3><p>{new Date(list.purchase_date+"T12:00:00").toLocaleDateString("pt-BR")} · criada em {new Date(list.created_at).toLocaleDateString("pt-BR")}</p></div><button className="btn secondary" onClick={()=>selectList(list.id)}>{list.id===selectedListId?"Lista aberta":"Abrir lista"}</button></article>)}</div>{!lists.length && <div className="empty"><b>Nenhuma lista salva</b><span>Crie sua primeira lista de compras.</span></div>}</>;
}

function ProductCard({ item, margins, canPlan, updateItem }) {
  return <article className="product-card"><div className="card-top"><div className="product-icon">●</div><span className={`chip ${item.status}`}>{STATUS[item.status]}</span></div><h3>{item.product.name}</h3><div className="sub">{CATEGORIES[item.product.category]} · compra por {item.product.purchase_unit}</div><div className="chips"><span className="chip">{TYPES[item.product.type]}</span><span className="chip">Margem {margin(item,margins)}%</span></div><div className="card-numbers"><div><span>Planejado</span><b>{num(item.planned_quantity)}</b></div><div><span>Valor pago</span><b>{money(item.paid_total)}</b></div><div><span>Custo base</span><b>{money(cost(item))}</b></div><div><span>Venda sugerida</span><b>{money(price(item,margins))}</b></div></div>{canPlan && <div className="card-actions"><button onClick={()=>updateItem(item.id,{planned_quantity:Number(prompt("Quantidade planejada:",item.planned_quantity)||item.planned_quantity)})}>Planejar</button><button onClick={()=>updateItem(item.id,{status:item.status==="nao_comprar"?"comprar":"nao_comprar"})}>{item.status==="nao_comprar"?"Adicionar":"Remover"}</button></div>}</article>;
}

function Buyer({ items, margins, canBuy, updateItem, totals, activeList, userId, reload, flash }) {
  const finish = async () => { if (!confirm("Finalizar esta compra?")) return; const { error } = await supabase.from("shopping_lists").update({ status: "finalizada", finalized_by: userId, finalized_at: new Date().toISOString() }).eq("id", activeList.id); if (error) flash(error.message); else { flash("Compra finalizada."); reload(); } };
  return <><div className="page-head"><div><p className="eyebrow">Modo comprador</p><h1>Compra no CEASA</h1><p>Valores são sincronizados com a loja.</p></div>{canBuy && activeList && <button className="btn success" onClick={finish}>Finalizar compra</button>}</div><div className="stats"><Stat label="Comprados" value={`${items.filter(i=>i.status==="comprado").length}/${items.length}`} note="progresso" /><Stat label="Total gasto" value={money(totals.spent)} note="compra atual" /><Stat label="Venda estimada" value={money(totals.sale)} note="faturamento previsto" /><Stat label="Lucro bruto" value={money(totals.profit)} note="estimado" /></div>{!canBuy && <div className="permission-note">Seu perfil pode acompanhar, mas não alterar os valores da compra.</div>}<div className="buyer-list">{items.filter(i=>i.status!=="nao_comprar").map(i=><BuyerRow key={i.id} item={i} margins={margins} disabled={!canBuy} updateItem={updateItem} />)}</div></>;
}
function BuyerRow({ item, margins, disabled, updateItem }) {
  const field=(key,label,type="number")=><label>{label}<input disabled={disabled} type={type} defaultValue={item[key] || ""} onBlur={e=>updateItem(item.id,{[key]:type==="number"?Number(e.target.value):e.target.value})} /></label>;
  return <article className={`buyer-card ${item.status==="comprado"?"done":""}`}><div className="buyer-info"><h3>{item.product.name}</h3><p>Planejado: {num(item.planned_quantity)} {item.product.purchase_unit}</p></div>{field("purchased_quantity","Quantidade")}{field("weight_kg","Peso total (kg)")}{field("paid_total","Valor pago (R$)")}<label>Qualidade<select disabled={disabled} value={item.quality} onChange={e=>updateItem(item.id,{quality:e.target.value})}><option value="excelente">Excelente</option><option value="boa">Boa</option><option value="regular">Regular</option><option value="ruim">Ruim</option></select></label>{field("observation","Observação","text")}<div className="calc-box"><span>Custo base</span><b>{money(cost(item))}</b><span>Venda sugerida</span><b>{money(price(item,margins))}</b></div><button disabled={disabled} className="btn success" onClick={()=>updateItem(item.id,{status:item.status==="comprado"?"comprar":"comprado"})}>{item.status==="comprado"?"Comprado ✓":"Marcar comprado"}</button></article>;
}

function Reports({ items, margins, totals }) {
  const sorted=[...items].filter(i=>i.status==="comprado").sort((a,b)=>Number(b.paid_total)-Number(a.paid_total));
  return <><div className="page-head"><div><p className="eyebrow">Visão gerencial</p><h1>Relatórios</h1><p>Decisões baseadas na compra atual.</p></div></div><div className="stats"><Stat label="Total gasto" value={money(totals.spent)} /><Stat label="Venda estimada" value={money(totals.sale)} /><Stat label="Lucro bruto" value={money(totals.profit)} /><Stat label="Margem geral" value={`${num(totals.spent?totals.profit/totals.spent*100:0)}%`} /></div><div className="report-grid"><article className="panel"><h3>Produtos mais caros</h3>{sorted.slice(0,8).map(i=><div className="rank-row" key={i.id}><span>{i.product.name}</span><b>{money(i.paid_total)}</b></div>)}</article><article className="panel"><h3>Melhores lucros estimados</h3>{[...sorted].sort((a,b)=>profit(b,margins)-profit(a,margins)).slice(0,8).map(i=><div className="rank-row" key={i.id}><span>{i.product.name}</span><b>{money(profit(i,margins))}</b></div>)}</article></div></>;
}
function Settings({ margins, profile, isAdmin, products, reload, flash }) {
  const updateMargin=async(category,value)=>{const {error}=await supabase.from("category_margins").update({margin:Number(value)}).eq("category",category);if(error)flash(error.message);else reload()};
  return <><div className="page-head"><div><p className="eyebrow">Conta e regras</p><h1>Configurações</h1><p>Seu perfil: {ROLES[profile?.role]}</p></div></div><div className="settings-grid"><article className="panel"><h3>Margens por categoria</h3>{Object.entries(CATEGORIES).map(([k,v])=><div className="margin-setting" key={k}><b>{v}</b><input disabled={!isAdmin} type="number" defaultValue={margins[k]} onBlur={e=>updateMargin(k,e.target.value)} /></div>)}</article><article className="panel"><h3>Catálogo online</h3><p className="muted">{products.length} produtos cadastrados. Administradores e funcionários podem cadastrar produtos pela Lista.</p><p className="permission-note">Perfis são alterados pelo administrador diretamente no painel do Supabase.</p></article></div></>;
}
