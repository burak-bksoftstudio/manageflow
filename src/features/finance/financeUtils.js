export const FINANCE_PASSWORD = '1234';

export const departmentConfig = {
  'sosyal-medya': {
    title: 'Sosyal Medya',
    partner: 'Sosyal Medya Ortağı',
    color: '#e45c88',
  },
  yazilim: {
    title: 'Yazılım',
    partner: 'Yazılım Ortağı',
    color: '#5b5ce2',
  },
};

const socialSeed = {
  incomes: [
    { id: 'si1', title: 'Luna Coffee', amount: 42000, vat: 'included', dueDay: 5, recurring: true, status: 'paid', paidAt: '2026-07-05', invoice: true, partnerShare: 0 },
    { id: 'si2', title: 'Nova Clinic', amount: 30000, vat: 'excluded', dueDay: 10, recurring: true, status: 'waiting', paidAt: '', invoice: false, partnerShare: 0 },
    { id: 'si3', title: 'Mira Hotels', amount: 54000, vat: 'included', dueDay: 15, recurring: true, status: 'overdue', paidAt: '', invoice: true, partnerShare: 50 },
    { id: 'si4', title: 'Temmuz prodüksiyon çekimi', amount: 18000, vat: 'none', dueDay: 22, recurring: false, status: 'paid', paidAt: '2026-07-21', invoice: false, partnerShare: 50 },
  ],
  expenses: [
    { id: 'se1', title: 'Ofis kirası', category: 'Sabit gider', amount: 18500, dueDay: 1, recurring: true, status: 'paid' },
    { id: 'se2', title: 'Meta reklam bütçesi', category: 'Reklam', amount: 12500, dueDay: 12, recurring: false, status: 'paid' },
    { id: 'se3', title: 'Çekim modeli', category: 'Model / Prodüksiyon', amount: 7500, dueDay: 19, recurring: false, status: 'waiting' },
    { id: 'se4', title: 'Muhasebe', category: 'Sabit gider', amount: 4200, dueDay: 25, recurring: true, status: 'waiting' },
  ],
};

const softwareSeed = {
  incomes: [
    { id: 'yi1', title: 'Atlas CRM bakım', amount: 68000, vat: 'included', dueDay: 3, recurring: true, status: 'paid', paidAt: '2026-07-03', invoice: true, partnerShare: 0 },
    { id: 'yi2', title: 'Orion e-ticaret geliştirme', amount: 96000, vat: 'excluded', dueDay: 12, recurring: true, status: 'waiting', paidAt: '', invoice: true, partnerShare: 50 },
    { id: 'yi3', title: 'Mobil uygulama ek işi', amount: 35000, vat: 'none', dueDay: 20, recurring: false, status: 'waiting', paidAt: '', invoice: false, partnerShare: 50 },
  ],
  expenses: [
    { id: 'ye1', title: 'Geliştirici maaşı — Can', category: 'Maaş', amount: 42000, dueDay: 5, recurring: true, status: 'paid', payee: 'Can Yılmaz' },
    { id: 'ye2', title: 'Sunucu ve servisler', category: 'Yazılım / Servis', amount: 8600, dueDay: 8, recurring: true, status: 'paid' },
    { id: 'ye3', title: 'Bağ-Kur', category: 'Vergi / Resmî', amount: 7950, dueDay: 28, recurring: true, status: 'waiting' },
    { id: 'ye4', title: 'KDV ödemesi', category: 'Vergi / Resmî', amount: 16800, dueDay: 26, recurring: false, status: 'waiting' },
  ],
};

export function getInitialFinanceData(department) {
  return structuredClone(department === 'yazilim' ? softwareSeed : socialSeed);
}

export function formatMoney(value) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency', currency: 'TRY', maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export function getFinanceSummary(data) {
  const collected = data.incomes.filter(item => item.status === 'paid').reduce((sum, item) => sum + item.amount, 0);
  const receivable = data.incomes.filter(item => item.status !== 'paid').reduce((sum, item) => sum + item.amount, 0);
  const spent = data.expenses.filter(item => item.status === 'paid').reduce((sum, item) => sum + item.amount, 0);
  const plannedExpense = data.expenses.filter(item => item.status !== 'paid').reduce((sum, item) => sum + item.amount, 0);
  const partnerPayable = data.incomes
    .filter(item => item.status === 'paid')
    .reduce((sum, item) => sum + (
      item.partners?.reduce((total, partner) => total + partner.amount, 0)
      || (item.amount * (item.partnerShare || 0) / 100)
    ), 0);
  return {
    collected, receivable, spent, plannedExpense, partnerPayable,
    net: collected - spent - partnerPayable,
  };
}

export function getPartnerBalances(data) {
  const balances = new Map();
  const ensure = partner => {
    if (!balances.has(partner.memberId)) balances.set(partner.memberId, {
      memberId: partner.memberId, name: partner.name, earned: 0, expenseShare: 0,
      paidToPartner: 0, receivedFromPartner: 0,
    });
    return balances.get(partner.memberId);
  };
  data.incomes.forEach(item => {
    if (item.status !== 'paid') return;
    (item.partners || []).forEach(partner => { ensure(partner).earned += Number(partner.amount) || 0; });
  });
  data.expenses.forEach(item => {
    if (item.status !== 'paid') return;
    (item.partners || []).forEach(partner => { ensure(partner).expenseShare += Number(partner.amount) || 0; });
  });
  (data.settlements || []).forEach(item => {
    const partner = ensure(item);
    if (item.direction === 'paid') partner.paidToPartner += Number(item.amount) || 0;
    else partner.receivedFromPartner += Number(item.amount) || 0;
  });
  return [...balances.values()].map(partner => ({
    ...partner,
    payable: Math.max(0, partner.earned - partner.paidToPartner),
    receivable: Math.max(0, partner.expenseShare - partner.receivedFromPartner),
    net: partner.expenseShare - partner.receivedFromPartner - partner.earned + partner.paidToPartner,
  }));
}

export function getDaysInMonth(monthValue) {
  const [year, month] = monthValue.split('-').map(Number);
  return new Date(year, month, 0).getDate();
}

export function getAgencyFinanceReport(data) {
  const incomes = data.incomes || [];
  const expenses = data.expenses || [];
  const grossIncome = incomes.reduce((sum, item) => sum + Number(item.amount || item.grossAmount || 0), 0);
  const collected = incomes.filter(item => item.status === 'paid').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const paidExpenses = expenses.filter(item => item.status === 'paid').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const outputVat = incomes.reduce((sum, item) => {
    if (item.vat === 'none') return sum;
    const rate = Number(item.vatRate ?? 20) / 100;
    return sum + (item.vat === 'included' ? Number(item.amount || 0) * rate / (1 + rate) : Number(item.amount || 0) * rate);
  }, 0);
  const inputVat = expenses.reduce((sum, item) => sum + Number(item.vatAmount || 0), 0);
  const overdue = incomes.filter(item => item.status === 'overdue');
  const partnerTotal = incomes.reduce((sum, item) => sum + (item.partners || []).reduce((total, partner) => total + Number(partner.amount || 0), 0), 0);
  return {
    grossIncome, collected, totalExpenses, paidExpenses, outputVat, inputVat,
    vatPayable: Math.max(0, outputVat - inputVat),
    accruedProfit: grossIncome - totalExpenses - partnerTotal,
    cashProfit: collected - paidExpenses - partnerTotal,
    overdueAmount: overdue.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    overdueCount: overdue.length,
    collectionRate: grossIncome ? Math.round(collected / grossIncome * 100) : 0,
  };
}
