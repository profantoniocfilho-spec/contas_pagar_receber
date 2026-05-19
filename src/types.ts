/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'receber' | 'pagar';
  dueDate: string;
  category: string;
  status: 'pago' | 'pendente';
}

export type FilterType = 'todas' | 'receber' | 'pagar';

export const CATEGORIES_RECEBER = [
  'Salário',
  'Freelance',
  'Investimentos',
  'Reembolso',
  'Vendas',
  'Outros'
];

export const CATEGORIES_PAGAR = [
  'Moradia',
  'Alimentação',
  'Transporte',
  'Lazer',
  'Saúde',
  'Educação',
  'Serviços',
  'Outros'
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    description: 'Salário Principal',
    amount: 5500.00,
    type: 'receber',
    dueDate: '2026-05-05',
    category: 'Salário',
    status: 'pago'
  },
  {
    id: '2',
    description: 'Aluguel Mensal',
    amount: 1500.00,
    type: 'pagar',
    dueDate: '2026-05-10',
    category: 'Moradia',
    status: 'pago'
  },
  {
    id: '3',
    description: 'Rancho Supermercado',
    amount: 680.00,
    type: 'pagar',
    dueDate: '2026-05-14',
    category: 'Alimentação',
    status: 'pago'
  },
  {
    id: '4',
    description: 'Projeto Freelance React',
    amount: 2400.00,
    type: 'receber',
    dueDate: '2026-05-22',
    category: 'Freelance',
    status: 'pendente'
  },
  {
    id: '5',
    description: 'Fatura de Luz',
    amount: 185.50,
    type: 'pagar',
    dueDate: '2026-05-25',
    category: 'Serviços',
    status: 'pendente'
  }
];
