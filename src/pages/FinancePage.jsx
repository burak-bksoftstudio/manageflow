import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  ArrowDownRight, ArrowUpRight, CalendarDays, Check, ChevronLeft, ChevronRight,
  Banknote, Building2, CircleAlert, Clock3, CreditCard, Eye, EyeOff, FileCheck2, Landmark,
  LockKeyhole, Plus, ReceiptText, RotateCcw, Trash2, UserPlus, Users, WalletCards, X,
} from 'lucide-react';
import {
  departmentConfig, FINANCE_PASSWORD, formatMoney, getAgencyFinanceReport, getDaysInMonth,
  getFinanceSummary, getInitialFinanceData, getPartnerBalances, getProfitShareReport,
} from '../features/finance/financeUtils';
import { useTeamMembers } from '../features/team/useTeamMembers';
import { useClients } from '../features/clients/useClients';
import { useProjects } from '../features/projects/useProjects';
import { useFinanceData } from '../features/finance/useFinanceData';

const statusLabels = { paid: 'Ödendi', waiting: 'Bekleniyor', overdue: 'Gecikti' };
const vatLabels = { included: 'KDV dahil', excluded: 'KDV hariç', none: 'Faturasız' };
const entriesForPeriod = (entries, period) => entries
  .filter(item => item.recurring ? (item.period || '2026-07') <= period : (item.period || '2026-07') === period)
  .map(item => {
    if (!item.recurring || (item.period || '2026-07') === period) {
      const status = item.status === 'waiting' && item.dueDate && item.dueDate < new Date().toISOString().slice(0, 10) ? 'overdue' : item.status;
      return { ...item, status };
    }
    const day = String(item.dueDay || item.dueDate?.slice(-2) || 1).padStart(2, '0');
    const dueDate = `${period}-${day}`;
    const savedStatus = item.monthlyStatus?.[period] || 'waiting';
    return {
      ...item,
      dueDate,
      status: savedStatus === 'waiting' && dueDate < new Date().toISOString().slice(0, 10) ? 'overdue' : savedStatus,
      paidAt: item.monthlyPaidAt?.[period] || '',
      isGeneratedPeriod: true,
    };
  });

function PasswordGate({ department, onUnlock }) {
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const config = departmentConfig[department];
  const submit = event => {
    event.preventDefault();
    if (password !== FINANCE_PASSWORD) {
      setError('Şifre hatalı. Lütfen tekrar deneyin.');
      return;
    }
    window.sessionStorage.setItem(`manageflow-finance-unlocked-${department}`, 'true');
    onUnlock();
  };
  return (
    <section className="finance-lock">
      <div className="finance-lock-icon" style={{ '--finance-color': config.color }}><LockKeyhole /></div>
      <div className="eyebrow"><i style={{ background: config.color }} /> KORUMALI ALAN</div>
      <h1>{config.title} finansı</h1>
      <p>Gelir, gider, ortak payı ve tahsilat bilgileri şifre ile korunuyor.</p>
      <form onSubmit={submit}>
        <label>Bölüm şifresi</label>
        <div className={error ? 'finance-password error' : 'finance-password'}>
          <LockKeyhole />
          <input autoFocus type={visible ? 'text' : 'password'} value={password} onChange={event => { setPassword(event.target.value); setError(''); }} placeholder="••••" inputMode="numeric" />
          <button type="button" onClick={() => setVisible(value => !value)} aria-label="Şifreyi göster">{visible ? <EyeOff /> : <Eye />}</button>
        </div>
        {error && <span className="finance-form-error"><CircleAlert /> {error}</span>}
        <button className="agenda-button" type="submit">Finans alanını aç <ChevronRight /></button>
      </form>
      <small>Bu alan yalnızca mevcut tarayıcı oturumu boyunca açık kalır.</small>
    </section>
  );
}

function SummaryCard({ label, value, helper, icon: Icon, tone }) {
  return (
    <article className={`finance-summary-card ${tone}`}>
      <span><small>{label}</small><i><Icon /></i></span>
      <strong>{formatMoney(value)}</strong>
      <p>{helper}</p>
    </article>
  );
}

function EntryModal({
  type, close, save, members, clients, projects, period,
}) {
  const defaultDate = `${period}-10`;
  const [form, setForm] = useState({
    title: '', amount: '', dueDay: 10, dueDate: defaultDate, period, invoiceDate: '', paidAt: '',
    recurring: true, status: 'waiting', clientId: '', projectId: '',
    vat: 'included', invoice: true, partnerShare: 0, category: type === 'income' ? '' : 'Değişken gider',
    payee: '', partnerIds: [],
  });
  const set = (field, value) => setForm(current => ({ ...current, [field]: value }));
  const togglePartner = memberId => set('partnerIds', form.partnerIds.includes(memberId)
    ? form.partnerIds.filter(id => id !== memberId) : [...form.partnerIds, memberId]);
  const submit = event => {
    event.preventDefault();
    if (!form.title.trim() || Number(form.amount) <= 0) return;
    const amount = Number(form.amount);
    const shareAmount = amount / (form.partnerIds.length + 1);
    const partners = form.partnerIds.map(memberId => {
      const member = members.find(item => item.id === memberId);
      return { memberId, name: member?.name || 'Ekip üyesi', amount: shareAmount };
    });
    const client = clients.find(item => item.id === form.clientId);
    const project = projects.find(item => item.id === form.projectId);
    save({
      ...form, partners, id: `${type}-${Date.now()}`, amount,
      dueDay: Number(form.dueDate?.slice(-2)) || 1,
      clientName: client?.name || '', projectName: project?.name || '',
      paidAt: form.status === 'paid' ? (form.paidAt || form.dueDate) : '',
    });
  };
  return (
    <div className="modal-layer" onMouseDown={event => event.target === event.currentTarget && close()}>
      <form className="modal finance-modal" onSubmit={submit}>
        <div className="modal-head"><div><span>YENİ KAYIT</span><h2>{type === 'income' ? 'Gelir / alacak ekle' : 'Gider / ödeme ekle'}</h2></div><button className="icon-button" type="button" onClick={close}><X /></button></div>
        <div className="finance-form-grid">
          <label className="full">Açıklama<input required value={form.title} onChange={event => set('title', event.target.value)} placeholder={type === 'income' ? 'Müşteri veya iş adı' : 'Gider adı'} /></label>
          <label>Dönem<input required type="month" value={form.period} onChange={event => { set('period', event.target.value); if (form.dueDate) set('dueDate', `${event.target.value}-${form.dueDate.slice(-2)}`); }} /></label>
          <label>Vade tarihi<input required type="date" value={form.dueDate} onChange={event => set('dueDate', event.target.value)} /></label>
          <label>Tutar (₺)<input required min="1" type="number" value={form.amount} onChange={event => set('amount', event.target.value)} placeholder="0" /></label>
          <label>Durum<select value={form.status} onChange={event => set('status', event.target.value)}><option value="waiting">Bekleniyor</option><option value="paid">Ödendi</option><option value="overdue">Gecikti</option></select></label>
          <label>Tekrar<select value={String(form.recurring)} onChange={event => set('recurring', event.target.value === 'true')}><option value="true">Her ay tekrarla</option><option value="false">Sadece bu ay</option></select></label>
          {form.status === 'paid' && <label>Gerçek ödeme tarihi<input type="date" value={form.paidAt} onChange={event => set('paidAt', event.target.value)} /></label>}
          {type === 'income' ? (
            <>
              <label>Firma<select value={form.clientId} onChange={event => { set('clientId', event.target.value); set('projectId', ''); }}><option value="">Firma seçilmedi</option>{clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
              <label>Proje<select value={form.projectId} onChange={event => set('projectId', event.target.value)}><option value="">Proje seçilmedi</option>{projects.filter(project => !form.clientId || project.clientId === form.clientId).map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
              <label>Fatura / KDV<select value={form.vat} onChange={event => set('vat', event.target.value)}><option value="included">KDV dahil</option><option value="excluded">KDV hariç</option><option value="none">Faturasız</option></select></label>
              {form.vat !== 'none' && <label>Fatura tarihi<input type="date" value={form.invoiceDate} onChange={event => set('invoiceDate', event.target.value)} /></label>}
              <label>Paylaşım<select disabled><option>{form.partnerIds.length ? `${form.partnerIds.length + 1} kişi eşit paylaşım` : 'Tamamı bana ait'}</option></select></label>
            </>
          ) : (
            <>
              <label>Kategori<select value={form.category} onChange={event => set('category', event.target.value)}><option>Sabit gider</option><option>Değişken gider</option><option>Maaş</option><option>Vergi / Resmî</option><option>Model / Prodüksiyon</option><option>Reklam</option><option>Yazılım / Servis</option></select></label>
              <label>Ödenecek kişi<input value={form.payee} onChange={event => set('payee', event.target.value)} placeholder="Opsiyonel" /></label>
            </>
          )}
          <fieldset className="finance-partner-picker">
            <legend>Bu kayda ortak olan ekip üyeleri</legend>
            <p>Seçilen kişiler ve siz tutarı eşit paylaşırsınız. Örneğin iki ortak seçilirse kişi başı üçte bir hesaplanır.</p>
            <div>{members.length ? members.map(member => (
              <label key={member.id} className={form.partnerIds.includes(member.id) ? 'selected' : ''}>
                <input type="checkbox" checked={form.partnerIds.includes(member.id)} onChange={() => togglePartner(member.id)} />
                <i style={{ '--member-color': member.color }}>{member.initials}</i><span><b>{member.name}</b><small>{member.department}</small></span><Check />
              </label>
            )) : <small>Seçilebilecek ekip üyesi bulunamadı.</small>}</div>
          </fieldset>
        </div>
        <div className="modal-actions"><button className="soft-button" type="button" onClick={close}>Vazgeç</button><button className="agenda-button" type="submit">Kaydı ekle</button></div>
      </form>
    </div>
  );
}

function FinanceTable({
  type, rows, update, remove, monthLabel, openPayment,
}) {
  const isIncome = type === 'income';
  return (
    <section className="finance-table-card">
      <header><div><h2>{isIncome ? 'Gelirler & alacaklar' : 'Giderler & ödemeler'}</h2><p>{isIncome ? 'Müşteri tahsilatları, fatura ve ortak payı' : 'Sabit, değişken, maaş ve resmî ödemeler'}</p></div><span>{rows.length} kayıt</span></header>
      <div className="finance-table-head"><span>KAYIT</span><span>TÜR</span><span>VADE</span><span>DURUM</span><span>TUTAR</span><span /></div>
      <div className="finance-table-body">
        {rows.map(item => (
          <article key={item.id}>
            <span className="finance-entry-name"><i className={isIncome ? 'income' : 'expense'}>{isIncome ? <ArrowDownRight /> : <ArrowUpRight />}</i><span><b>{item.title}</b><small>{isIncome ? `${item.clientName || vatLabels[item.vat]}${item.projectName ? ` · ${item.projectName}` : ''}${item.partners?.length ? ` · ${item.partners.map(partner => partner.name).join(', ')}` : item.partnerShare ? ` · %${item.partnerShare} ortak` : ''}` : `${item.category}${item.partners?.length ? ` · ${item.partners.map(partner => partner.name).join(', ')}` : item.payee ? ` · ${item.payee}` : ''}`}</small></span></span>
            <span className="finance-type-pill">{item.recurring ? <><RotateCcw /> Her ay</> : 'Bu aya özel'}</span>
            <span className="finance-due">{item.dueDate ? new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: '2-digit' }).format(new Date(`${item.dueDate}T12:00:00`)) : `${item.dueDay} ${monthLabel}`}</span>
            <select className={`finance-status ${item.status}`} value={item.status} onChange={event => update(item.id, 'status', event.target.value)}>
              <option value="paid">Ödendi</option><option value="waiting">Bekleniyor</option><option value="overdue">Gecikti</option>
            </select>
            <strong title={item.paidAmount ? `${formatMoney(item.paidAmount)} ödendi · ${formatMoney(item.remainingAmount)} kaldı` : ''}>{formatMoney(item.amount)}{item.paidAmount > 0 && item.remainingAmount > 0 ? <small className="finance-remaining">{formatMoney(item.remainingAmount)} kaldı</small> : null}</strong>
            <span className="finance-row-actions"><button className="icon-button" onClick={() => openPayment(item, type)} title={isIncome ? 'Tahsilat ekle' : 'Ödeme ekle'}><Banknote /></button><button className="icon-button finance-delete" onClick={() => remove(item)} title="Kaydı iptal et"><Trash2 /></button></span>
          </article>
        ))}
      </div>
    </section>
  );
}

function AccountModal({ close, save }) {
  const [form, setForm] = useState({ name: '', type: 'bank', openingBalance: '', bankName: '', iban: '' });
  const submit = event => { event.preventDefault(); if (form.name.trim()) save(form); };
  return <div className="modal-layer" onMouseDown={event => event.target === event.currentTarget && close()}><form className="modal finance-modal" onSubmit={submit}>
    <div className="modal-head"><div><span>PARA HESABI</span><h2>Hesap ekle</h2></div><button className="icon-button" type="button" onClick={close}><X /></button></div>
    <div className="finance-form-grid"><label>Hesap adı<input required value={form.name} onChange={event => setForm(value => ({ ...value, name: event.target.value }))} placeholder="Örn. İş Bankası TL" /></label><label>Hesap türü<select value={form.type} onChange={event => setForm(value => ({ ...value, type: event.target.value }))}><option value="bank">Banka</option><option value="cash">Nakit kasa</option><option value="credit_card">Kredi kartı</option><option value="pos">POS</option></select></label><label>Açılış bakiyesi<input type="number" value={form.openingBalance} onChange={event => setForm(value => ({ ...value, openingBalance: event.target.value }))} /></label><label>Banka<input value={form.bankName} onChange={event => setForm(value => ({ ...value, bankName: event.target.value }))} /></label><label className="full">IBAN<input value={form.iban} onChange={event => setForm(value => ({ ...value, iban: event.target.value }))} /></label></div>
    <div className="modal-actions"><button className="soft-button" type="button" onClick={close}>Vazgeç</button><button className="agenda-button" type="submit">Hesabı ekle</button></div>
  </form></div>;
}

function PaymentModal({
  entry, type, accounts, close, save,
}) {
  const [form, setForm] = useState({ accountId: accounts[0]?.id || '', amount: entry.remainingAmount || entry.amount, paidOn: new Date().toISOString().slice(0, 10), reference: '', notes: '' });
  const submit = event => { event.preventDefault(); if (form.accountId && Number(form.amount) > 0) save({ ...form, entryId: entry.id, direction: type === 'income' ? 'in' : 'out' }); };
  return <div className="modal-layer" onMouseDown={event => event.target === event.currentTarget && close()}><form className="modal finance-modal" onSubmit={submit}>
    <div className="modal-head"><div><span>{type === 'income' ? 'TAHSİLAT' : 'ÖDEME'}</span><h2>{entry.title}</h2></div><button className="icon-button" type="button" onClick={close}><X /></button></div>
    <p className="quick-create-copy">Toplam {formatMoney(entry.amount)} · Daha önce {formatMoney(entry.paidAmount || 0)} · Kalan {formatMoney(entry.remainingAmount ?? entry.amount)}</p>
    {!accounts.length ? <div className="finance-payment-warning"><CircleAlert /> Önce Kasa & Banka sekmesinden bir para hesabı eklemelisiniz.</div> : <div className="finance-form-grid"><label>Hesap<select value={form.accountId} onChange={event => setForm(value => ({ ...value, accountId: event.target.value }))}>{accounts.map(account => <option key={account.id} value={account.id}>{account.name} · {formatMoney(account.balance)}</option>)}</select></label><label>Tutar<input required min="0.01" max={entry.remainingAmount || entry.amount} step="0.01" type="number" value={form.amount} onChange={event => setForm(value => ({ ...value, amount: event.target.value }))} /></label><label>Tarih<input required type="date" value={form.paidOn} onChange={event => setForm(value => ({ ...value, paidOn: event.target.value }))} /></label><label>Referans<input value={form.reference} onChange={event => setForm(value => ({ ...value, reference: event.target.value }))} placeholder="Dekont / işlem no" /></label><label className="full">Not<input value={form.notes} onChange={event => setForm(value => ({ ...value, notes: event.target.value }))} /></label></div>}
    <div className="modal-actions"><button className="soft-button" type="button" onClick={close}>Vazgeç</button><button className="agenda-button" disabled={!accounts.length} type="submit">Kaydet</button></div>
  </form></div>;
}

function CashAccounts({ accounts, payments, openAccount }) {
  const typeLabels = { bank: 'Banka', cash: 'Nakit kasa', credit_card: 'Kredi kartı', pos: 'POS' };
  const total = accounts.reduce((sum, account) => sum + account.balance, 0);
  return <section className="cash-accounts"><header><div><h2>Kasa & banka</h2><p>Paranın hangi hesapta olduğunu ve gerçek nakit hareketlerini takip edin.</p></div><button className="agenda-button" onClick={openAccount}><Plus /> Hesap ekle</button></header><div className="cash-total"><span><small>TOPLAM LİKİT BAKİYE</small><strong>{formatMoney(total)}</strong></span><p>Kredi kartı dahil tüm aktif hesapların güncel sistem bakiyesi.</p></div>{accounts.length ? <div className="cash-account-grid">{accounts.map(account => <article key={account.id}><i>{account.type === 'credit_card' ? <CreditCard /> : <Landmark />}</i><span><small>{typeLabels[account.type]}</small><b>{account.name}</b><em>{account.bank_name || account.iban || 'TRY hesabı'}</em></span><strong>{formatMoney(account.balance)}</strong></article>)}</div> : <div className="partner-account-empty"><Landmark /><h3>Henüz para hesabı yok</h3><p>Tahsilat ve ödeme girebilmek için banka veya nakit kasa ekleyin.</p></div>}{!!payments.length && <div className="cash-movements"><h3>Son hareketler</h3>{payments.slice(0, 12).map(payment => <div key={payment.id}><i className={payment.direction}>{payment.direction === 'in' ? <ArrowDownRight /> : <ArrowUpRight />}</i><span><b>{payment.notes || payment.reference || 'Finans hareketi'}</b><small>{payment.paid_on}</small></span><em>{payment.direction === 'in' ? 'Giriş' : 'Çıkış'}</em><strong>{formatMoney(payment.amount)}</strong></div>)}</div>}</section>;
}

function FinanceReports({ data, period }) {
  const report = getAgencyFinanceReport(data);
  const categories = [...data.expenses.reduce((map, item) => map.set(item.category || 'Diğer', (map.get(item.category || 'Diğer') || 0) + item.amount), new Map())]
    .sort((a, b) => b[1] - a[1]);
  const exportCsv = () => {
    const rows = [['Tür', 'Başlık', 'Dönem', 'Vade', 'Durum', 'Tutar'],
      ...data.incomes.map(item => ['Gelir', item.title, item.period || period, item.dueDate || '', statusLabels[item.status], item.amount]),
      ...data.expenses.map(item => ['Gider', item.title, item.period || period, item.dueDate || '', statusLabels[item.status], item.amount])];
    const csv = rows.map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(';')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    link.download = `manageflow-finans-${period}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };
  return <section className="finance-reports"><header><div><h2>Finans raporu</h2><p>Tahakkuk, nakit, vergi rezervi ve tahsilat performansı.</p></div><button className="soft-button" onClick={exportCsv}>CSV dışa aktar</button></header><div className="finance-report-grid"><article><small>TAHAKKUK KÂRI</small><strong>{formatMoney(report.accruedProfit)}</strong><p>Kesilen/beklenen gelir − tüm giderler − ortak payı</p></article><article><small>NAKİT KÂRI</small><strong>{formatMoney(report.cashProfit)}</strong><p>Gerçekleşen tahsilat ve ödemelere göre</p></article><article><small>KDV REZERVİ</small><strong>{formatMoney(report.vatPayable)}</strong><p>Hesaplanan KDV − girilmiş indirilecek KDV</p></article><article><small>TAHSİLAT ORANI</small><strong>%{report.collectionRate}</strong><p>{report.overdueCount} geciken kayıt · {formatMoney(report.overdueAmount)}</p></article></div><div className="finance-report-bottom"><article><h3>Gider dağılımı</h3>{categories.length ? categories.map(([category, amount]) => <div key={category}><span>{category}</span><i><em style={{ width: `${report.totalExpenses ? amount / report.totalExpenses * 100 : 0}%` }} /></i><b>{formatMoney(amount)}</b></div>) : <p>Bu dönemde gider yok.</p>}</article><article><h3>Geciken alacaklar</h3>{data.incomes.filter(item => item.status === 'overdue').length ? data.incomes.filter(item => item.status === 'overdue').map(item => <div className="report-overdue" key={item.id}><span><b>{item.title}</b><small>{item.clientName || 'Firma seçilmedi'} · {item.dueDate}</small></span><strong>{formatMoney(item.remainingAmount || item.amount)}</strong></div>) : <p>Geciken alacak bulunmuyor.</p>}</article></div></section>;
}

function ProfitShareReport({ data, periodLabel }) {
  const people = getProfitShareReport(data, 'Benim payım');
  const maxProfit = Math.max(1, ...people.map(person => Math.max(0, person.netProfit)));
  const departmentLabels = { social_media: 'Sosyal Medya', software: 'Yazılım', shared: 'Ajans Genel' };
  return <section className="profit-share-report"><header><div><h2>Kazanç paylaşımı</h2><p>{periodLabel} döneminde gelir ve giderlerden sonra kime net ne kaldı?</p></div><span>Gelir payı − gider payı = net kazanç</span></header><div className="profit-share-explainer"><Users /><span><b>Hesaplama çok basit</b><small>Her işte seçtiğiniz ortak payları o kişiye yazılır. Seçilmeyen kalan pay size aittir. Giderler de aynı yöntemle düşülür.</small></span></div>{people.length ? <div className="profit-person-grid">{people.map((person, index) => <article className={person.isOwner ? 'owner' : ''} key={person.id}><div className="profit-person-head"><i>{person.isOwner ? 'BK' : person.name.split(/\s+/).map(word => word[0]).slice(0, 2).join('')}</i><span><small>{person.isOwner ? 'AJANS SAHİBİ' : 'ORTAK'}</small><b>{person.name}</b></span><strong className={person.netProfit >= 0 ? 'positive' : 'negative'}>{formatMoney(person.netProfit)}</strong></div><div className="profit-formula"><span><small>GELİR PAYI</small><b>{formatMoney(person.incomeShare)}</b></span><em>−</em><span><small>GİDER PAYI</small><b>{formatMoney(person.expenseShare)}</b></span><em>=</em><span className="result"><small>NET KALAN</small><b>{formatMoney(person.netProfit)}</b></span></div><div className="profit-bar"><i style={{ width: `${Math.max(0, person.netProfit) / maxProfit * 100}%` }} /></div><div className="profit-cash-row"><span><small>Gerçek tahsilata göre</small><b>{formatMoney(person.cashNet)}</b></span>{!person.isOwner && <span><small>{person.settlementBalance > 0 ? 'Kendisine ödenecek' : person.settlementBalance < 0 ? 'Kendisinden alınacak' : 'Cari bakiye'}</small><b className={person.settlementBalance > 0 ? 'due' : ''}>{formatMoney(Math.abs(person.settlementBalance))}</b></span>}</div>{Object.keys(person.departments).length > 0 && <div className="profit-departments">{Object.entries(person.departments).map(([department, totals]) => <span key={department}><small>{departmentLabels[department] || 'Diğer'}</small><b>{formatMoney(totals.income - totals.expense)}</b></span>)}</div>}{index === 0 && <div className="profit-owner-note">Size kalan pay, ortaklara ayrılan paylar çıkarıldıktan sonra otomatik hesaplanır.</div>}</article>)}</div> : <div className="partner-account-empty"><Users /><h3>Bu ay paylaşılacak kayıt yok</h3><p>Gelir ve gider kayıtlarına ortak eklediğinizde kişi bazlı rapor burada oluşur.</p></div>}</section>;
}

function SettlementModal({
  partners, members, accounts, close, save,
}) {
  const choices = partners.length ? partners : members.map(member => ({ memberId: member.id, name: member.name }));
  const [form, setForm] = useState({ memberId: choices[0]?.memberId || '', accountId: accounts[0]?.id || '', direction: 'paid', amount: '', note: '' });
  const submit = event => {
    event.preventDefault();
    const partner = choices.find(item => item.memberId === form.memberId);
    if (!partner || !form.accountId || Number(form.amount) <= 0) return;
    save({ ...form, id: `settlement-${Date.now()}`, name: partner.name, amount: Number(form.amount), date: new Date().toISOString() });
  };
  return <div className="modal-layer" onMouseDown={event => event.target === event.currentTarget && close()}>
    <form className="modal finance-modal" onSubmit={submit}>
      <div className="modal-head"><div><span>ORTAK CARİSİ</span><h2>Para hareketi ekle</h2></div><button className="icon-button" type="button" onClick={close}><X /></button></div>
      <p className="quick-create-copy">Ortağınıza verdiğiniz veya ortağınızdan aldığınız parayı kaydedin. Cari bakiye otomatik güncellenir.</p>
      <div className="finance-form-grid">
        <label>Ortak<select required value={form.memberId} onChange={event => setForm(value => ({ ...value, memberId: event.target.value }))}>{choices.map(item => <option key={item.memberId} value={item.memberId}>{item.name}</option>)}</select></label>
        <label>Hesap<select required value={form.accountId} onChange={event => setForm(value => ({ ...value, accountId: event.target.value }))}><option value="">Hesap seçin</option>{accounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
        <label>Hareket<select value={form.direction} onChange={event => setForm(value => ({ ...value, direction: event.target.value }))}><option value="paid">Ben ortağa verdim</option><option value="received">Ortaktan aldım</option></select></label>
        <label>Tutar (₺)<input required min="1" type="number" value={form.amount} onChange={event => setForm(value => ({ ...value, amount: event.target.value }))} /></label>
        <label>Açıklama<input value={form.note} onChange={event => setForm(value => ({ ...value, note: event.target.value }))} placeholder="Örn. Temmuz kira payı" /></label>
      </div>
      <div className="modal-actions"><button className="soft-button" type="button" onClick={close}>Vazgeç</button><button className="agenda-button" type="submit">Hareketi kaydet</button></div>
    </form>
  </div>;
}

function PartnerModal({ close, save }) {
  const [form, setForm] = useState({ name: '', phone: '', role: 'Ortak', color: '#5b5ce2' });
  const submit = event => {
    event.preventDefault();
    if (form.name.trim().length < 2) return;
    save({
      ...form, name: form.name.trim(), id: `finance-partner-${Date.now()}`,
      initials: form.name.trim().split(/\s+/).map(word => word[0]).slice(0, 2).join('').toLocaleUpperCase('tr-TR'),
      department: form.role, status: 'active',
    });
  };
  return <div className="modal-layer" onMouseDown={event => event.target === event.currentTarget && close()}>
    <form className="modal finance-modal" onSubmit={submit}>
      <div className="modal-head"><div><span>YENİ ORTAK</span><h2>Finans ortağı ekle</h2></div><button className="icon-button" type="button" onClick={close}><X /></button></div>
      <p className="quick-create-copy">Bu kişi ekip üyesi olmak zorunda değildir. Yalnızca finans kayıtları ve cari hesap seçimlerinde görünür.</p>
      <div className="finance-form-grid">
        <label>Ad soyad<input required value={form.name} onChange={event => setForm(value => ({ ...value, name: event.target.value }))} placeholder="Örn. Nihal Yılmaz" /></label>
        <label>Telefon<input value={form.phone} onChange={event => setForm(value => ({ ...value, phone: event.target.value }))} placeholder="Opsiyonel" /></label>
        <label>Rol / açıklama<input value={form.role} onChange={event => setForm(value => ({ ...value, role: event.target.value }))} placeholder="Ortak" /></label>
        <label>Renk<input type="color" value={form.color} onChange={event => setForm(value => ({ ...value, color: event.target.value }))} /></label>
      </div>
      <div className="modal-actions"><button className="soft-button" type="button" onClick={close}>Vazgeç</button><button className="agenda-button" type="submit">Ortağı ekle</button></div>
    </form>
  </div>;
}

function PartnerAccounts({
  partners, settlements, openSettlement, openPartner,
}) {
  return <section className="partner-accounts">
    <header><div><h2>Ortak carileri</h2><p>Nihal, Yağız ve diğer ortaklarla kazanç, gider ve para alışverişi.</p></div><div className="partner-head-actions"><button className="soft-button" onClick={openPartner}><UserPlus /> Ortak ekle</button><button className="agenda-button" onClick={openSettlement}><Plus /> Para hareketi</button></div></header>
    {partners.length ? <div className="partner-account-grid">{partners.map(partner => (
      <article key={partner.memberId}>
        <div className="partner-account-title"><i>{partner.name.split(/\s+/).map(word => word[0]).slice(0, 2).join('')}</i><span><b>{partner.name}</b><small>{partner.net < 0 ? 'Sizin ödemeniz gereken' : partner.net > 0 ? 'Ondan almanız gereken' : 'Hesap kapalı'}</small></span><strong className={partner.net < 0 ? 'payable' : 'receivable'}>{formatMoney(Math.abs(partner.net))}</strong></div>
        <div className="partner-account-stats"><span><small>İŞLERDEN KAZANCI</small><b>{formatMoney(partner.earned)}</b></span><span><small>GİDER PAYI</small><b>{formatMoney(partner.expenseShare)}</b></span><span><small>ONA VERDİM</small><b>{formatMoney(partner.paidToPartner)}</b></span><span><small>ONDAN ALDIM</small><b>{formatMoney(partner.receivedFromPartner)}</b></span></div>
      </article>
    ))}</div> : <div className="partner-account-empty"><Users /><h3>Henüz ortak kayıt yok</h3><p>Gelir veya gider eklerken ekip üyelerini ortak seçin.</p></div>}
    {!!settlements.length && <div className="settlement-history"><h3>Son para hareketleri</h3>{settlements.slice().reverse().slice(0, 8).map(item => <div key={item.id}><i className={item.direction} >{item.direction === 'paid' ? <ArrowUpRight /> : <ArrowDownRight />}</i><span><b>{item.name}</b><small>{item.note || (item.direction === 'paid' ? 'Ortağa ödeme yapıldı' : 'Ortaktan ödeme alındı')}</small></span><em>{item.direction === 'paid' ? 'Verdim' : 'Aldım'}</em><strong>{formatMoney(item.amount)}</strong></div>)}</div>}
  </section>;
}

function ClientAccounts({ clients, projects, incomes, period }) {
  const rows = clients.map(client => {
    const entries = incomes.filter(item => item.clientId === client.id);
    const collected = entries.filter(item => item.status === 'paid').reduce((sum, item) => sum + item.amount, 0);
    const waiting = entries.filter(item => item.status !== 'paid').reduce((sum, item) => sum + item.amount, 0);
    const clientProjects = projects.filter(project => project.clientId === client.id);
    return { ...client, entries, collected, waiting, projects: clientProjects };
  }).filter(client => client.entries.length || client.projects.length);
  return <section className="client-finance">
    <header><div><h2>Firma ve proje tahsilatları</h2><p>{period} döneminde hangi firmadan ne zaman ve ne kadar ödeme alınacak.</p></div><span>{rows.length} firma</span></header>
    {rows.length ? <div className="client-finance-grid">{rows.map(client => (
      <article key={client.id}>
        <div className="client-finance-title"><i>{client.initials}</i><span><b>{client.name}</b><small>{client.projects.length} proje · {client.entries.length} finans kaydı</small></span></div>
        <div className="client-finance-totals"><span><small>TAHSİL EDİLDİ</small><b>{formatMoney(client.collected)}</b></span><span><small>BEKLENİYOR</small><b>{formatMoney(client.waiting)}</b></span></div>
        <div className="client-finance-projects">{client.projects.map(project => <span key={project.id}><b>{project.name}</b><small>{project.statusLabel}</small></span>)}</div>
        <div className="client-finance-entries">{client.entries.map(entry => <div key={entry.id}><span><b>{entry.title}</b><small>{entry.dueDate || `${entry.dueDay}. gün`} vade</small></span><em className={entry.status}>{statusLabels[entry.status]}</em><strong>{formatMoney(entry.amount)}</strong></div>)}</div>
      </article>
    ))}</div> : <div className="partner-account-empty"><Building2 /><h3>Bu dönemde bağlı firma kaydı yok</h3><p>Gelir eklerken mevcut firma ve projelerinizden birini seçin.</p></div>}
  </section>;
}

function FinanceCalendar({ data, month, setMonth }) {
  const days = getDaysInMonth(month);
  const [year, monthNumber] = month.split('-').map(Number);
  const firstDay = (new Date(year, monthNumber - 1, 1).getDay() + 6) % 7;
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: days }, (_, index) => index + 1)];
  const events = [...data.incomes.map(item => ({ ...item, kind: 'income' })), ...data.expenses.map(item => ({ ...item, kind: 'expense' }))];
  const label = new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(new Date(year, monthNumber - 1, 1));
  const shift = amount => {
    const next = new Date(year, monthNumber - 1 + amount, 1);
    setMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`);
  };
  return (
    <section className="finance-calendar">
      <header><div><h2>Finans takvimi</h2><p>Vade ve ödeme günlerini tek bakışta takip edin.</p></div><div><button className="icon-button" onClick={() => shift(-1)}><ChevronLeft /></button><b>{label}</b><button className="icon-button" onClick={() => shift(1)}><ChevronRight /></button></div></header>
      <div className="finance-weekdays">{['PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CMT', 'PAZ'].map(day => <span key={day}>{day}</span>)}</div>
      <div className="finance-calendar-grid">
        {cells.map((day, index) => {
          const dayEvents = day ? events.filter(item => Math.min(item.dueDay, days) === day) : [];
          return <div key={`${day}-${index}`} className={!day ? 'blank' : ''}>{day && <time>{day}</time>}{dayEvents.slice(0, 2).map(event => <span className={`${event.kind} ${event.status}`} key={`${event.kind}-${event.id}`} title={`${event.title} — ${formatMoney(event.amount)}`}><i />{event.title}</span>)}{dayEvents.length > 2 && <small>+{dayEvents.length - 2} kayıt</small>}</div>;
        })}
      </div>
    </section>
  );
}

export default function FinancePage() {
  const { department = 'sosyal-medya' } = useParams();
  const safeDepartment = departmentConfig[department] ? department : 'sosyal-medya';
  const config = departmentConfig[safeDepartment];
  const { members } = useTeamMembers();
  const { clients } = useClients();
  const { projects } = useProjects();
  const remoteFinance = useFinanceData(safeDepartment);
  const [unlocked, setUnlocked] = useState(() => window.sessionStorage.getItem(`manageflow-finance-unlocked-${safeDepartment}`) === 'true');
  const storageKey = `manageflow-finance-${safeDepartment}`;
  const [localData, setLocalData] = useState(() => {
    try { return JSON.parse(window.localStorage.getItem(storageKey)) || getInitialFinanceData(safeDepartment); } catch { return getInitialFinanceData(safeDepartment); }
  });
  const [view, setView] = useState('overview');
  const [modal, setModal] = useState(null);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));

  useEffect(() => {
    setUnlocked(window.sessionStorage.getItem(`manageflow-finance-unlocked-${safeDepartment}`) === 'true');
    try { setLocalData(JSON.parse(window.localStorage.getItem(`manageflow-finance-${safeDepartment}`)) || getInitialFinanceData(safeDepartment)); } catch { setLocalData(getInitialFinanceData(safeDepartment)); }
  }, [safeDepartment]);
  const data = remoteFinance.enabled ? remoteFinance.data : localData;
  const setData = updater => { if (!remoteFinance.enabled) setLocalData(updater); };
  useEffect(() => { if (!remoteFinance.enabled) window.localStorage.setItem(storageKey, JSON.stringify(localData)); }, [localData, remoteFinance.enabled, storageKey]);
  const selectableMembers = useMemo(() => [
    ...members.filter(member => !member.isCurrent && member.status !== 'inactive' && !member.isInvitation),
    ...(data.customPartners || []),
  ].filter((member, index, list) => list.findIndex(item => item.id === member.id) === index), [data.customPartners, members]);
  const monthLabel = useMemo(() => new Intl.DateTimeFormat('tr-TR', { month: 'long' }).format(new Date(`${month}-01T12:00:00`)), [month]);
  const periodData = useMemo(() => ({
    incomes: entriesForPeriod(data.incomes, month),
    expenses: entriesForPeriod(data.expenses, month),
    settlements: (data.settlements || []).filter(item => (item.period || item.date?.slice(0, 7) || '2026-07') === month),
  }), [data, month]);
  const summary = useMemo(() => getFinanceSummary(periodData), [periodData]);
  const partnerBalances = useMemo(() => getPartnerBalances(periodData), [periodData]);
  const add = async (type, entry) => {
    if (remoteFinance.enabled) {
      const result = await remoteFinance.addEntry(type, entry, selectableMembers);
      if (!result.error) setModal(null);
      return;
    }
    setData(current => ({ ...current, [type === 'income' ? 'incomes' : 'expenses']: [...current[type === 'income' ? 'incomes' : 'expenses'], entry] }));
    setModal(null);
  };
  const updatePeriodEntry = (collection, id, field, value) => {
    if (remoteFinance.enabled) {
      if (field === 'status') remoteFinance.updateStatus(id, value);
      return;
    }
    setData(current => ({
      ...current,
      [collection]: current[collection].map(item => {
        if (item.id !== id) return item;
        if (!item.recurring || (item.period || '2026-07') === month) return { ...item, [field]: value };
        if (field === 'status') return { ...item, monthlyStatus: { ...(item.monthlyStatus || {}), [month]: value } };
        return { ...item, [field]: value };
      }),
    }));
  };
  const remove = async (collection, item) => {
    if (!window.confirm(`“${item.title}” kaydı iptal edilsin mi? Finans toplamlarından çıkarılacak.`)) return;
    if (remoteFinance.enabled) {
      await remoteFinance.cancelEntry(item.id);
      return;
    }
    setData(current => ({ ...current, [collection]: current[collection].filter(record => record.id !== item.id) }));
  };
  const addSettlement = async entry => {
    if (remoteFinance.enabled) {
      const result = await remoteFinance.addPayment({
        accountId: entry.accountId,
        partnerId: entry.memberId,
        direction: entry.direction === 'paid' ? 'out' : 'in',
        amount: entry.amount,
        paidOn: entry.date.slice(0, 10),
        notes: entry.note,
      });
      if (!result.error) setModal(null);
      return;
    }
    setData(current => ({ ...current, settlements: [...(current.settlements || []), { ...entry, period: month }] })); setModal(null);
  };
  const addPartner = async partner => {
    if (remoteFinance.enabled) {
      const result = await remoteFinance.addPartner(partner);
      if (result.error) return;
    } else setData(current => ({ ...current, customPartners: [...(current.customPartners || []), partner] }));
    setModal(null); setView('partners');
  };
  const addAccount = async form => {
    const result = await remoteFinance.addAccount(form);
    if (!result.error) setModal(null);
  };
  const addPayment = async form => {
    const result = await remoteFinance.addPayment(form);
    if (!result.error) setModal(null);
  };
  const lock = () => { window.sessionStorage.removeItem(`manageflow-finance-unlocked-${safeDepartment}`); setUnlocked(false); };

  if (!unlocked) return <PasswordGate department={safeDepartment} onUnlock={() => setUnlocked(true)} />;
  return (
    <div className="finance-page" style={{ '--finance-color': config.color }}>
      <section className="finance-hero">
        <div><div className="eyebrow"><i /> {config.title.toUpperCase()} · FİNANS</div><h1>{config.consolidated ? 'Ajansın tek finans resmi.' : 'Paranın net resmi.'}</h1><p>{config.consolidated ? 'Sosyal medya, yazılım ve genel ajans hareketleri çift sayılmadan birleşir.' : 'Tahsilat, gider, ortak payı ve ödeme günleri — hepsi tek yerde.'}</p></div>
        <div className="finance-hero-actions"><button className="soft-button" onClick={lock}><LockKeyhole /> Kilitle</button>{!config.consolidated && <><button className="agenda-button" onClick={() => setModal('income')}><Plus /> Gelir ekle</button><button className="agenda-button finance-expense-button" onClick={() => setModal('expense')}><Plus /> Gider ekle</button></>}</div>
      </section>
      <div className="finance-period-bar"><button className="icon-button" onClick={() => { const date = new Date(`${month}-01T12:00:00`); date.setMonth(date.getMonth() - 1); setMonth(date.toISOString().slice(0, 7)); }}><ChevronLeft /></button><label><small>FİNANS DÖNEMİ</small><input type="month" value={month} onChange={event => setMonth(event.target.value)} /></label><button className="icon-button" onClick={() => { const date = new Date(`${month}-01T12:00:00`); date.setMonth(date.getMonth() + 1); setMonth(date.toISOString().slice(0, 7)); }}><ChevronRight /></button><span>Geçmiş veya gelecek bir ay seçerek kayıtları ve bakiyeleri ayrı ayrı inceleyebilirsiniz.</span></div>
      <nav className="finance-tabs"><button className={view === 'overview' ? 'active' : ''} onClick={() => setView('overview')}><WalletCards /> Genel bakış</button><button className={view === 'profit-share' ? 'active' : ''} onClick={() => setView('profit-share')}><Users /> Kazançlar</button><button className={view === 'cash' ? 'active' : ''} onClick={() => setView('cash')}><Landmark /> Kasa & Banka</button><button className={view === 'clients' ? 'active' : ''} onClick={() => setView('clients')}><Building2 /> Firmalar</button><button className={view === 'partners' ? 'active' : ''} onClick={() => setView('partners')}><Users /> Ortak Cari</button><button className={view === 'reports' ? 'active' : ''} onClick={() => setView('reports')}><ReceiptText /> Raporlar</button><button className={view === 'calendar' ? 'active' : ''} onClick={() => setView('calendar')}><CalendarDays /> Takvim</button></nav>
      {view === 'overview' ? <>
        <section className="finance-summary-grid">
          <SummaryCard label="TAHSİL EDİLEN" value={summary.collected} helper="Bu ay hesaba giren" icon={Check} tone="positive" />
          <SummaryCard label="BEKLEYEN ALACAK" value={summary.receivable} helper="Henüz tahsil edilmedi" icon={Clock3} tone="warning" />
          <SummaryCard label="ÖDENEN GİDER" value={summary.spent} helper={`Planlanan: ${formatMoney(summary.plannedExpense)}`} icon={ReceiptText} tone="expense" />
          <SummaryCard label="NET KALAN" value={summary.net} helper={`Ortak payı: ${formatMoney(summary.partnerPayable)}`} icon={WalletCards} tone="net" />
        </section>
        <div className="finance-insight"><FileCheck2 /><span><b>{monthLabel} özeti</b><small>Tahsilatların %{summary.collected + summary.receivable ? Math.round(summary.collected / (summary.collected + summary.receivable) * 100) : 0}’i tamamlandı. Bekleyen giderler ödendiğinde tahmini kasanız {formatMoney(summary.net - summary.plannedExpense)} olacak.</small></span></div>
        <FinanceTable type="income" monthLabel={monthLabel} rows={periodData.incomes} update={(id, field, value) => updatePeriodEntry('incomes', id, field, value)} remove={item => remove('incomes', item)} openPayment={(entry, type) => setModal({ type: 'payment', entry, entryType: type })} />
        <FinanceTable type="expense" monthLabel={monthLabel} rows={periodData.expenses} update={(id, field, value) => updatePeriodEntry('expenses', id, field, value)} remove={item => remove('expenses', item)} openPayment={(entry, type) => setModal({ type: 'payment', entry, entryType: type })} />
      </> : view === 'profit-share' ? <ProfitShareReport data={periodData} periodLabel={monthLabel} /> : view === 'cash' ? <CashAccounts accounts={data.accounts || []} payments={data.payments || []} openAccount={() => setModal('account')} /> : view === 'clients' ? <ClientAccounts clients={clients} projects={projects} incomes={periodData.incomes} period={month} /> : view === 'partners' ? <PartnerAccounts partners={partnerBalances} settlements={periodData.settlements} openSettlement={() => setModal('settlement')} openPartner={() => setModal('partner')} /> : view === 'reports' ? <FinanceReports data={periodData} period={month} /> : <FinanceCalendar data={periodData} month={month} setMonth={setMonth} />}
      {['income', 'expense'].includes(modal) && <EntryModal type={modal} period={month} members={selectableMembers} clients={clients} projects={projects} close={() => setModal(null)} save={entry => add(modal, entry)} />}
      {modal === 'settlement' && <SettlementModal partners={partnerBalances} members={selectableMembers} accounts={data.accounts || []} close={() => setModal(null)} save={addSettlement} />}
      {modal === 'partner' && <PartnerModal close={() => setModal(null)} save={addPartner} />}
      {modal === 'account' && <AccountModal close={() => setModal(null)} save={addAccount} />}
      {modal?.type === 'payment' && <PaymentModal entry={modal.entry} type={modal.entryType} accounts={data.accounts || []} close={() => setModal(null)} save={addPayment} />}
    </div>
  );
}
