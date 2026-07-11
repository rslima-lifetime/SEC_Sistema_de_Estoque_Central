import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Activity,
  History,
  Lock,
  AlertCircle
} from 'lucide-react';
import { dbService } from '../services/db';
import type { Product, AuditRecord } from '../services/db';

export const Auditoria: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // audit inputs state: { [productId]: physicalQuantity }
  const [physicalCounts, setPhysicalCounts] = useState<{ [productId: string]: number }>({});

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, pastAudits] = await Promise.all([
        dbService.getProducts(),
        dbService.getAudits()
      ]);
      setProducts(prods);
      setAudits(pastAudits);
      
      // Initialize inputs with theoretical counts
      const counts: typeof physicalCounts = {};
      prods.forEach(p => {
        counts[p.id] = p.finalStock;
      });
      setPhysicalCounts(counts);
    } catch (err) {
      showToast('error', 'Erro ao carregar dados do inventário.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCountChange = (productId: string, val: string) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setPhysicalCounts(prev => ({
      ...prev,
      [productId]: num
    }));
  };

  const handleSaveAudit = async () => {
    // Compile audit payload
    const payload: { [productId: string]: { theoretical: number; physical: number } } = {};
    let negativeDiffsCount = 0;
    let absoluteLossCount = 0;

    products.forEach(p => {
      const physical = physicalCounts[p.id] !== undefined ? physicalCounts[p.id] : p.finalStock;
      const diff = physical - p.finalStock;

      payload[p.id] = {
        theoretical: p.finalStock,
        physical: physical
      };

      if (diff < 0) {
        negativeDiffsCount++;
        absoluteLossCount += Math.abs(diff);
      }
    });

    let confirmMsg = 'Confirmar o fechamento de estoque? ';
    if (negativeDiffsCount > 0) {
      confirmMsg += `ATENÇÃO: Foram identificados ${negativeDiffsCount} itens com divergência negativa (quebra/perda total de ${absoluteLossCount} unidades). O estoque central será corrigido para refletir o saldo físico real.`;
    } else {
      confirmMsg += 'Todos os itens estão de acordo com o saldo físico informado.';
    }

    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      await dbService.performAudit(payload);
      showToast('success', 'Fechamento de estoque e acareação registrados com sucesso!');
      loadData(); // reload updated products stock levels and history list
    } catch (error) {
      showToast('error', 'Erro ao salvar a auditoria.');
    }
  };

  // Helper variables for statistics
  const itemsWithLoss = products.filter(p => {
    const physical = physicalCounts[p.id] !== undefined ? physicalCounts[p.id] : p.finalStock;
    return physical < p.finalStock;
  }).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Toast Notification */}
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

      {/* Tabela de Acareação e Fechamento */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-accent-yellow bg-opacity-20 text-gray-900 rounded-lg">
                <ClipboardCheck size={18} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Fechamento & Acareação</h3>
                <p className="text-xs text-gray-500 mt-0.5">Audite as prateleiras físicas e aponte perdas ou desvios.</p>
              </div>
            </div>

            <button
              onClick={handleSaveAudit}
              disabled={products.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-accent-yellow text-gray-900 rounded-xl text-sm font-bold shadow-sm hover:brightness-95 transition-all"
            >
              <Lock size={16} />
              <span>Gravar Fechamento</span>
            </button>
          </div>

          {/* Matriz de Auditoria */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 text-center text-gray-500 text-sm">Carregando painel de auditoria...</div>
            ) : products.length === 0 ? (
              <div className="py-20 text-center text-gray-400 text-sm">Nenhum produto cadastrado no estoque central.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="py-4 px-6 w-1/3">Produto</th>
                    <th className="py-4 px-4 text-right">Estoque Teórico</th>
                    <th className="py-4 px-4 text-center w-36">Estoque Físico Real</th>
                    <th className="py-4 px-6 text-right">Diferença (Desvio)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {products.map((p) => {
                    const physical = physicalCounts[p.id] !== undefined ? physicalCounts[p.id] : p.finalStock;
                    const diff = physical - p.finalStock;
                    const isNegative = diff < 0;
                    const isPositive = diff > 0;

                    return (
                      <tr 
                        key={p.id} 
                        className={`transition-colors hover:bg-gray-50 ${
                          isNegative ? 'bg-rose-50 bg-opacity-35 hover:bg-rose-50 text-rose-950' : ''
                        }`}
                      >
                        <td className="py-4 px-6 font-medium">
                          {p.name}
                          <span className="text-[10px] text-gray-400 font-normal block">Unidade: {p.unit}</span>
                        </td>
                        
                        <td className="py-4 px-4 text-right font-semibold text-gray-600">
                          {p.finalStock.toLocaleString()}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <input
                            type="number"
                            min="0"
                            value={physicalCounts[p.id] === undefined ? '' : physicalCounts[p.id]}
                            onChange={(e) => handleCountChange(p.id, e.target.value)}
                            className={`w-28 px-3 py-1.5 text-center border rounded-xl text-sm font-semibold transition-all focus:outline-none focus:ring-2 ${
                              isNegative
                                ? 'border-rose-300 focus:ring-rose-500 bg-white text-rose-800'
                                : 'border-gray-200 focus:ring-accent-yellow bg-white text-gray-700'
                            }`}
                          />
                        </td>

                        <td className={`py-4 px-6 text-right font-bold ${
                          isNegative 
                            ? 'text-rose-600' 
                            : isPositive 
                              ? 'text-emerald-600' 
                              : 'text-gray-400'
                        }`}>
                          <div className="flex items-center justify-end space-x-1">
                            {isNegative && <AlertTriangle size={14} className="text-rose-500 animate-pulse" />}
                            <span>
                              {diff === 0 ? '0' : (isPositive ? `+${diff}` : diff)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Painel Lateral de Histórico e Indicadores */}
      <div className="lg:col-span-1 space-y-6">
        {/* KPI Panel */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h4 className="font-bold text-gray-900 text-sm flex items-center space-x-2">
            <Activity size={16} className="text-gray-400" />
            <span>Indicador Instantâneo</span>
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-xs text-gray-500 font-semibold">Itens com Desvio</span>
              <span className={`text-sm font-bold ${itemsWithLoss > 0 ? 'text-rose-600' : 'text-gray-700'}`}>
                {itemsWithLoss} item(ns)
              </span>
            </div>
            {itemsWithLoss > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800 flex items-start space-x-2">
                <AlertTriangle size={16} className="text-rose-500 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Aviso Visual Ativado:</strong> Linhas destacadas em vermelho indicam divergência negativa no estoque físico em relação ao sistema.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Histórico de Fechamentos */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center space-x-2 bg-gray-50">
            <History size={16} className="text-gray-400" />
            <h4 className="font-bold text-gray-900 text-sm">Fechamentos Anteriores</h4>
          </div>
          
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-xs">Carregando históricos...</div>
          ) : audits.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">Nenhum fechamento registrado no sistema.</div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {audits.map((a) => {
                // calculate sum of difference in this audit
                const totalDiff = Object.values(a.items).reduce((sum, item) => sum + item.difference, 0);

                return (
                  <div key={a.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">Fechamento: {a.date}</span>
                      <span className="text-[10px] text-gray-400 block mt-0.5">ID: {a.id.slice(0, 12)}...</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-bold inline-flex items-center space-x-0.5 ${
                        totalDiff < 0 
                          ? 'text-rose-600' 
                          : totalDiff > 0 
                            ? 'text-emerald-600' 
                            : 'text-gray-400'
                      }`}>
                        {totalDiff === 0 ? 'Sem Desvios' : (totalDiff > 0 ? `+${totalDiff}` : `${totalDiff}`)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
