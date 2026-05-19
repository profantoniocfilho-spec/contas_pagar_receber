/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  Calendar,
  Filter,
  TrendingUp,
  TrendingDown,
  Info,
  Check,
  X,
  Smartphone,
  Layers,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  RotateCcw,
  Bell,
  Coins
} from 'lucide-react';
import { 
  Transaction, 
  FilterType, 
  INITIAL_TRANSACTIONS, 
  CATEGORIES_RECEBER, 
  CATEGORIES_PAGAR 
} from './types';

export default function App() {
  // Load transactions from localStorage or fallback to defaults
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('contas_financeiro_transactions');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Falha ao ler cache inicial. Usando padrões.', e);
    }
    return INITIAL_TRANSACTIONS;
  });

  // State management
  const [activeFilter, setActiveFilter] = useState<FilterType>('todas');
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<'date-asc' | 'date-desc' | 'amount-asc' | 'amount-desc'>('date-asc');
  const [isMobileSimulator, setIsMobileSimulator] = useState(false); // Default to gorgeous desktop preview
  
  // Registration form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'receber' | 'pagar'>('receber');
  const [dueDate, setDueDate] = useState('2026-05-20');
  const [category, setCategory] = useState(CATEGORIES_RECEBER[0]);
  const [status, setStatus] = useState<'pago' | 'pendente'>('pendente');
  const [formError, setFormError] = useState('');

  // Notifications state
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Sync state to localStorage on modification
  useEffect(() => {
    localStorage.setItem('contas_financeiro_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Handle active status tags rotation
  useEffect(() => {
    if (type === 'receber') {
      setCategory(CATEGORIES_RECEBER[0]);
    } else {
      setCategory(CATEGORIES_PAGAR[0]);
    }
  }, [type]);

  // Helper trigger notification
  const triggerToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ text, type });
    const timer = setTimeout(() => {
      setToast(null);
    }, 3500);
    return () => clearTimeout(timer);
  };

  // Restoration action handler
  const restoreMockData = () => {
    if (window.confirm('Deseja realmente restaurar os dados de exemplo originais do App?')) {
      setTransactions(INITIAL_TRANSACTIONS);
      triggerToast('Dados fictícios de demonstração restaurados!', 'info');
    }
  };

  // Dashboard figures calculations
  const totalReceber = transactions
    .filter((t) => t.type === 'receber')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPagar = transactions
    .filter((t) => t.type === 'pagar')
    .reduce((sum, t) => sum + t.amount, 0);

  const saldoGeral = totalReceber - totalPagar;

  // Additional stats for progress bars
  const totalRecebidoPago = transactions
    .filter((t) => t.type === 'receber' && t.status === 'pago')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPagoDespesa = transactions
    .filter((t) => t.type === 'pagar' && t.status === 'pago')
    .reduce((sum, t) => sum + t.amount, 0);

  // Search filter and Sorting pipeline logic
  const filteredList = transactions.filter((t) => {
    const matchFilter = activeFilter === 'todas' || t.type === activeFilter;
    const term = searchText.toLowerCase().trim();
    const matchSearch =
      term === '' ||
      t.description.toLowerCase().includes(term) ||
      t.category.toLowerCase().includes(term);

    return matchFilter && matchSearch;
  });

  const sortedList = [...filteredList].sort((a, b) => {
    if (sortBy === 'date-asc') {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (sortBy === 'date-desc') {
      return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
    }
    if (sortBy === 'amount-asc') {
      return a.amount - b.amount;
    }
    if (sortBy === 'amount-desc') {
      return b.amount - a.amount;
    }
    return 0;
  });

  // Handle register transaction submit
  const submitTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!description.trim()) {
      setFormError('Descreva o título ou descrição do registro.');
      return;
    }

    const valueNum = parseFloat(amount.replace(',', '.'));
    if (isNaN(valueNum) || valueNum <= 0) {
      setFormError('Digite um valor numérico válido maior que zero.');
      return;
    }

    if (!dueDate) {
      setFormError('Por favor, informe uma data de vencimento.');
      return;
    }

    const newTx: Transaction = {
      id: Date.now().toString(),
      description: description.trim(),
      amount: valueNum,
      type,
      dueDate,
      category,
      status
    };

    setTransactions((prev) => [newTx, ...prev]);
    setIsModalOpen(false);
    
    // Clear inputs
    setDescription('');
    setAmount('');
    setStatus('pendente');
    triggerToast(`"${newTx.description}" cadastrado com sucesso!`);
  };

  // Handle Delete
  const deleteTransaction = (id: string, name: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    triggerToast(`"${name}" foi removido do seu fluxo de caixa`, 'error');
  };

  // Interactive toggle status paid / outstanding
  const togglePaidStatus = (id: string) => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextState = t.status === 'pago' ? 'pendente' : 'pago';
          triggerToast(
            `Status alterado para ${nextState === 'pago' ? 'CONFIRMADO' : 'PENDENTE'}!`,
            'success'
          );
          return { ...t, status: nextState };
        }
        return t;
      })
    );
  };

  // Convert number to currency (BRL)
  const formatBRL = (num: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  };

  // format representation (YYYY-MM-DD -> DD/MM/YYYY)
  const formatDateRepresentation = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Base checking dates for overdue tags
  const systemCheckDate = new Date('2026-05-19');

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#2C3E50] flex flex-col font-sans antialiased">
      
      {/* Sleek Header Section */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 z-10 shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#3498DB] to-[#2980B9] flex items-center justify-center shadow-md">
            <Coins className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-[#2C3E50]">
              Financeiro Pro
            </h1>
            <p className="text-xs text-gray-500 font-medium">Controle Simplificado de Contas</p>
          </div>
        </div>

        {/* Global Controls & Layout Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={restoreMockData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 hover:bg-gray-50 transition-all text-gray-600 cursor-pointer"
            title="Restaurar dados fictícios originais"
          >
            <RotateCcw className="w-3.5 h-3.5 text-gray-400" />
            <span>Redefinir Mock</span>
          </button>

          <div className="h-5 w-px bg-gray-200 hidden sm:block"></div>

          {/* Mode selections */}
          <div className="bg-gray-100 p-1 rounded-xl flex items-center">
            <button
              onClick={() => setIsMobileSimulator(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isMobileSimulator
                  ? 'bg-white text-[#3498DB] shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Simulador Mobile</span>
            </button>
            <button
              onClick={() => setIsMobileSimulator(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !isMobileSimulator
                  ? 'bg-white text-[#3498DB] shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Painel Completo</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Workspace */}
      <main className="flex-1 overflow-auto p-4 md:p-8 flex items-center justify-center">
        
        {/* Floating notifications */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white border border-gray-100 shadow-xl px-5 py-3 rounded-2xl border-l-4 border-l-[#3498DB] animate-fade-in text-sm text-[#2C3E50] max-w-sm">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-[#2ECC71]" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-[#3498DB]" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-[#E74C3C]" />}
            <span className="font-semibold text-xs">{toast.text}</span>
          </div>
        )}

        {isMobileSimulator ? (
          /* ========================================================================= */
          /* SLEEK MOBILE SIMULATOR RENDER                                              */
          /* ========================================================================= */
          <div className="relative w-full max-w-[400px] aspect-[9/19] bg-white rounded-[50px] shadow-2xl ring-[12px] ring-gray-900 border-4 border-gray-950 p-2.5 overflow-hidden flex flex-col transition-all duration-300">
            
            {/* Phone Notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-5 bg-gray-950 rounded-full z-30 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-slate-900 absolute right-4"></div>
            </div>

            {/* Mobile Top Status indicator bar */}
            <div className="pt-1.5 px-6 flex justify-between items-center text-[11px] text-gray-400 font-bold select-none bg-white z-20">
              <span>09:41</span>
              <div className="flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-gray-300" />
                <span>5G</span>
                <div className="w-4.5 h-2.5 border border-gray-400 rounded-2xs p-px flex items-center">
                  <div className="h-full w-3 bg-[#2ECC71] rounded-2xs"></div>
                </div>
              </div>
            </div>

            {/* Simulated App Area */}
            <div className="flex-1 flex flex-col overflow-hidden bg-[#F5F7FA] pt-3 rounded-b-[40px] text-[#2C3E50]">
              
              {/* Internal Mock App Header */}
              <div className="px-4 py-3 flex justify-between items-center bg-white border-b border-gray-100">
                <div>
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest block">Minhas Contas</span>
                  <p className="text-sm font-black text-[#2C3E50]">SmartContas</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#3498DB] to-[#2980B9] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  JS
                </div>
              </div>

              {/* Scrollable View Area */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 pb-18 scrollbar-none">
                
                {/* 1. PRIMARY GRADIENT BALANCE CARD */}
                <div className="bg-gradient-to-r from-[#3498DB] to-[#2980B9] rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
                  <div className="relative z-10">
                    <span className="text-blue-100 text-[10px] uppercase font-bold tracking-widest">Saldo Geral Disponível</span>
                    <h2 className="text-2xl font-black mt-0.5 tracking-tight">{formatBRL(saldoGeral)}</h2>
                  </div>
                  
                  {/* Absolute subtle glowing decoration loops from aesthetic layout template */}
                  <div className="absolute right-[-15px] top-[-15px] w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                  <div className="absolute left-[30%] bottom-[-25px] w-36 h-36 bg-black/10 rounded-full blur-xl"></div>

                  <div className="mt-4 pt-4 border-t border-white/15 grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] text-blue-100/80 font-bold uppercase tracking-wider block">Total Receitas</span>
                      <p className="text-xs font-bold text-[#2ECC71] mt-0.5 bg-white/20 px-1.5 py-0.5 rounded-md inline-block">
                        {formatBRL(totalReceber)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] text-blue-100/80 font-bold uppercase tracking-wider block">Total Despesas</span>
                      <p className="text-xs font-bold text-[#E74C3C] mt-0.5 bg-white/20 px-1.5 py-0.5 rounded-md inline-block">
                        {formatBRL(totalPagar)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sub KPI Small Split notice */}
                <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-2xs flex items-start gap-2">
                  <Info className="w-4 h-4 text-[#3498DB] shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed text-slate-500">
                    Clique nas bolinhas de status para alterar a confirmação de quitação das faturas ou exclusão.
                  </p>
                </div>

                {/* Control Filters Area */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Pesquisar contas..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-9 pr-8 text-xs text-[#2C3E50] placeholder-gray-400 focus:outline-none focus:border-[#3498DB] shadow-2xs transition-all"
                    />
                    {searchText && (
                      <button onClick={() => setSearchText('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Pills filtering */}
                  <div className="flex bg-white p-1 rounded-xl shadow-xs gap-1 border border-gray-100">
                    <button
                      onClick={() => setActiveFilter('todas')}
                      className={`flex-1 py-1 px-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                        activeFilter === 'todas'
                          ? 'bg-[#3498DB] text-white'
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      Todas ({transactions.length})
                    </button>
                    <button
                      onClick={() => setActiveFilter('receber')}
                      className={`flex-1 py-1 px-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                        activeFilter === 'receber'
                          ? 'bg-[#2ECC71] text-white'
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      Receber ({transactions.filter(t => t.type === 'receber').length})
                    </button>
                    <button
                      onClick={() => setActiveFilter('pagar')}
                      className={`flex-1 py-1 px-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                        activeFilter === 'pagar'
                          ? 'bg-[#E74C3C] text-white'
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      Pagar ({transactions.filter(t => t.type === 'pagar').length})
                    </button>
                  </div>
                </div>

                {/* Listing Title */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">
                    <span>Lançamentos</span>
                    <span>{sortedList.length} itens</span>
                  </div>

                  {/* Listing Stack */}
                  <div className="space-y-2">
                    {sortedList.length === 0 ? (
                      <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center space-y-1 shadow-2xs">
                        <HelpCircle className="w-7 h-7 mx-auto text-gray-300" />
                        <p className="text-gray-600 text-xs font-bold">Nenhum registro encontrado</p>
                      </div>
                    ) : (
                      sortedList.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white hover:bg-gray-50 p-3 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between transition-all"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {/* Tap status */}
                            <button
                              onClick={() => togglePaidStatus(item.id)}
                              className={`w-5.5 h-5.5 rounded-full flex items-center justify-center shrink-0 border transition-all cursor-pointer ${
                                item.status === 'pago'
                                  ? 'bg-[#2ECC71]/15 text-[#2ECC71] border-[#2ECC71]'
                                  : 'bg-white text-gray-300 border-gray-200'
                              }`}
                            >
                              {item.status === 'pago' ? (
                                <Check className="w-3 h-3 stroke-[3]" />
                              ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                              )}
                            </button>

                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-[#2C3E50] truncate">{item.description}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                                  item.type === 'receber' ? 'bg-[#2ECC71]/10 text-[#2ECC71]' : 'bg-[#E74C3C]/10 text-[#E74C3C]'
                                }`}>
                                  {item.category}
                                </span>
                                <span className="text-[9px] text-gray-400 font-medium font-mono">
                                  {formatDateRepresentation(item.dueDate)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Price Tag & Trash */}
                          <div className="flex items-center gap-1.5 ml-2">
                            <div className="text-right">
                              <p className={`text-xs font-black ${
                                item.type === 'receber' ? 'text-[#2ECC71]' : 'text-[#E74C3C]'
                              }`}>
                                {item.type === 'receber' ? '+' : '-'} {formatBRL(item.amount)}
                              </p>
                              <span className="text-[8px] uppercase tracking-wider text-gray-400 block font-bold">
                                {item.status === 'pago' ? 'Feito' : 'Pendente'}
                              </span>
                            </div>

                            <button
                              onClick={() => deleteTransaction(item.id, item.description)}
                              className="p-1 hover:bg-red-50 text-gray-300 hover:text-[#E74C3C] rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                </div>

              </div>

              {/* Float Mobile Trigger CTA */}
              <div className="absolute bottom-4 left-4 right-4 z-20">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full py-3 bg-[#2ECC71] text-white font-extrabold rounded-2xl shadow-lg shadow-[#2ECC71]/20 flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider hover:bg-emerald-600 active:scale-98 transition duration-150 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Adicionar Conta</span>
                </button>
              </div>

              {/* Simulated navigation device indicators */}
              <div className="h-1.5 w-24 bg-gray-200 rounded-full mx-auto mb-1 shrink-0"></div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* EXPANDED DESKTOP MONITOR PANEL VIEW (Highly Polished)                      */
          /* ========================================================================= */
          <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-1">
            
            {/* Left Column STATS & CARDS (5 cols) */}
            <div className="lg:col-span-12 xl:col-span-5 space-y-6">
              
              {/* Primary Glowing Balance card */}
              <div className="bg-gradient-to-r from-[#3498DB] to-[#2980B9] rounded-3xl p-8 text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1.5">Saldo Disponível Estimado</p>
                  <h2 className="text-4xl lg:text-5xl font-black tracking-tight">{formatBRL(saldoGeral)}</h2>
                  <p className="text-blue-100/70 text-[11px] mt-2 font-mono">
                    Status Atual: Baseado em {transactions.length} contas cadastradas para o período
                  </p>
                </div>
                
                {/* Visual vector blobs in high contrast blur from "Sleek Interface" styles */}
                <div className="absolute right-[-20px] top-[-20px] w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute left-[40%] bottom-[-50px] w-64 h-64 bg-black/10 rounded-full blur-2xl"></div>

                <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-blue-100/80 font-bold uppercase tracking-widest">Contas a Recebidas</span>
                    <p className="text-sm font-extrabold text-[#2ECC71] mt-1 bg-white/15 px-2.5 py-1 rounded-lg inline-block">
                      {formatBRL(totalReceber)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-blue-100/80 font-bold uppercase tracking-widest">Contas a Pagas</span>
                    <p className="text-sm font-extrabold text-[#E74C3C] mt-1 bg-white/15 px-2.5 py-1 rounded-lg inline-block">
                      {formatBRL(totalPagar)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sub cards side-by-side matching core Design HTML */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#2ECC71]/10 rounded-xl flex items-center justify-center text-[#2ECC71] text-xl shrink-0">
                    📈
                  </div>
                  <div className="min-w-0">
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block">A Receber</p>
                    <h3 className="text-base font-black text-[#2C3E50] truncate">{formatBRL(totalReceber)}</h3>
                    <span className="text-[9px] text-gray-500 block font-mono">Confirmado: {formatBRL(totalRecebidoPago)}</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#E74C3C]/10 rounded-xl flex items-center justify-center text-[#E74C3C] text-xl shrink-0">
                    📉
                  </div>
                  <div className="min-w-0">
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block">A Pagar</p>
                    <h3 className="text-base font-black text-[#E74C3C] truncate">{formatBRL(totalPagar)}</h3>
                    <span className="text-[9px] text-gray-500 block font-mono">Pago: {formatBRL(totalPagoDespesa)}</span>
                  </div>
                </div>
              </div>

              {/* Progress split bar details */}
              <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-600 uppercase tracking-wider text-[10px]">Distribuição de Títulos</span>
                  <span className="text-[#3498DB] font-extrabold text-[11px] font-mono">
                    {transactions.filter(t => t.type === 'receber').length} receitas / {transactions.filter(t => t.type === 'pagar').length} despesas
                  </span>
                </div>
                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
                  <div 
                    className="bg-[#2ECC71] h-full transition-all" 
                    style={{ 
                      width: `${transactions.length ? (transactions.filter(t => t.type === 'receber').length / transactions.length) * 100 : 50}%` 
                    }}
                    title="Razão de Receber"
                  />
                  <div 
                    className="bg-[#E74C3C] h-full transition-all" 
                    style={{ 
                      width: `${transactions.length ? (transactions.filter(t => t.type === 'pagar').length / transactions.length) * 100 : 50}%` 
                    }}
                    title="Razão de Pagar"
                  />
                </div>
                <div className="text-[11px] text-gray-400 leading-normal font-medium">
                  Ative ou desative o progresso de cada título alterando seu status para pago. Isso atualizará os totais do Dashboard automaticamente.
                </div>
              </div>

            </div>

            {/* Right Column DIRECT TRANSACTION CONTROLS & TABLE (7 cols) */}
            <div className="lg:col-span-12 xl:col-span-7 flex flex-col space-y-4">
              
              {/* Transactions header row */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                
                {/* Horizontal Quick Filter Selector Tabs from Design HTML layout style */}
                <div className="flex bg-white p-1 rounded-xl shadow-xs gap-1 border border-gray-150 shrink-0">
                  <button
                    onClick={() => setActiveFilter('todas')}
                    className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeFilter === 'todas'
                        ? 'bg-[#3498DB] text-white shadow-xs'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    Todas ({transactions.length})
                  </button>
                  <button
                    onClick={() => setActiveFilter('pagar')}
                    className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeFilter === 'pagar'
                        ? 'bg-[#E74C3C] text-white shadow-xs'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    Pagar ({transactions.filter(t => t.type === 'pagar').length})
                  </button>
                  <button
                    onClick={() => setActiveFilter('receber')}
                    className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeFilter === 'receber'
                        ? 'bg-[#2ECC71] text-white shadow-xs'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    Receber ({transactions.filter(t => t.type === 'receber').length})
                  </button>
                </div>

                {/* Primary Register button as styled in 'Sleek Interface' with green gradient accent */}
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 bg-[#2ECC71] hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-[#2ECC71]/15 hover:scale-[1.01] active:scale-[0.99] transition-all text-xs uppercase tracking-wider cursor-pointer font-sans"
                >
                  <Plus className="w-4 h-4 text-white stroke-[3.5]" />
                  <span>Adicionar Conta</span>
                </button>
              </div>

              {/* Transactions list layout box container */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-150 flex-1 overflow-hidden flex flex-col min-h-[460px]">
                
                <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-3 justify-between items-center bg-gray-50/50">
                  <div>
                    <h3 className="text-xs font-extrabold text-[#2C3E50] uppercase tracking-wider">Histórico de Lançamentos</h3>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">Mostrando as contas de acordo com filtros ativos</p>
                  </div>

                  {/* Search and Sorting components */}
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-48">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg py-1.5 pl-8 pr-4 text-xs text-[#2C3E50] placeholder-gray-400 focus:outline-none focus:border-[#3498DB] shadow-2xs"
                      />
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 px-2.5 py-1.5 flex items-center gap-1">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-transparent text-[11px] font-bold text-[#3498DB] focus:outline-none border-none cursor-pointer"
                      >
                        <option value="date-asc">Vencimento (Mais novo)</option>
                        <option value="date-desc">Vencimento (Mais antigo)</option>
                        <option value="amount-desc">Maior valor</option>
                        <option value="amount-asc">Menor valor</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Items container list */}
                <div className="p-4 flex-1 overflow-y-auto space-y-3.5 max-h-[440px]">
                  {sortedList.length === 0 ? (
                    <div className="text-center py-16 space-y-2">
                      <HelpCircle className="w-9 h-9 text-gray-300 mx-auto" />
                      <h4 className="text-sm font-bold text-gray-600">Nenhum lançamento pendente</h4>
                      <p className="text-xs text-gray-400 max-w-xs mx-auto">Adicione contas ou mude seus filtros acima para reexibir!</p>
                    </div>
                  ) : (
                    sortedList.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3.5 hover:bg-gray-50 rounded-2xl transition-all border border-transparent hover:border-gray-100 shadow-2xs"
                      >
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          
                          {/* Toggle badge interactive button */}
                          <button
                            onClick={() => togglePaidStatus(item.id)}
                            className={`w-6.5 h-6.5 rounded-full flex items-center justify-center shrink-0 border transition-all cursor-pointer ${
                              item.status === 'pago'
                                ? 'bg-[#2ECC71]/10 text-[#2ECC71] border-[#2ECC71]/35'
                                : 'bg-gray-50 hover:bg-amber-100 text-gray-300 border-gray-200 hover:border-amber-300'
                            }`}
                            title={item.status === 'pago' ? 'Marcar como Pendente' : 'Marcar como Pago'}
                          >
                            {item.status === 'pago' ? (
                              <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                            )}
                          </button>

                          {/* Detail titles */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-[#2C3E50] text-[13px] truncate">{item.description}</p>
                              <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                                item.type === 'receber' ? 'bg-[#2ECC71]/10 text-[#2ECC71]' : 'bg-[#E74C3C]/10 text-[#E74C3C]'
                              }`}>
                                {item.category}
                              </span>
                            </div>

                            <p className="text-gray-400 text-[10px] font-mono font-medium mt-1 uppercase tracking-tight flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>Vencimento: {formatDateRepresentation(item.dueDate)}</span>
                              
                              {item.status === 'pendente' && new Date(item.dueDate).getTime() < systemCheckDate.getTime() && (
                                <span className="bg-amber-100 text-amber-600 text-[9px] px-1 rounded font-bold uppercase transition-all">
                                  Atraso
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Amount visual indicator */}
                        <div className="flex items-center gap-5 shrink-0 ml-3">
                          <div className="text-right">
                            <p className={`font-black text-sm lg:text-base ${
                              item.type === 'receber' ? 'text-[#2ECC71]' : 'text-[#E74C3C]'
                            }`}>
                              {item.type === 'receber' ? '+' : '-'} {formatBRL(item.amount)}
                            </p>
                            <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wider">
                              {item.status === 'pago' ? 'Quitação Confirmada' : 'Aguardando Quitação'}
                            </span>
                          </div>

                          {/* Delete Action button */}
                          <button
                            onClick={() => deleteTransaction(item.id, item.description)}
                            className="text-gray-300 hover:text-[#E74C3C] transition-all p-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
                            title="Remover Contas"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Bottom Decor Margin standard layout */}
                <div className="h-3 bg-gray-50 border-t border-gray-100 w-full shrink-0"></div>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* INTERACTIVE ADD TRANSACTION MODAL DIALOG                                  */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up border border-gray-105">
            
            {/* Modal Title header */}
            <div className="bg-[#2C3E50] text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest">Nova Conta</h3>
                <p className="text-[11px] text-blue-100/70 mt-0.5">Informe os detalhes para atualizar os saldos.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-white/80 hover:text-white transition duration-150 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form inputs rendered in light background theme */}
            <form onSubmit={submitTransaction} className="p-6 space-y-4">
              
              {/* Local Form errors indicator */}
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-[#E74C3C] font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Selector Tabs for Receber vs Pagar */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Tipo do Lançamento</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setType('receber')}
                    className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition duration-150 cursor-pointer ${
                      type === 'receber'
                        ? 'bg-[#2ECC71]/10 border-[#2ECC71] text-[#2ECC71]'
                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>A Receber (Receita)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('pagar')}
                    className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition duration-150 cursor-pointer ${
                      type === 'pagar'
                        ? 'bg-[#E74C3C]/10 border-[#E74C3C] text-[#E74C3C]'
                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <TrendingDown className="w-4 h-4" />
                    <span>A Pagar (Despesa)</span>
                  </button>
                </div>
              </div>

              {/* Description field */}
              <div className="space-y-1.5">
                <label htmlFor="form-desc" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                  Descrição / Título
                </label>
                <input
                  id="form-desc"
                  type="text"
                  placeholder="Ex: Salário, Aluguel, Mercado..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs text-[#2C3E50] placeholder-gray-400 focus:outline-none focus:border-[#3498DB] transition-all"
                  maxLength={40}
                  required
                />
              </div>

              {/* Category selector on type */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="form-category" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                    Categoria Tag
                  </label>
                  <select
                    id="form-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-3 text-xs text-gray-700 focus:outline-none focus:border-[#3498DB] cursor-pointer"
                  >
                    {type === 'receber'
                      ? CATEGORIES_RECEBER.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))
                      : CATEGORIES_PAGAR.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                  </select>
                </div>

                {/* Account price value amount */}
                <div className="space-y-1.5">
                  <label htmlFor="form-value" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                    Valor (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-xs text-gray-400 font-bold font-mono">R$</span>
                    <input
                      id="form-value"
                      type="text"
                      placeholder="850,00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-xs text-[#2C3E50] placeholder-gray-400 font-mono focus:outline-none focus:border-[#3498DB] transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Datepicker and Starting status options */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="form-due" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Vencimento</label>
                  <input
                    id="form-due"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-3 text-xs text-gray-700 focus:outline-none focus:border-[#3498DB] text-center"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Status Inicial</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setStatus('pago')}
                      className={`flex-1 py-3 rounded-xl border text-[10px] font-bold transition-all text-center cursor-pointer ${
                        status === 'pago'
                          ? 'bg-[#2ECC71]/10 border-[#2ECC71] text-[#2ECC71]'
                          : 'bg-white border-gray-200 text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {type === 'receber' ? 'Recebido' : 'Pago'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus('pendente')}
                      className={`flex-1 py-3 rounded-xl border text-[10px] font-bold transition-all text-center cursor-pointer ${
                        status === 'pendente'
                          ? 'bg-amber-50 border-amber-300 text-amber-700 bg-amber-500/10'
                          : 'bg-white border-gray-200 text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      Pendente
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal footer submittal */}
              <div className="pt-4 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs rounded-xl transition duration-150 uppercase tracking-wider cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-[#3498DB] to-[#2980B9] hover:brightness-105 text-white font-extrabold text-xs rounded-xl transition duration-150 uppercase tracking-wider cursor-pointer"
                >
                  Salvar Título
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Footer Info Statement */}
      <footer className="bg-white border-t border-gray-100 py-3.5 px-6 text-center select-none text-[10px] text-gray-400 font-medium">
        <p>&copy; 2026 SmartContas &bull; Financeiro Pro &bull; Preservando Todos os Estados offline com LocalStorage</p>
      </footer>
    </div>
  );
}
