import { describe, expect, it } from 'vitest';
import {
  formatMoney, getAgencyFinanceReport, getDaysInMonth, getFinanceSummary, getInitialFinanceData, getPartnerBalances,
} from './financeUtils';

describe('financeUtils', () => {
  it('summarizes collected, receivable, expenses, partner share and net cash', () => {
    const summary = getFinanceSummary({
      incomes: [
        { amount: 100000, status: 'paid', partnerShare: 50 },
        { amount: 30000, status: 'waiting', partnerShare: 0 },
      ],
      expenses: [
        { amount: 10000, status: 'paid' },
        { amount: 5000, status: 'waiting' },
      ],
    });
    expect(summary).toEqual({
      collected: 100000,
      receivable: 30000,
      spent: 10000,
      plannedExpense: 5000,
      partnerPayable: 50000,
      net: 40000,
    });
  });

  it('returns independent seeded department data', () => {
    const first = getInitialFinanceData('yazilim');
    const second = getInitialFinanceData('yazilim');
    first.incomes[0].amount = 1;
    expect(second.incomes[0].amount).toBe(68000);
  });

  it('handles Turkish money and month lengths', () => {
    expect(formatMoney(12500)).toContain('12.500');
    expect(getDaysInMonth('2028-02')).toBe(29);
  });

  it('calculates each partner current account after payments', () => {
    const [partner] = getPartnerBalances({
      incomes: [{ status: 'paid', partners: [{ memberId: 'n', name: 'Nihal', amount: 20000 }] }],
      expenses: [{ status: 'paid', partners: [{ memberId: 'n', name: 'Nihal', amount: 6000 }] }],
      settlements: [
        { memberId: 'n', name: 'Nihal', direction: 'paid', amount: 5000 },
        { memberId: 'n', name: 'Nihal', direction: 'received', amount: 2000 },
      ],
    });
    expect(partner).toMatchObject({ earned: 20000, expenseShare: 6000, payable: 15000, receivable: 4000, net: -11000 });
  });

  it('separates accrued profit, cash profit and VAT reserve', () => {
    const report = getAgencyFinanceReport({
      incomes: [
        { amount: 12000, status: 'paid', vat: 'included', vatRate: 20, partners: [] },
        { amount: 6000, status: 'overdue', vat: 'none', partners: [] },
      ],
      expenses: [{ amount: 3000, status: 'paid', vatAmount: 500 }],
    });
    expect(report).toMatchObject({
      grossIncome: 18000, collected: 12000, totalExpenses: 3000,
      accruedProfit: 15000, cashProfit: 9000, overdueAmount: 6000,
      vatPayable: 1500, collectionRate: 67,
    });
  });
});
