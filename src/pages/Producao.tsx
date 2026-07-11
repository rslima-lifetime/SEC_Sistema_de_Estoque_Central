import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import type { Product } from '../services/db';
import { Search, Printer, Package, CheckCircle2 } from 'lucide-react';

export const Producao: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductionProducts();
  }, []);

  const fetchProductionProducts = async () => {
    try {
      setLoading(true);
      const allProducts = await dbService.getProducts();
      // Filter only products that have a weekly production target
      const filtered = allProducts.filter(p => (p.productionTarget || 0) > 0);
      
      // Sort products by production target descending (largest targets first)
      filtered.sort((a, b) => (b.productionTarget || 0) - (a.productionTarget || 0));
      
      setProducts(filtered);
    } catch (error) {
      console.error('Error fetching production products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter list by search term
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Central de Produção</h2>
          <p className="text-sm text-gray-500 mt-1">Metas semanais de fabricação e separação de insumos.</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-sm font-semibold shadow-sm transition-all"
            title="Imprimir Ficha de Produção"
          >
            <Printer size={16} />
            <span>Imprimir Ficha</span>
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-2.5 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Pesquisar insumo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:border-transparent transition-all"
          />
        </div>
        
        <div className="text-xs text-gray-400 font-medium">
          Total de Itens na Central: <span className="text-gray-900 font-bold">{filteredProducts.length}</span>
        </div>
      </div>

      {/* Production List Sheet */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden print:border-none print:shadow-none">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-8 h-8 border-4 border-accent-yellow border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-500 font-medium">Carregando lista de fabricação...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center">
              <Package size={24} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-900">Nenhum insumo programado</p>
              <p className="text-xs text-gray-400 mt-1">Nenhum produto possui meta de produção semanal cadastrada.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Item de Insumo</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Unidade</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Meta Semanal Central</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-center print:hidden">Status Sugerido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((p) => {
                  const target = p.productionTarget || 0;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-2.5 h-2.5 rounded-full bg-accent-yellow shadow-sm flex-shrink-0" />
                          <span className="text-sm font-semibold text-gray-900">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center whitespace-nowrap text-sm text-gray-500 capitalize">
                        {p.unit}
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <span className="text-sm font-black text-gray-900 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                          {target.toLocaleString('pt-BR')}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center whitespace-nowrap print:hidden">
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100">
                          <CheckCircle2 size={12} />
                          <span>Separar / Produzir</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
