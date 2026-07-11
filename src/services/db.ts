import { mockDb } from './mockDb';
import type { Product, Movement, DistributionWeek, AuditRecord } from './mockDb';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  setDoc, 
  deleteDoc,
  doc, 
  query, 
  orderBy, 
  runTransaction 
} from 'firebase/firestore';

// Environment variables checks
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let useMock = true;
let firestoreDb: any = null;
let firebaseAuth: any = null;

const hasFirebaseKeys = 
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.appId;

if (hasFirebaseKeys) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    firestoreDb = getFirestore(app);
    firebaseAuth = getAuth(app);
    useMock = false;
    console.log('SEC: Conectado com sucesso ao Firebase Firestore & Auth.');
  } catch (error) {
    console.error('SEC: Erro ao inicializar o Firebase. Ativando Modo Simulador.', error);
    useMock = true;
  }
} else {
  console.log('SEC: Credenciais do Firebase ausentes no arquivo .env. Executando em Modo Simulador (LocalStorage).');
  useMock = true;
}

let cacheProducts: Product[] | null = null;
let cacheMovements: Movement[] | null = null;
let cacheDistributions: DistributionWeek[] | null = null;
let cacheAudits: AuditRecord[] | null = null;

export const dbService = {
  isMock(): boolean {
    return useMock;
  },

  // Authentication Helpers
  async registerUser(email: string, password: string): Promise<void> {
    if (useMock) {
      const usersRaw = localStorage.getItem('sec_mock_users');
      const users = usersRaw ? JSON.parse(usersRaw) : {};
      users[email.trim().toLowerCase()] = password;
      localStorage.setItem('sec_mock_users', JSON.stringify(users));
      return;
    }
    await createUserWithEmailAndPassword(firebaseAuth, email, password);
  },

  async loginUser(email: string, password: string): Promise<boolean> {
    const normalizedEmail = email.trim().toLowerCase();
    
    // Always allow emergency fallback credentials
    const defaultEmail = 'admin@vacaburguer.com';
    const defaultPassword = 'admin123';
    if (normalizedEmail === defaultEmail && password === defaultPassword) {
      return true;
    }

    if (useMock) {
      const usersRaw = localStorage.getItem('sec_mock_users');
      const users = usersRaw ? JSON.parse(usersRaw) : {};
      return users[normalizedEmail] === password;
    }

    await signInWithEmailAndPassword(firebaseAuth, email, password);
    return true;
  },

  async changePassword(newPassword: string): Promise<void> {
    if (useMock) {
      const email = sessionStorage.getItem('sec_user_email') || 'admin@vacaburguer.com';
      const usersRaw = localStorage.getItem('sec_mock_users');
      const users = usersRaw ? JSON.parse(usersRaw) : {};
      users[email.trim().toLowerCase()] = newPassword;
      localStorage.setItem('sec_mock_users', JSON.stringify(users));
      return;
    }
    const user = firebaseAuth.currentUser;
    if (user) {
      await updatePassword(user, newPassword);
    } else {
      throw new Error('Nenhum usuário autenticado no Firebase.');
    }
  },

  // Products
  async getProducts(): Promise<Product[]> {
    if (cacheProducts !== null) {
      return cacheProducts;
    }
    if (useMock) {
      cacheProducts = mockDb.getProducts();
      return cacheProducts;
    }
    try {
      const q = query(collection(firestoreDb, 'products'));
      const snapshot = await getDocs(q);
      const list: Product[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Product);
      });
      
      // If Firestore is empty or contains the old initial seed data (< 20 items), reset it with the 222 items
      if (list.length < 20) {
        console.log('SEC: Firestore com dados antigos ou vazio. Atualizando com os 222 produtos reais...');
        
        // Delete old items if they exist
        for (const oldItem of list) {
          try {
            await deleteDoc(doc(firestoreDb, 'products', oldItem.id));
          } catch (e) {
            console.error('Erro ao deletar item antigo:', oldItem.name, e);
          }
        }
        
        // Seed the database with the new products
        const defaults = mockDb.getProducts();
        const newList: Product[] = [];
        for (const item of defaults) {
          const { id, ...rest } = item;
          await setDoc(doc(firestoreDb, 'products', id), rest);
          newList.push(item);
        }
        cacheProducts = newList;
        return newList;
      }
      cacheProducts = list;
      return list;
    } catch (error) {
      console.error('Error fetching products from Firestore, falling back to mock:', error);
      cacheProducts = mockDb.getProducts();
      return cacheProducts;
    }
  },

  async addProduct(name: string, unit: string, initialStock: number): Promise<Product> {
    cacheProducts = null;
    if (useMock) {
      return mockDb.addProduct(name, unit, initialStock);
    }
    const newProduct = {
      name,
      unit,
      initialStock,
      entries: 0,
      exits: 0,
      finalStock: initialStock,
    };
    const docRef = await addDoc(collection(firestoreDb, 'products'), newProduct);
    return { id: docRef.id, ...newProduct };
  },

  async updateProduct(id: string, name: string, unit: string): Promise<Product> {
    cacheProducts = null;
    if (useMock) {
      return mockDb.updateProduct(id, name, unit);
    }
    const productRef = doc(firestoreDb, 'products', id);
    const updatedFields = { name, unit };
    const products = await this.getProducts();
    const existing = products.find(p => p.id === id);
    if (!existing) {
      throw new Error('Produto não encontrado');
    }
    await setDoc(productRef, updatedFields, { merge: true });
    return { ...existing, ...updatedFields };
  },

  async deleteProduct(id: string): Promise<void> {
    cacheProducts = null;
    if (useMock) {
      return mockDb.deleteProduct(id);
    }
    const products = await this.getProducts();
    const existing = products.find(p => p.id === id);
    if (!existing) {
      throw new Error('Produto não encontrado');
    }
    if (existing.entries > 0 || existing.exits > 0) {
      throw new Error('Não é possível excluir um produto com movimentações.');
    }
    const productRef = doc(firestoreDb, 'products', id);
    await deleteDoc(productRef);
  },

  async importProductsFromCSV(importedItems: { name: string; unit: string; initialStock: number }[]): Promise<Product[]> {
    cacheProducts = null;
    if (useMock) {
      return mockDb.importProductsFromCSV(importedItems);
    }
    const created: Product[] = [];
    for (const item of importedItems) {
      const prod = await this.addProduct(item.name, item.unit, item.initialStock);
      created.push(prod);
    }
    return created;
  },

  // Movements
  async getMovements(): Promise<Movement[]> {
    if (cacheMovements !== null) {
      return cacheMovements;
    }
    if (useMock) {
      cacheMovements = mockDb.getMovements();
      return cacheMovements;
    }
    try {
      const q = query(collection(firestoreDb, 'movements'), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      const list: Movement[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Movement);
      });

      // Self-healing migration: check if there are movements from the old products list
      const products = await this.getProducts();
      const productIds = new Set(products.map(p => p.id));
      const hasStale = list.some(mov => !productIds.has(mov.productId));

      if (hasStale) {
        console.log('SEC: Detectadas movimentações antigas no Firestore. Limpando histórico...');
        for (const mov of list) {
          try {
            await deleteDoc(doc(firestoreDb, 'movements', mov.id));
          } catch (e) {
            console.error('Erro ao deletar movimentação antiga:', mov.id, e);
          }
        }
        list.length = 0;
      }

      cacheMovements = list;
      return list;
    } catch (error) {
      console.error('Error fetching movements from Firestore:', error);
      cacheMovements = mockDb.getMovements();
      return cacheMovements;
    }
  },

  async addMovement(
    productId: string, 
    type: 'Entrada' | 'Saída', 
    quantity: number, 
    date: string, 
    details?: { isDistribution?: boolean; destination?: string }
  ): Promise<Movement> {
    cacheProducts = null;
    cacheMovements = null;
    if (useMock) {
      return mockDb.addMovement(productId, type, quantity, date, details);
    }

    // Run in a Transaction to update product values correctly
    const movementRef = collection(firestoreDb, 'movements');
    const productRef = doc(firestoreDb, 'products', productId);

    let productName = '';
    const newMovement = {
      date,
      type,
      productId,
      productName: '',
      quantity,
      isDistribution: details?.isDistribution || false,
      destination: details?.destination || null,
    };

    await runTransaction(firestoreDb, async (transaction) => {
      const productDoc = await transaction.get(productRef);
      if (!productDoc.exists()) {
        throw new Error('Produto não existe no Firestore!');
      }

      const prodData = productDoc.data();
      productName = prodData.name;
      newMovement.productName = productName;

      let newEntries = prodData.entries || 0;
      let newExits = prodData.exits || 0;

      if (type === 'Entrada') {
        newEntries += quantity;
      } else {
        newExits += quantity;
      }

      const newFinalStock = (prodData.initialStock || 0) + newEntries - newExits;

      transaction.update(productRef, {
        entries: newEntries,
        exits: newExits,
        finalStock: newFinalStock,
      });
    });

    const docRef = await addDoc(movementRef, newMovement);
    return { id: docRef.id, ...newMovement } as Movement;
  },

  // Distributions
  async getDistributions(): Promise<DistributionWeek[]> {
    if (cacheDistributions !== null) {
      return cacheDistributions;
    }
    if (useMock) {
      cacheDistributions = mockDb.getDistributions();
      return cacheDistributions;
    }
    try {
      const q = query(collection(firestoreDb, 'distributions'));
      const snapshot = await getDocs(q);
      const list: DistributionWeek[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as DistributionWeek);
      });

      if (list.length === 0) {
        const defaults = mockDb.getDistributions();
        for (const item of defaults) {
          const { id, ...rest } = item;
          await setDoc(doc(firestoreDb, 'distributions', id), rest);
          list.push(item);
        }
      }
      cacheDistributions = list;
      return list;
    } catch (error) {
      console.error('Error fetching distributions from Firestore:', error);
      cacheDistributions = mockDb.getDistributions();
      return cacheDistributions;
    }
  },

  async saveDistribution(destination: string, items: { [productId: string]: { [day: string]: number } }): Promise<DistributionWeek> {
    cacheDistributions = null;
    if (useMock) {
      return mockDb.saveDistribution(destination, items);
    }
    
    // Check if there is already a pending distribution for this destination
    const q = query(collection(firestoreDb, 'distributions'));
    const snapshot = await getDocs(q);
    let existingId = '';
    
    snapshot.forEach((d) => {
      const data = d.data();
      if (data.destination === destination && data.status === 'Pendente') {
        existingId = d.id;
      }
    });

    const newDist = {
      destination,
      items,
      status: 'Pendente' as const,
    };

    if (existingId) {
      await setDoc(doc(firestoreDb, 'distributions', existingId), newDist);
      return { id: existingId, ...newDist };
    } else {
      const docRef = await addDoc(collection(firestoreDb, 'distributions'), newDist);
      return { id: docRef.id, ...newDist };
    }
  },

  async confirmDistribution(distId: string): Promise<DistributionWeek> {
    cacheProducts = null;
    cacheMovements = null;
    cacheDistributions = null;
    if (useMock) {
      return mockDb.confirmDistribution(distId);
    }

    const distRef = doc(firestoreDb, 'distributions', distId);
    const distributions = await this.getDistributions();
    const target = distributions.find(d => d.id === distId);
    if (!target) {
      throw new Error('Distribuição não encontrada!');
    }

    if (target.status === 'Confirmado') {
      return target;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Subtrack from central stock for all items
    for (const [productId, dayData] of Object.entries(target.items)) {
      const totalQty = Object.values(dayData).reduce((sum, val) => sum + (val || 0), 0);
      if (totalQty > 0) {
        await this.addMovement(productId, 'Saída', totalQty, todayStr, {
          isDistribution: true,
          destination: target.destination,
        });
      }
    }

    const updated = {
      ...target,
      status: 'Confirmado' as const,
      confirmedAt: new Date().toISOString(),
    };

    const { id, ...dataToSave } = updated;
    await setDoc(distRef, dataToSave);
    return updated;
  },

  // Audits
  async getAudits(): Promise<AuditRecord[]> {
    if (cacheAudits !== null) {
      return cacheAudits;
    }
    if (useMock) {
      cacheAudits = mockDb.getAudits();
      return cacheAudits;
    }
    try {
      const q = query(collection(firestoreDb, 'audits'), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      const list: AuditRecord[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as AuditRecord);
      });
      cacheAudits = list;
      return list;
    } catch (error) {
      console.error('Error fetching audits from Firestore:', error);
      cacheAudits = mockDb.getAudits();
      return cacheAudits;
    }
  },

  async performAudit(items: { [productId: string]: { theoretical: number; physical: number } }): Promise<AuditRecord> {
    cacheProducts = null;
    cacheAudits = null;
    if (useMock) {
      return mockDb.performAudit(items);
    }

    const auditItems: { [productId: string]: { theoretical: number; physical: number; difference: number } } = {};
    
    // Adjust stock in transaction or individually
    for (const [productId, data] of Object.entries(items)) {
      const diff = data.physical - data.theoretical;
      auditItems[productId] = {
        theoretical: data.theoretical,
        physical: data.physical,
        difference: diff,
      };

      if (diff !== 0) {
        const productRef = doc(firestoreDb, 'products', productId);
        await runTransaction(firestoreDb, async (transaction) => {
          const productDoc = await transaction.get(productRef);
          if (!productDoc.exists()) return;
          const prodData = productDoc.data();
          let newEntries = prodData.entries || 0;
          let newExits = prodData.exits || 0;

          if (diff > 0) {
            newEntries += diff;
          } else {
            newExits += Math.abs(diff);
          }

          const newFinalStock = (prodData.initialStock || 0) + newEntries - newExits;
          transaction.update(productRef, {
            entries: newEntries,
            exits: newExits,
            finalStock: newFinalStock,
          });
        });
      }
    }

    const newAudit = {
      date: new Date().toISOString().split('T')[0],
      items: auditItems,
    };

    const docRef = await addDoc(collection(firestoreDb, 'audits'), newAudit);
    return { id: docRef.id, ...newAudit } as AuditRecord;
  }
};
export type { Product, Movement, DistributionWeek, AuditRecord };
