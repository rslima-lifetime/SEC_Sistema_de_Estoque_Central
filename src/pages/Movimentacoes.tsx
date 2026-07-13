import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  AlertCircle,
  CheckCircle2,
  Truck,
  History
} from 'lucide-react';
import { dbService } from '../services/db';
import type { Product, Movement } from '../services/db';

export const Movimentacoes: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<'Entrada' | 'Saída'>('Entrada');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodsData, movsData] = await Promise.all([
        dbService.getProducts(),
        dbService.getMovements(),
      ]);
      setProducts(prodsData);
      setMovements(movsData);
      
      // Pre-select first product if available
      if (prodsData.length > 0 && !productId) {
        setProductId(prodsData[0].id);
      }
    } catch (error) {
      showToast('error', 'Erro ao carregar dados do banco de dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      showToast('error', 'Por favor, selecione um produto.');
      return;
    }
    const parsedQty = parseFloat(quantity.replace(',', '.')) || 0;
    if (parsedQty <= 0) {
      showToast('error', 'A quantidade deve ser maior que zero.');
      return;
    }

    // Verify stock availability on exit
    if (type === 'Saída') {
      const selectedProd = products.find(p => p.id === productId);
      if (selectedProd && selectedProd.finalStock < parsedQty) {
        showToast('error', `Estoque insuficiente! Saldo atual do item: ${selectedProd.finalStock} ${selectedProd.unit}(s).`);
        return;
      }
    }

    try {
      await dbService.addMovement(productId, type, parsedQty, date);
      showToast('success', 'Movimentação registrada com sucesso!');
      setQuantity('');
      fetchData(); // refresh list and updated stock levels
    } catch (err) {
      showToast('error', 'Erro ao registrar movimentação.');
    }
  };

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

      {/* Painel de Lançamento */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden sticky top-8">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex items-center space-x-2">
            <div className="p-2 bg-accent-yellow bg-opacity-20 text-gray-900 rounded-lg">
              <Plus size={18} />
            </div>
            <h2 className="font-bold text-gray-900 text-base">Nova Movimentação</h2>
          </div>

          <form onSubmit={handleSaveMovement} className="p-6 space-y-5">
            {/* Tipo de Operação Radio Group */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tipo de Lançamento</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setType('Entrada')}
                  className={`flex items-center justify-center space-x-2 py-3 rounded-xl border text-sm font-semibold transition-all ${
                    type === 'Entrada'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <ArrowDownLeft size={16} className={type === 'Entrada' ? 'text-emerald-600' : 'text-gray-400'} />
                  <span>Entrada</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType('Saída')}
                  className={`flex items-center justify-center space-x-2 py-3 rounded-xl border text-sm font-semibold transition-all ${
                    type === 'Saída'
                      ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-sm'
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <ArrowUpRight size={16} className={type === 'Saída' ? 'text-rose-600' : 'text-gray-400'} />
                  <span>Saída</span>
                </button>
              </div>
            </div>

            {/* Data input */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Data do Lançamento</label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Produto Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Produto</label>
              {products.length === 0 ? (
                <div className="text-xs text-rose-500 bg-rose-50 p-3 rounded-lg flex items-center space-x-1">
                  <AlertCircle size={14} />
                  <span>Nenhum produto cadastrado no estoque central. Cadastre primeiro!</span>
                </div>
              ) : (
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:border-transparent transition-all"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.unit}) - Saldo: {p.finalStock}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Quantidade */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Quantidade</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder="Digite o volume"
                  value={quantity}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d*([.,]\d*)?$/.test(val)) {
                      setQuantity(val);
                    }
                  }}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={products.length === 0}
              className="w-full py-3 bg-accent-yellow text-gray-900 rounded-xl text-sm font-bold shadow-sm hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
            >
              <span>Confirmar Registro</span>
            </button>
          </form>
        </div>
      </div>

      {/* Histórico Pane */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center space-x-2">
            <div className="p-2 bg-gray-50 text-gray-500 rounded-lg">
              <History size={18} />
            </div>
            <h2 className="font-bold text-gray-900 text-base">Histórico de Movimentações</h2>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 text-center text-gray-500 text-sm">Carregando histórico...</div>
            ) : movements.length === 0 ? (
              <div className="py-20 text-center text-gray-400 text-sm">Nenhuma movimentação registrada.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="py-4 px-6">Data</th>
                    <th className="py-4 px-6">Tipo</th>
                    <th className="py-4 px-6">Produto</th>
                    <th className="py-4 px-6 text-right">Quantidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {movements.map((mov) => {
                    const isEntry = mov.type === 'Entrada';
                    const isDistribution = mov.isDistribution;

                    return (
                      <tr key={mov.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6 text-gray-500 whitespace-nowrap">
                          {mov.date}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            isEntry
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                              : 'bg-rose-50 text-rose-800 border border-rose-100'
                          }`}>
                            {isEntry ? (
                              <>
                                <ArrowDownLeft size={12} className="text-emerald-500" />
                                <span>Entrada</span>
                              </>
                            ) : (
                              <>
                                <ArrowUpRight size={12} className="text-rose-500" />
                                <span>Saída</span>
                              </>
                            )}
                            
                            {/* Auto distribution tag */}
                            {isDistribution && (
                              <span className="ml-1 pl-1 border-l border-rose-200 text-rose-500 flex items-center" title={`Envio Automático para ${mov.destination}`}>
                                <Truck size={10} className="mr-0.5" />
                                <span>{mov.destination}</span>
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-medium text-gray-900">
                          {mov.productName}
                        </td>
                        <td className={`py-4 px-6 text-right font-bold ${isEntry ? 'text-emerald-600' : 'text-gray-900'}`}>
                          {isEntry ? '+' : '-'}{mov.quantity.toLocaleString()}
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
    </div>
  );
};
