import { describe, expect, it } from 'vitest';
import {
  canManageClients, filterClients, getClientErrorMessage, getClientInitials, getClientStats, mapDatabaseClient,
  normalizeClientForm, validateClient,
} from './clientUtils';

const clients = [
  { id: '1', name: 'Atlas Labs', contactName: 'Ayşe Kaya', email: 'ayse@atlas.co', industry: 'Yazılım', status: 'active' },
  { id: '2', name: 'Mono Coffee', contactName: 'Can Demir', email: 'can@mono.co', industry: 'Yiyecek & İçecek', status: 'lead' },
];

describe('client utilities', () => {
  it('validates the minimum client fields', () => {
    expect(validateClient({ name: 'A', email: '', status: 'lead' })).toBe('Müşteri veya firma adı en az 2 karakter olmalıdır.');
    expect(validateClient({ name: 'Atlas Labs', email: 'wrong', status: 'active' })).toBe('Geçerli bir e-posta adresi girin.');
    expect(validateClient({ name: 'Atlas Labs', email: 'hello@atlas.co', status: 'active' })).toBe('');
  });

  it('applies organization role management rules', () => {
    expect(canManageClients('owner')).toBe(true);
    expect(canManageClients('admin')).toBe(true);
    expect(canManageClients('project_manager')).toBe(true);
    expect(canManageClients('member')).toBe(false);
  });

  it('maps database rows into the client view model', () => {
    expect(mapDatabaseClient({
      id: '1', name: 'Atlas Labs', contact_name: null, email: null, phone: null,
      industry: null, status: 'lead', notes: null, created_at: '2026-07-19T01:00:00.000Z',
    })).toMatchObject({
      name: 'Atlas Labs', contactName: '', email: '', industry: '', status: 'lead',
    });
  });

  it('creates a compact client monogram', () => {
    expect(getClientInitials('Atlas Creative Labs')).toBe('AC');
    expect(getClientInitials('')).toBe('MF');
  });

  it('filters by Turkish search text and status', () => {
    expect(filterClients(clients, { query: 'Ayşe', status: 'active' }).map(client => client.name)).toEqual(['Atlas Labs']);
    expect(filterClients(clients, { query: '', status: 'lead' }).map(client => client.name)).toEqual(['Mono Coffee']);
  });

  it('calculates client summary metrics', () => {
    expect(getClientStats(clients)).toEqual({ total: 2, active: 1, leads: 1, industries: 2 });
  });

  it('translates database constraint errors', () => {
    expect(getClientErrorMessage({ code: '23505' })).toContain('zaten bulunuyor');
    expect(getClientErrorMessage({ code: '42501' })).toContain('yetkiniz yok');
  });

  it('normalizes client form values before persistence', () => {
    expect(normalizeClientForm({
      name: '  Atlas Labs ', contactName: ' Ayşe Kaya ', email: ' INFO@ATLAS.CO ',
      phone: ' 123 ', industry: ' Yazılım ', status: 'active', notes: ' İlk görüşme ',
    })).toEqual({
      name: 'Atlas Labs', contactName: 'Ayşe Kaya', email: 'info@atlas.co', phone: '123',
      industry: 'Yazılım', status: 'active', notes: 'İlk görüşme',
    });
  });
});
