import { useState } from 'react';

const ICONS = ['✈️','🏨','🚕','🍽️','🛡️','🏛️','☕','🚌','🛍️','🎭','🎆','🎡','🏖️','🥘','🎾'];

export default function App() {
  const [screen, setScreen] = useState('setup'); // 'setup' | 'app'
  const [tripName, setTripName] = useState('');
  const [currency, setCurrency] = useState('KZT');
  const [tripDate, setTripDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [members, setMembers] = useState([]);
  const [memberInput, setMemberInput] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [tab, setTab] = useState('expenses');
  const [toastMsg, setToastMsg] = useState('');
  const [deleteIndex, setDeleteIndex] = useState(null);

  // add-expense form state
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [payer, setPayer] = useState('');
  const [icon, setIcon] = useState('✈️');
  const [participants, setParticipants] = useState([]);

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2800);
  }

  function addSetupMember() {
    const name = memberInput.trim();
    if (!name || members.includes(name)) { showToast('Атау бос немесе бұрыннан бар!'); return; }
    setMembers([...members, name]);
    setMemberInput('');
  }

  function removeSetupMember(name) {
    setMembers(members.filter(m => m !== name));
  }

  function startTrip() {
    if (!tripName.trim()) { showToast('Саяхат атауын жазыңыз!'); return; }
    if (members.length < 2) { showToast('Кем дегенде 2 мүше қосыңыз!'); return; }
    setPayer(members[0]);
    setParticipants([...members]);
    setScreen('app');
  }

  function loadDemo() {
    const demoMembers = ['Айгерім', 'Бекзат', 'Динара', 'Ерлан'];
    setTripName('Алматы — Стамбул 2025 ✈️');
    setCurrency('KZT');
    setMembers(demoMembers);
    setExpenses([
      { desc: 'Авиабилет (барлығы)', amount: 240000, payer: 'Айгерім', participants: [...demoMembers], date: '15.07.2025', icon: '✈️' },
      { desc: 'Қонақ үй 3 түн', amount: 90000, payer: 'Бекзат', participants: [...demoMembers], date: '15.07.2025', icon: '🏨' },
      { desc: 'Такси (аэропорт)', amount: 12000, payer: 'Динара', participants: [...demoMembers], date: '15.07.2025', icon: '🚕' },
      { desc: 'Кешкі ас (ресторан)', amount: 28000, payer: 'Ерлан', participants: [...demoMembers], date: '16.07.2025', icon: '🍽️' },
      { desc: 'Мұражай билеттері', amount: 9600, payer: 'Бекзат', participants: ['Бекзат', 'Динара', 'Ерлан'], date: '16.07.2025', icon: '🏛️' },
    ]);
    setPayer(demoMembers[0]);
    setParticipants([...demoMembers]);
    setScreen('app');
  }

  function toggleParticipant(name) {
    setParticipants(p => p.includes(name) ? p.filter(x => x !== name) : [...p, name]);
  }

  function addExpense() {
    if (!desc.trim()) { showToast('Сипаттама жазыңыз!'); return; }
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { showToast('Дұрыс сома енгізіңіз!'); return; }
    if (participants.length === 0) { showToast('Кем дегенде 1 бөлісуші таңдаңыз!'); return; }
    const today = new Date();
    const date = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;
    setExpenses([...expenses, { desc, amount: amt, payer, participants: [...participants], date, icon }]);
    setDesc('');
    setAmount('');
    setIcon('✈️');
    showToast(`✓ "${desc}" қосылды`);
  }

  function confirmDelete() {
    if (deleteIndex !== null) {
      setExpenses(expenses.filter((_, i) => i !== deleteIndex));
      showToast('Шығыс жойылды');
    }
    setDeleteIndex(null);
  }

  function computeBalances() {
    const bal = {};
    members.forEach(m => (bal[m] = 0));
    expenses.forEach(e => {
      const share = e.amount / e.participants.length;
      bal[e.payer] = (bal[e.payer] || 0) + e.amount;
      e.participants.forEach(p => { bal[p] = (bal[p] || 0) - share; });
    });
    return bal;
  }

  function computeSettlements() {
    const bal = computeBalances();
    let creditors = Object.entries(bal).filter(([, v]) => v > 0.01).map(([k, v]) => [v, k]).sort((a, b) => b[0] - a[0]);
    let debtors = Object.entries(bal).filter(([, v]) => v < -0.01).map(([k, v]) => [Math.abs(v), k]).sort((a, b) => b[0] - a[0]);
    const res = [];
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const amt = Math.min(debtors[i][0], creditors[j][0]);
      const rounded = Math.round(amt * 100) / 100;
      if (rounded > 0.01) res.push({ from: debtors[i][1], to: creditors[j][1], amount: rounded });
      debtors[i][0] -= amt;
      creditors[j][0] -= amt;
      if (debtors[i][0] < 0.01) i++;
      if (creditors[j][0] < 0.01) j++;
    }
    return res;
  }

  function fmt(n) {
    return Number(n).toLocaleString('kk-KZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function goHome() {
    if (expenses.length > 0 && !window.confirm('Басты бетке қайту керек пе? Деректер жоғалады.')) return;
    setScreen('setup');
    setTripName('');
    setMembers([]);
    setExpenses([]);
    setTab('expenses');
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const perPerson = members.length ? total / members.length : 0;
  const bal = computeBalances();
  const paid = {};
  expenses.forEach(e => { paid[e.payer] = (paid[e.payer] || 0) + e.amount; });
  const settlements = computeSettlements();

  if (screen === 'setup') {
    return (
      <div id="setup-screen">
        <div style={{ marginBottom: 32 }}>
          <div className="hero-eyebrow">🌍 Саяхат серігі</div>
          <h1 className="hero-title">Sapar<em>Split</em></h1>
          <p className="hero-sub">Кім қанша төлеп, кім кімге қарыз екенін бір секундта біл</p>
        </div>
        <div className="setup-card">
          <div className="form-group">
            <label className="field-label">Саяхат атауы</label>
            <input type="text" value={tripName} onChange={e => setTripName(e.target.value)} placeholder="мысалы: Стамбул 2025 ✈️" />
          </div>
          <div className="form-row">
            <div>
              <label className="field-label">Валюта</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)}>
                <option value="KZT">🇰🇿 KZT — Теңге</option>
                <option value="USD">🇺🇸 USD — Доллар</option>
                <option value="EUR">🇪🇺 EUR — Евро</option>
                <option value="RUB">🇷🇺 RUB — Рубль</option>
                <option value="TRY">🇹🇷 TRY — Лира</option>
              </select>
            </div>
            <div>
              <label className="field-label">Жасалған күн</label>
              <input type="date" value={tripDate} onChange={e => setTripDate(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="field-label">Мүшелер қосу</label>
            <div className="members-row">
              <input
                type="text"
                value={memberInput}
                onChange={e => setMemberInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSetupMember()}
                placeholder="Атын жазыңыз..."
              />
              <button className="btn btn-amber" onClick={addSetupMember}>+ Қос</button>
            </div>
            <div className="tag-list">
              {members.map(m => (
                <span className="tag" key={m}>
                  {m}
                  <button className="del" onClick={() => removeSetupMember(m)}>✕</button>
                </span>
              ))}
            </div>
          </div>
          <button className="btn btn-primary btn-full" onClick={startTrip}>Саяхатты бастау →</button>
          <button className="btn btn-ghost btn-full" style={{ marginTop: 8 }} onClick={loadDemo}>📋 Демо мәліметтерді жүктеу</button>
        </div>
        {toastMsg && <div id="toast" className="show">{toastMsg}</div>}
      </div>
    );
  }

  return (
    <div id="app">
      <header>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="logo">Sapar<span>Split</span></div>
        </div>
        <nav>
          <button className={`nav-btn ${tab === 'expenses' ? 'active' : ''}`} onClick={() => setTab('expenses')}>💰 Шығыстар</button>
          <button className={`nav-btn ${tab === 'balance' ? 'active' : ''}`} onClick={() => setTab('balance')}>⚖️ Баланс</button>
          <button className={`nav-btn ${tab === 'settle' ? 'active' : ''}`} onClick={() => setTab('settle')}>💸 Есеп</button>
          <button className="nav-btn" onClick={goHome} title="Басты бетке қайту">🏠</button>
        </nav>
      </header>

      <main>
        {tab === 'expenses' && (
          <div>
            <div className="stats-row">
              <div className="stat-box">
                <div className="stat-val">{fmt(total)}</div>
                <div className="stat-label">{currency} · жалпы шығыс</div>
              </div>
              <div className="stat-box amber">
                <div className="stat-val">{fmt(perPerson)}</div>
                <div className="stat-label">{currency} · бір адамға</div>
              </div>
              <div className="stat-box teal">
                <div className="stat-val">{expenses.length}</div>
                <div className="stat-label">жазба · {members.length} мүше</div>
              </div>
            </div>

            <div className="grid-2">
              <div className="card">
                <div className="section-title">Шығыс қосу</div>
                <div className="form-group">
                  <label className="field-label">Сипаттама</label>
                  <input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="мысалы: Авиабилет" />
                </div>
                <div className="form-group">
                  <label className="field-label">Иконка</label>
                  <div className="icon-picker">
                    {ICONS.map(ic => (
                      <div key={ic} className={`icon-btn ${icon === ic ? 'active' : ''}`} onClick={() => setIcon(ic)}>{ic}</div>
                    ))}
                  </div>
                </div>
                <div className="form-row">
                  <div>
                    <label className="field-label">Сомасы</label>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" min="0" step="0.01" />
                  </div>
                  <div>
                    <label className="field-label">Кім төледі?</label>
                    <select value={payer} onChange={e => setPayer(e.target.value)}>
                      {members.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="field-label">Бөлісушілер</label>
                  <div className="pill-group">
                    {members.map(m => (
                      <span key={m} className={`pill ${participants.includes(m) ? 'active' : ''}`} onClick={() => toggleParticipant(m)}>{m}</span>
                    ))}
                  </div>
                </div>
                <button className="btn btn-amber btn-full" onClick={addExpense}>+ Шығыс қосу</button>
              </div>

              <div className="card">
                <div className="section-title">Шығыстар тізімі</div>
                {expenses.length === 0 ? (
                  <div className="empty">Шығыс әлі қосылмаған...</div>
                ) : (
                  expenses.map((e, i) => (
                    <div className="expense-item" key={i}>
                      <div className="exp-icon">{e.icon}</div>
                      <div>
                        <div className="exp-desc">{e.desc} <span className="paid-badge">{e.payer}</span></div>
                        <div className="exp-meta">{e.date} · {e.participants.join(', ')}</div>
                      </div>
                      <div>
                        <div className="exp-amount">{fmt(e.amount)}</div>
                        <div className="exp-share">÷{e.participants.length} = {fmt(e.amount / e.participants.length)}</div>
                      </div>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setDeleteIndex(i)} title="Жою">🗑️</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'balance' && (
          <div>
            <div className="section-title">Баланс — кім қанша алашақ / берешек</div>
            <div className="grid-3">
              {members.map(m => {
                const v = bal[m] || 0;
                const cls = v > 0.01 ? 'positive' : v < -0.01 ? 'negative' : 'zero';
                const amtCls = v > 0.01 ? 'pos' : v < -0.01 ? 'neg' : 'zero';
                const label = v > 0.01 ? '← алашақ' : v < -0.01 ? '→ берешек' : '= тең';
                return (
                  <div className={`balance-card ${cls}`} key={m}>
                    <div className="bal-name">{m}</div>
                    <div className={`bal-amount ${amtCls}`}>{v >= 0 ? '+' : ''}{fmt(v)}</div>
                    <div className="bal-label">{currency} {label}</div>
                  </div>
                );
              })}
            </div>

            <div className="card" style={{ marginTop: 20 }}>
              <div className="section-title">Кімнің үлесі</div>
              {members.map(m => {
                const p = paid[m] || 0;
                const pct = total ? (p / total * 100) : 0;
                return (
                  <div key={m} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 500 }}>{m}</span>
                      <span style={{ fontWeight: 600 }}>{fmt(p)} <span style={{ fontSize: '.75rem', color: 'var(--muted)' }}>{currency}</span></span>
                    </div>
                    <div className="progress-wrap"><div className="progress-bar" style={{ width: `${pct}%` }}></div></div>
                    <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: 2 }}>{pct.toFixed(1)}% жалпы шығыстан</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'settle' && (
          <div>
            <div className="section-title">Есеп айырысу жоспары</div>
            {settlements.length === 0 ? (
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎉</div>
                <div style={{ fontWeight: 600 }}>Барлығының есебі тең!</div>
                <div style={{ color: 'var(--muted)', marginTop: 6 }}>Ешкімге ештеңе берудің қажеті жоқ</div>
              </div>
            ) : (
              settlements.map((s, i) => (
                <div className="settlement-row" key={i}>
                  <span style={{ color: 'var(--muted)', fontSize: '.85rem', minWidth: 20 }}>{i + 1}</span>
                  <span className="s-from">{s.from}</span>
                  <span className="s-arrow">→</span>
                  <span className="s-to">{s.to}</span>
                  <span className="s-amount">{fmt(s.amount)} {currency}</span>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {deleteIndex !== null && (
        <div className="modal-bg open" onClick={e => e.target === e.currentTarget && setDeleteIndex(null)}>
          <div className="modal">
            <div className="modal-title">🗑️ Шығысты жою</div>
            <p style={{ color: 'var(--muted)' }}>Бұл шығысты жойғыңыз келе ме? Бұл әрекетті болдырмау мүмкін емес.</p>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDeleteIndex(null)}>Болдырмау</button>
              <button className="btn btn-danger" onClick={confirmDelete}>Жою</button>
            </div>
          </div>
        </div>
      )}

      {toastMsg && <div id="toast" className="show">{toastMsg}</div>}
    </div>
  );
}
