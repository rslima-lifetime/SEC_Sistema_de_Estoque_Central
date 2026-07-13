import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Upload, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle,
  FileSpreadsheet,
  Package,
  Pencil,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { dbService } from '../services/db';
import type { Product } from '../services/db';

export const EstoqueCentral: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sorting state
  const [sortField, setSortField] = useState<'name' | 'unit' | 'initialStock' | 'entries' | 'exits' | 'finalStock'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: 'name' | 'unit' | 'initialStock' | 'entries' | 'exits' | 'finalStock') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field: 'name' | 'unit' | 'initialStock' | 'entries' | 'exits' | 'finalStock') => {
    if (sortField !== field) {
      return <ArrowUpDown size={12} className="ml-1.5 text-gray-400 group-hover/header:text-gray-600 transition-colors inline-block" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp size={12} className="ml-1.5 text-amber-500 inline-block" /> 
      : <ArrowDown size={12} className="ml-1.5 text-amber-500 inline-block" />;
  };

  // Form states for new product
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('unidade');
  const [initialStock, setInitialStock] = useState('0');

  // Form states for editing product
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editUnit, setEditUnit] = useState('unidade');
  const [editInitialStock, setEditInitialStock] = useState('0');

  // Modal error state (validation / duplicates)
  const [modalError, setModalError] = useState<string | null>(null);

  // Custom delete confirmation modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await dbService.getProducts();
      setProducts(data);
    } catch (error) {
      showToast('error', 'Falha ao carregar produtos do estoque.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!name.trim()) {
      setModalError('Nome do produto é obrigatório.');
      return;
    }

    const exists = products.some(p => p.name.trim().toLowerCase() === name.trim().toLowerCase());
    if (exists) {
      setModalError('Este produto já está cadastrado no Estoque Central.');
      return;
    }

    try {
      await dbService.addProduct(name, unit, Number(initialStock.replace(',', '.')) || 0);
      showToast('success', 'Produto cadastrado com sucesso!');
      setIsModalOpen(false);
      setName('');
      setUnit('unidade');
      setInitialStock('0');
      setModalError(null);
      fetchProducts();
    } catch (error) {
      showToast('error', 'Erro ao cadastrar produto.');
    }
  };

  const handleEditClick = (p: Product) => {
    setEditingProduct(p);
    setEditName(p.name);
    setEditUnit(p.unit);
    setEditInitialStock(p.initialStock.toString());
    setModalError(null);
    setIsEditModalOpen(true);
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!editingProduct) return;
    if (!editName.trim()) {
      setModalError('Nome do produto é obrigatório.');
      return;
    }

    const exists = products.some(p => p.id !== editingProduct.id && p.name.trim().toLowerCase() === editName.trim().toLowerCase());
    if (exists) {
      setModalError('Outro produto já utiliza este nome no Estoque Central.');
      return;
    }

    try {
      await dbService.updateProduct(editingProduct.id, editName, editUnit, Number(editInitialStock.replace(',', '.')) || 0);
      showToast('success', 'Produto atualizado com sucesso!');
      setIsEditModalOpen(false);
      setEditingProduct(null);
      setEditName('');
      setEditInitialStock('0');
      setModalError(null);
      fetchProducts();
    } catch (error) {
      showToast('error', 'Erro ao atualizar produto.');
    }
  };

  const handleDeleteClick = (p: Product) => {
    setProductToDelete(p);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      await dbService.deleteProduct(productToDelete.id);
      showToast('success', 'Produto excluído com sucesso!');
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (error: any) {
      showToast('error', error.message || 'Erro ao excluir o produto.');
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        const rows = text.split('\n').map((row) => row.trim()).filter((row) => row.length > 0);
        
        // Skip header
        const parsedItems: { name: string; unit: string; initialStock: number }[] = [];
        
        for (let i = 1; i < rows.length; i++) {
          // Parse CSV row by splitting by comma or semicolon
          const columns = rows[i].split(/[;,]/).map(col => col.replace(/^["']|["']$/g, '').trim());
          if (columns.length >= 3) {
            const pName = columns[0];
            const pUnit = columns[1];
            const pStock = parseFloat(columns[2].replace(',', '.')) || 0;
            
            if (pName && pUnit && !isNaN(pStock)) {
              parsedItems.push({
                name: pName,
                unit: pUnit,
                initialStock: pStock
              });
            }
          }
        }

        if (parsedItems.length === 0) {
          showToast('error', 'Nenhum dado válido encontrado no arquivo CSV.');
          return;
        }

        await dbService.importProductsFromCSV(parsedItems);
        showToast('success', `${parsedItems.length} produtos importados com sucesso!`);
        setIsImportOpen(false);
        fetchProducts();
      } catch (err) {
        showToast('error', 'Falha ao processar arquivo CSV. Verifique o formato.');
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalSKUs = products.length;
  const totalStockQty = products.reduce((acc, p) => acc + p.finalStock, 0);
  const lowStockAlerts = products.filter(p => p.finalStock <= 50).length;

  return (
    <div className="space-y-6">
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

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total de SKUs</span>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{totalSKUs}</h3>
            <span className="text-xs text-gray-400 mt-1 block">Itens cadastrados</span>
          </div>
          <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
            <FileSpreadsheet size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Quantidade Total em Estoque</span>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{totalStockQty.toLocaleString()}</h3>
            <span className="text-xs text-gray-400 mt-1 block">Unidades agregadas</span>
          </div>
          <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
            <Package size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Alertas de Estoque Baixo</span>
            <h3 className={`text-3xl font-bold mt-1 ${lowStockAlerts > 0 ? 'text-amber-600' : 'text-gray-900'}`}>{lowStockAlerts}</h3>
            <span className="text-xs text-gray-400 mt-1 block">Saldo de 50 ou menos unidades</span>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${lowStockAlerts > 0 ? 'bg-amber-50 text-amber-500 animate-pulse' : 'bg-gray-50 text-gray-400'}`}>
            <AlertCircle size={24} />
          </div>
        </div>
      </div>

      {/* Tabela & Controles */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Barra de Filtros e Ações */}
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Pesquisar produto no estoque central..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:border-transparent transition-all"
            />
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsImportOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors"
            >
              <Upload size={16} />
              <span>Importar CSV</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-accent-yellow text-gray-900 rounded-xl text-sm font-bold shadow-sm hover:brightness-95 transition-all"
            >
              <Plus size={16} />
              <span>Novo Produto</span>
            </button>
          </div>
        </div>

        {/* Grid de Posição de Estoque */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center text-gray-500 text-sm">Carregando dados do estoque central...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center text-gray-400 text-sm">Nenhum produto cadastrado ou correspondente à busca.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider select-none">
                  <th 
                    onClick={() => handleSort('name')}
                    className="py-4 px-6 cursor-pointer hover:bg-gray-100/50 transition-colors group/header"
                  >
                    <div className="flex items-center">
                      <span>Produto</span>
                      {renderSortIcon('name')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('unit')}
                    className="py-4 px-6 text-center cursor-pointer hover:bg-gray-100/50 transition-colors group/header"
                  >
                    <div className="flex items-center justify-center">
                      <span>Unidade de Medida</span>
                      {renderSortIcon('unit')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('initialStock')}
                    className="py-4 px-6 text-right cursor-pointer hover:bg-gray-100/50 transition-colors group/header"
                  >
                    <div className="flex items-center justify-end">
                      <span>Estoque Inicial</span>
                      {renderSortIcon('initialStock')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('entries')}
                    className="py-4 px-6 text-right text-emerald-600 cursor-pointer hover:bg-emerald-50/50 transition-colors group/header"
                  >
                    <div className="flex items-center justify-end">
                      <span>Entradas (+)</span>
                      {renderSortIcon('entries')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('exits')}
                    className="py-4 px-6 text-right text-rose-600 cursor-pointer hover:bg-rose-50/50 transition-colors group/header"
                  >
                    <div className="flex items-center justify-end">
                      <span>Saídas (-)</span>
                      {renderSortIcon('exits')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('finalStock')}
                    className="py-4 px-6 text-right font-bold text-gray-900 bg-amber-50 bg-opacity-30 border-l border-r border-amber-100 cursor-pointer hover:bg-amber-100/30 transition-colors group/header"
                  >
                    <div className="flex items-center justify-end">
                      <span>Estoque Final (Saldo)</span>
                      {renderSortIcon('finalStock')}
                    </div>
                  </th>
                  <th className="py-4 px-6 text-center w-28">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {sortedProducts.map((p) => {
                  const isLow = p.finalStock <= 50;
                  const isZero = p.finalStock === 0;

                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="py-4 px-6 font-medium text-gray-900 group-hover:text-amber-700 transition-colors">
                        {p.name}
                      </td>
                      <td className="py-4 px-6 text-center text-gray-500">
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md font-medium">
                          {p.unit}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right text-gray-500">
                        {p.initialStock.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-right text-emerald-600 font-medium">
                        +{p.entries.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-right text-rose-600 font-medium">
                        -{p.exits.toLocaleString()}
                      </td>
                      <td className={`py-4 px-6 text-right font-bold bg-amber-50 bg-opacity-20 border-l border-r border-amber-50 ${
                        isZero 
                          ? 'text-rose-600 bg-rose-50 bg-opacity-25' 
                          : isLow 
                            ? 'text-amber-600' 
                            : 'text-gray-900'
                      }`}>
                        <div className="flex items-center justify-end space-x-2">
                          <span>{p.finalStock.toLocaleString()}</span>
                          {isLow && (
                            <span className={`w-1.5 h-1.5 rounded-full ${isZero ? 'bg-rose-500' : 'bg-amber-500'}`} />
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleEditClick(p)}
                            className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-gray-900 rounded-lg transition-colors"
                            title="Editar Produto"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(p)}
                            className="p-1.5 hover:bg-rose-50 text-gray-500 hover:text-rose-600 rounded-lg transition-colors"
                            title="Excluir Produto"
                          >
                            <Trash2 size={15} />
                          </button>
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

      {/* Modal: Novo Produto */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h4 className="font-bold text-gray-900">Cadastrar Novo Produto</h4>
              <button 
                onClick={() => { setIsModalOpen(false); setModalError(null); }}
                className="text-gray-400 hover:text-gray-600 text-lg font-medium"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Nome do Produto</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pão de Hamburguer Australiano"
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (modalError) setModalError(null); }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:border-transparent transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Unidade de Medida</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:border-transparent transition-all"
                  >
                    <option value="unidade">Unidade</option>
                    <option value="kg">Quilo (kg)</option>
                    <option value="litro">Litro (l)</option>
                    <option value="caixa">Caixa</option>
                    <option value="pacote">Pacote</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Estoque Inicial</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={initialStock}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d*([.,]\d*)?$/.test(val)) {
                        setInitialStock(val);
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {modalError && (
                <div className="flex items-center space-x-2 text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-xl text-xs">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setModalError(null); }}
                  className="px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-accent-yellow text-gray-900 rounded-xl text-sm font-bold shadow-sm hover:brightness-95 transition-all"
                >
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Importação CSV */}
      {isImportOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h4 className="font-bold text-gray-900">Importação em Lote via CSV</h4>
              <button 
                onClick={() => setIsImportOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-medium"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl text-xs space-y-2">
                <div className="flex items-center space-x-2 font-semibold">
                  <HelpCircle size={14} className="text-blue-500" />
                  <span>Instruções de Formatação do Arquivo CSV</span>
                </div>
                <p>O arquivo deve possuir cabeçalho na primeira linha e as colunas separadas por vírgula (,) ou ponto e vírgula (;). Estrutura obrigatória das colunas:</p>
                <pre className="bg-white bg-opacity-65 p-2 rounded border border-blue-100 font-mono text-[10px] select-all">
                  Produto, Unidade, EstoqueInicial{"\n"}
                  Pão de Hambúrguer Brioche, unidade, 1000{"\n"}
                  Blend de Carne 150g, kg, 250
                </pre>
              </div>

              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-8 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <Upload size={32} className="text-gray-400 mb-2" />
                <span className="text-sm font-semibold text-gray-700">Selecione o arquivo do computador</span>
                <span className="text-xs text-gray-400 mt-1">Apenas arquivos .csv</span>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv"
                  onChange={handleImportCSV}
                  className="hidden"
                />
              </div>

              <div className="pt-4 flex justify-end border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Produto */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h4 className="font-bold text-gray-900">Editar Produto</h4>
              <button 
                onClick={() => { setIsEditModalOpen(false); setEditingProduct(null); setModalError(null); }}
                className="text-gray-400 hover:text-gray-600 text-lg font-medium"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleEditProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Nome do Produto</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => { setEditName(e.target.value); if (modalError) setModalError(null); }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:border-transparent transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Unidade de Medida</label>
                  <select
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:border-transparent transition-all"
                  >
                    <option value="unidade">Unidade</option>
                    <option value="kg">Quilo (kg)</option>
                    <option value="litro">Litro (l)</option>
                    <option value="caixa">Caixa</option>
                    <option value="pacote">Pacote</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Estoque Inicial</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editInitialStock}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d*([.,]\d*)?$/.test(val)) {
                        setEditInitialStock(val);
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {modalError && (
                <div className="flex items-center space-x-2 text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-xl text-xs">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => { setIsEditModalOpen(false); setEditingProduct(null); setModalError(null); }}
                  className="px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-accent-yellow text-gray-900 rounded-xl text-sm font-bold shadow-sm hover:brightness-95 transition-all"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmação de Exclusão */}
      {isDeleteModalOpen && productToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-gray-100 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3 text-rose-600">
              <AlertCircle size={24} className="flex-shrink-0" />
              <h4 className="font-bold text-gray-900">Confirmar Exclusão</h4>
            </div>
            <p className="text-sm text-gray-600">
              Tem certeza de que deseja excluir o produto <strong>{productToDelete.name}</strong>? Esta ação não poderá ser desfeita.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => { setIsDeleteModalOpen(false); setProductToDelete(null); }}
                className="px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-50 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteProduct}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all"
              >
                Excluir Produto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
