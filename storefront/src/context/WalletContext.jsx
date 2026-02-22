import React, { createContext, useContext, useState, useEffect } from 'react';
import { getWallet, verifyPayment } from '../services/api';
import { useUser } from './UserContext';

const WalletContext = createContext();

export const useWallet = () => useContext(WalletContext);

export const WalletProvider = ({ children }) => {
  const { user } = useUser();
  const [balance, setBalance] = useState(0.00);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mock payment methods for visual demo
  const [paymentMethods, setPaymentMethods] = useState([]);

  const refreshWallet = async () => {
    if (!user) return;
    try {
        const data = await getWallet();
        if (data.success) {
            setBalance(parseFloat(data.balance));
            setTransactions(data.transactions || []);
        }
    } catch (error) {
        console.error("Failed to refresh wallet", error);
    }
  };

  useEffect(() => {
    refreshWallet();
  }, [user]);

  const addTransaction = (transaction) => {
    // Optimistic or manual add (mostly deprecated by backend fetch)
    setTransactions(prev => [transaction, ...prev]);
  };

  const deductBalance = (amount) => {
    setBalance(prev => prev - amount);
  };

  const verifyTopUp = async (reference) => {
    setLoading(true);
    try {
        const result = await verifyPayment(reference, 'wallet_topup');
        if (result.success) {
            await refreshWallet();
            return { success: true };
        } else {
            return { success: false, message: result.message };
        }
    } catch (error) {
        return { success: false, message: error.message };
    } finally {
        setLoading(false);
    }
  };

  const topUpBalance = async (amount) => {
      // Deprecated: used for mock only.
      // In real flow, we use verifyTopUp with reference.
      console.warn("topUpBalance(amount) is deprecated. Use verifyTopUp(reference).");
  };

  return (
    <WalletContext.Provider value={{ 
      balance, 
      transactions, 
      paymentMethods,
      deductBalance,
      topUpBalance, 
      verifyTopUp,
      refreshWallet,
      addTransaction,
      loading
    }}>
      {children}
    </WalletContext.Provider>
  );
};
