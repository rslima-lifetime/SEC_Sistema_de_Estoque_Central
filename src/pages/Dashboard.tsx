import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  CalendarDays, 
  TrendingUp, 
  Store, 
  Sparkles
} from 'lucide-react';
import { dbService } from '../services/db';
import type { Movement } from '../services/db';

export const Dashboard: React.FC = () => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [filterPeriod, setFilterPeriod] = useState<'week' | 'month'>('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovements = async () => {
      setLoading(true);
      try {
        const data = await dbService.getMovements();
        setMovements(data);
      } catch (error) {
        console.error('Error loading movements for dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMovements();
  }, []);

  // Filtering movements based on date & distribution status
  const getFilteredMovements = () => {
    // Keep only exits that are distribution shipments
    const distExits = movements.filter(m => m.type === 'Saída' && m.isDistribution && m.destination);
    
    const today = new Date();
    
    return distExits.filter(m => {
      const movDate = new Date(m.date);
      const diffTime = Math.abs(today.getTime() - movDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (filterPeriod === 'week') {
        // filter movements in the last 7 days
        return diffDays <= 7;
      } else {
        // filter movements in the last 30 days
        return diffDays <= 30;
      }
    });
  };

  const filteredMovs = getFilteredMovements();

  // 1. Calculate totals per destination
  const destTotals: { [dest: string]: number } = {};
  filteredMovs.forEach(m => {
    if (m.destination) {
      destTotals[m.destination] = (destTotals[m.destination] || 0) + m.quantity;
    }
  });

  // Ensure all 9 destinations are listed, even if 0
  const allDestinations = [
    'Tijuca', 'Méier', 'Botafogo', 'Barra', 'Recreio', 'Freguesia', 'Campo Grande', 'Centro', 'Produção'
  ];
  const chartData = allDestinations.map(dest => ({
    name: dest,
    value: destTotals[dest] || 0
  })).sort((a, b) => b.value - a.value); // sort by volume descending

  // 2. Calculate top consumed items
  const itemTotals: { [itemName: string]: { qty: number; unit: string } } = {};
  filteredMovs.forEach(m => {
    if (!itemTotals[m.productName]) {
      // Find unit from movements or default
      itemTotals[m.productName] = { qty: 0, unit: 'unidade' };
    }
    itemTotals[m.productName].qty += m.quantity;
  });

  const topItems = Object.entries(itemTotals)
    .map(([name, data]) => ({ name, quantity: data.qty, unit: data.unit }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5); // top 5

  // KPIs calculations
  const totalShipped = chartData.reduce((acc, c) => acc + c.value, 0);
  
  const leaderDest = chartData[0]?.value > 0 ? chartData[0] : { name: 'Nenhum', value: 0 };
  const leaderItem = topItems[0] ? topItems[0] : { name: 'Nenhum', quantity: 0, unit: '' };

  // Chart rendering properties (SVG-based)
  const maxChartValue = Math.max(...chartData.map(c => c.value), 10);

  return (
    <div className="space-y-6">
      {/* Filtro e Título */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="font-bold text-gray-900 text-lg">Inteligência de Consumo</h2>
          <p className="text-xs text-gray-500 mt-0.5">Visão analítica dos insumos distribuídos para lojas e produção.</p>
        </div>

        <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setFilterPeriod('week')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              filterPeriod === 'week'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <CalendarDays size={14} />
            <span>Semana Corrente</span>
          </button>
          <button
            onClick={() => setFilterPeriod('month')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              filterPeriod === 'month'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <CalendarDays size={14} />
            <span>Mês Corrente</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Distribuído</span>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{totalShipped.toLocaleString()}</h3>
            <span className="text-xs text-gray-400 mt-1 block">Insumos despachados</span>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-accent-yellow flex items-center justify-center rounded-xl font-bold text-lg">
            🍔
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Maior Consumidor</span>
            <h3 className="text-xl font-bold text-gray-900 mt-1 truncate max-w-[180px]">{leaderDest.name}</h3>
            <span className="text-xs text-gray-400 mt-1 block">{leaderDest.value.toLocaleString()} unidades recebidas</span>
          </div>
          <div className="w-12 h-12 bg-gray-50 text-gray-500 flex items-center justify-center rounded-xl">
            <Store size={22} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Insumo Mais Enviado</span>
            <h3 className="text-base font-bold text-gray-900 mt-1 truncate max-w-[180px]" title={leaderItem.name}>{leaderItem.name}</h3>
            <span className="text-xs text-gray-400 mt-1 block">{leaderItem.quantity.toLocaleString()} enviado</span>
          </div>
          <div className="w-12 h-12 bg-gray-50 text-gray-500 flex items-center justify-center rounded-xl">
            <TrendingUp size={22} />
          </div>
        </div>
      </div>

      {/* Grid de Gráficos e Detalhes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Consumo por Destino */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
            <h3 className="font-bold text-gray-900 text-sm flex items-center space-x-2">
              <BarChart3 size={16} className="text-gray-400" />
              <span>Volume de Insumos por Destino</span>
            </h3>
          </div>

          {loading ? (
            <div className="py-20 text-center text-gray-500 text-sm">Carregando dados...</div>
          ) : totalShipped === 0 ? (
            <div className="py-20 text-center text-gray-400 text-sm">Sem dados de envios no período selecionado.</div>
          ) : (
            <div className="space-y-4">
              {chartData.map((item, idx) => {
                const percentage = (item.value / maxChartValue) * 100;
                
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700">{item.name}</span>
                      <span className="font-bold text-gray-900">
                        {item.value.toLocaleString()} <span className="text-[10px] text-gray-400 font-normal">({((item.value / (totalShipped || 1)) * 100).toFixed(0)}%)</span>
                      </span>
                    </div>
                    
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.name === 'Produção' 
                            ? 'bg-gray-400' 
                            : idx === 0 
                              ? 'bg-accent-yellow' 
                              : 'bg-yellow-300'
                        }`}
                        style={{ width: `${Math.max(2, percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Itens mais consumidos */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm lg:col-span-1">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
            <h3 className="font-bold text-gray-900 text-sm flex items-center space-x-2">
              <Sparkles size={16} className="text-gray-400" />
              <span>Insumos Críticos Despachados</span>
            </h3>
          </div>

          {loading ? (
            <div className="py-20 text-center text-gray-500 text-sm">Carregando itens...</div>
          ) : topItems.length === 0 ? (
            <div className="py-20 text-center text-gray-400 text-sm">Nenhum envio registrado.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {topItems.map((item, idx) => (
                <div key={item.name} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <span className="text-xs font-bold text-gray-400 w-5">#{idx + 1}</span>
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-gray-800 truncate" title={item.name}>{item.name}</h4>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-900">{item.quantity.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
