import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Save, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  Truck,
  Lock,
  RotateCcw,
  Unlock,
  Search
} from 'lucide-react';
import { dbService } from '../services/db';
import type { Product, DistributionWeek } from '../services/db';

const DESTINATIONS = [
  'Tijuca',
  'Méier',
  'Botafogo',
  'Barra',
  'Recreio',
  'Freguesia',
  'Campo Grande',
  'Centro',
  'Produção'
];

const DAYS_OF_WEEK = [
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
  'Domingo'
];

export const Distribuicao: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [distributions, setDistributions] = useState<DistributionWeek[]>([]);
  const [activeDest, setActiveDest] = useState(DESTINATIONS[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // local grid state: { [productId]: { [day]: quantity } }
  const [gridData, setGridData] = useState<{ [prodId: string]: { [day: string]: string } }>({});
  const [currentDist, setCurrentDist] = useState<DistributionWeek | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionType: 'confirm_shipment' | 'reopen_shipment' | 'reset_week';
  }>({
    isOpen: false,
    title: '',
    message: '',
    actionType: 'confirm_shipment'
  });

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, dists] = await Promise.all([
        dbService.getProducts(),
        dbService.getDistributions()
      ]);
      setProducts(prods);
      setDistributions(dists);
      
      // Load or build grid for active destination
      const match = dists.find(d => d.destination === activeDest);
      setCurrentDist(match || null);

      const initialGrid: typeof gridData = {};
      prods.forEach(p => {
        initialGrid[p.id] = {};
        DAYS_OF_WEEK.forEach(day => {
          const val = match?.items[p.id]?.[day];
          initialGrid[p.id][day] = val !== undefined && val !== 0 ? val.toString() : '';
        });
      });
      setGridData(initialGrid);
    } catch (err) {
      showToast('error', 'Falha ao carregar dados de distribuição.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeDest]);

  const handleCellChange = (productId: string, day: string, value: string) => {
    if (currentDist?.status === 'Confirmado') return; // Read-only

    if (value === '' || /^\d*([.,]\d*)?$/.test(value)) {
      setGridData(prev => ({
        ...prev,
        [productId]: {
          ...prev[productId],
          [day]: value
        }
      }));
    }
  };

  const handleSaveDraft = async () => {
    try {
      await dbService.saveDistribution(activeDest, getParsedGridData());
      showToast('success', 'Rascunho da grade semanal salvo com sucesso!');
      loadData();
    } catch (error) {
      showToast('error', 'Erro ao salvar rascunho da distribuição.');
    }
  };

  const handleConfirmShipment = async () => {
    // 1. Check if there are quantities to send
    let totalQty = 0;
    const errors: string[] = [];
    const parsedGrid = getParsedGridData();

    Object.entries(parsedGrid).forEach(([productId, dayData]) => {
      const itemSum = Object.values(dayData).reduce((sum, val) => sum + val, 0);
      totalQty += itemSum;

      // 2. Validate current central stock availability
      const product = products.find(p => p.id === productId);
      if (product && product.finalStock < itemSum) {
        errors.push(`${product.name}: Necessário ${itemSum} e saldo em estoque é ${product.finalStock}`);
      }
    });

    if (totalQty === 0) {
      showToast('error', 'Preencha alguma quantidade na grade antes de enviar.');
      return;
    }

    if (errors.length > 0) {
      showToast('error', `Estoque central insuficiente! ${errors[0]}`);
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Confirmar Envio de Remessa',
      message: `Deseja confirmar o envio de ${totalQty} itens para ${activeDest}? Esta ação dará baixa imediata no Estoque Central.`,
      actionType: 'confirm_shipment'
    });
  };

  const handleReopenShipment = async () => {
    if (!currentDist) return;
    setConfirmModal({
      isOpen: true,
      title: 'Reabrir Grade de Envio',
      message: `Deseja reabrir a grade de envio para ${activeDest}? Os saldos retirados do Estoque Central serão devolvidos para a Central.`,
      actionType: 'reopen_shipment'
    });
  };

  const handleResetAllWeeks = async () => {
    setConfirmModal({
      isOpen: true,
      title: 'Iniciar Nova Semana',
      message: 'Tem certeza que deseja iniciar uma NOVA SEMANA? Isto irá limpar todas as grades de distribuição de todas as lojas para preenchimento do zero.',
      actionType: 'reset_week'
    });
  };

  const executeModalAction = async () => {
    const action = confirmModal.actionType;
    setConfirmModal(prev => ({ ...prev, isOpen: false }));

    if (action === 'confirm_shipment') {
      try {
        const saved = await dbService.saveDistribution(activeDest, getParsedGridData());
        await dbService.confirmDistribution(saved.id);
        showToast('success', 'Remessa confirmada! Baixa automática realizada no Estoque Central.');
        loadData();
      } catch (error) {
        showToast('error', 'Falha ao confirmar envio.');
      }
    } else if (action === 'reopen_shipment') {
      if (!currentDist) return;
      try {
        await dbService.reopenDistribution(currentDist.id);
        showToast('success', 'Grade reaberta com sucesso! Saldo devolvido ao Estoque Central.');
        loadData();
      } catch (error) {
        showToast('error', 'Falha ao reabrir grade.');
      }
    } else if (action === 'reset_week') {
      try {
        await dbService.resetAllDistributions();
        showToast('success', 'Nova semana iniciada! Todas as grades de envio foram resetadas.');
        loadData();
      } catch (error) {
        showToast('error', 'Erro ao resetar semana.');
      }
    }
  };

  // Helper to convert grid data strings to numbers
  const getParsedGridData = (): { [productId: string]: { [day: string]: number } } => {
    const parsed: { [productId: string]: { [day: string]: number } } = {};
    Object.entries(gridData).forEach(([productId, dayData]) => {
      parsed[productId] = {};
      Object.entries(dayData).forEach(([day, val]) => {
        parsed[productId][day] = val === '' ? 0 : (parseFloat(val.replace(',', '.')) || 0);
      });
    });
    return parsed;
  };

  // Get row total
  const getProductTotal = (productId: string) => {
    const days = gridData[productId];
    if (!days) return 0;
    return Object.values(days).reduce((sum, val) => sum + (val === '' ? 0 : (parseFloat(val.replace(',', '.')) || 0)), 0);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl shadow-lg border transition-all duration-300 ${
          toast.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-500" /> : <AlertCircle size={18} className="text-rose-500" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Grade de Distribuição</h2>
          <p className="text-sm text-gray-500 mt-1">Planejamento e controle de remessas diárias para lojas e produção.</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleResetAllWeeks}
            className="flex items-center space-x-2 px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-sm font-semibold shadow-sm transition-all"
            title="Iniciar Nova Semana (Limpa todas as grades)"
          >
            <RotateCcw size={16} />
            <span>Iniciar Nova Semana</span>
          </button>
        </div>
      </div>

      {/* Seletor de Destinos (Tabs) */}
      <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap gap-2 overflow-x-auto">
        {DESTINATIONS.map((dest) => {
          const isSelected = activeDest === dest;
          const match = distributions.find(d => d.destination === dest);
          const isConfirmed = match?.status === 'Confirmado';

          return (
            <button
              key={dest}
              onClick={() => setActiveDest(dest)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isSelected 
                  ? 'bg-accent-yellow text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Building2 size={16} className={isSelected ? 'text-gray-900' : 'text-gray-400'} />
              <span>{dest}</span>
              {isConfirmed && (
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Envio Confirmado" />
              )}
            </button>
          );
        })}
      </div>

      {/* Painel Principal da Matriz */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header da Grade */}
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500">
                <Truck size={18} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Grade Semanal de Envio: {activeDest}</h3>
                <p className="text-xs text-gray-500 mt-0.5">Preencha as quantidades programadas de entrega por dia.</p>
              </div>
            </div>

            <div className="relative flex-1 max-w-xs sm:ml-4">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Pesquisar item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:border-transparent transition-all bg-white"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {currentDist?.status === 'Confirmado' ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-xl text-xs font-semibold">
                  <Lock size={14} className="text-emerald-500" />
                  <span>Envio Confirmado: {new Date(currentDist.confirmedAt || '').toLocaleDateString('pt-BR')}</span>
                </div>
                <button
                  onClick={handleReopenShipment}
                  className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 text-gray-600 rounded-xl text-xs font-semibold transition-all shadow-sm"
                  title="Reabrir Grade de Envio"
                >
                  <Unlock size={13} />
                  <span>Reabrir Grade</span>
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={handleSaveDraft}
                  disabled={products.length === 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors"
                >
                  <Save size={16} />
                  <span>Salvar Rascunho</span>
                </button>

                <button
                  onClick={handleConfirmShipment}
                  disabled={products.length === 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-accent-yellow text-gray-900 rounded-xl text-sm font-bold shadow-sm hover:brightness-95 transition-all"
                >
                  <Send size={16} />
                  <span>Confirmar Envio</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Matriz Cruzada */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center text-gray-500 text-sm">Carregando matriz de distribuição...</div>
          ) : products.length === 0 ? (
            <div className="py-20 text-center text-gray-400 text-sm">Cadastre produtos no Estoque Central para liberar a distribuição.</div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center text-gray-400 text-sm">Nenhum produto correspondente à busca.</div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-4 px-6 w-1/4">Item</th>
                  <th className="py-4 px-6 text-right w-36">Estoque Central</th>
                  {DAYS_OF_WEEK.map(day => (
                    <th key={day} className="py-4 px-4 text-center">{day}</th>
                  ))}
                  <th className="py-4 px-6 text-right font-bold text-gray-900 bg-gray-50 border-l border-gray-100">Total Envio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredProducts.map((p) => {
                  const itemTotal = getProductTotal(p.id);
                  const isExceeded = itemTotal > p.finalStock;

                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 font-medium text-gray-900">
                        {p.name}
                        <span className="text-[10px] text-gray-400 font-normal block">Unidade: {p.unit}</span>
                      </td>
                      <td className="py-4 px-6 text-right font-semibold text-gray-600">
                        {p.finalStock.toLocaleString()}
                      </td>
                      
                      {DAYS_OF_WEEK.map(day => (
                        <td key={day} className="py-3 px-2 text-center">
                          <input
                            type="text"
                            inputMode="decimal"
                            disabled={currentDist?.status === 'Confirmado'}
                            value={gridData[p.id]?.[day] ?? ''}
                            onChange={(e) => handleCellChange(p.id, day, e.target.value)}
                            placeholder="0"
                            className={`w-16 px-1.5 py-1 text-center border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:border-transparent ${
                              currentDist?.status === 'Confirmado'
                                ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                                : 'border-gray-200 text-gray-700'
                            }`}
                          />
                        </td>
                      ))}

                      <td className={`py-4 px-6 text-right font-bold border-l border-gray-100 ${
                        isExceeded 
                          ? 'text-rose-600 bg-rose-50 bg-opacity-20' 
                          : itemTotal > 0 
                            ? 'text-amber-600' 
                            : 'text-gray-400'
                      }`}>
                        {itemTotal.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {/* Modal: Confirmação Personalizada */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h4 className="font-bold text-gray-950">{confirmModal.title}</h4>
              <button 
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="text-gray-400 hover:text-gray-600 text-lg font-medium"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4 text-left">
              <p className="text-sm text-gray-600 leading-relaxed">
                {confirmModal.message}
              </p>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-gray-100 mt-4">
                <button
                  type="button"
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={executeModalAction}
                  className={`px-5 py-2 rounded-xl text-sm font-bold shadow-sm hover:brightness-95 transition-all ${
                    confirmModal.actionType === 'reset_week'
                      ? 'bg-rose-600 text-white hover:bg-rose-750'
                      : confirmModal.actionType === 'reopen_shipment'
                        ? 'bg-amber-500 text-white hover:bg-amber-600'
                        : 'bg-accent-yellow text-gray-900'
                  }`}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
