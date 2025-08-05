import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar/Navbar';
import Dashboard from './components/Dashboard/Dashboard';
import TransactionForm from './components/TransactionForm/TransactionForm';
import TransactionList from './components/TransactionList/TransactionList';
// import BudgetTracker from './components/BudgetTracker/BudgetTracker';
import Reports from './components/Reports/Reports';
import './App.css';
import { supabase } from './lib/supabaseClient';

function App() {
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [monthlyBudget, setMonthlyBudget] = useState(0);

  const downloadDataTransaction = async () => {
    try {
      let { data, error } = await supabase
        .from('transaction_list')
        .select('*')
      if (error) throw error;
      if (data) {
        setTransactions(data)
      }
    } catch (error) {
      alert(error.message.toString())
    }
  }

  // Load data from localStorage on initial render
  useEffect(() => {
    downloadDataTransaction()
    const savedTransactions = localStorage.getItem('pasutri-transactions');
    const savedBudget = localStorage.getItem('pasutri-budget');

    if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
    if (savedBudget) setMonthlyBudget(parseFloat(savedBudget));
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('pasutri-transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('pasutri-budget', monthlyBudget.toString());
  }, [monthlyBudget]);

  const deleteTransaction = async (id) => {
    try {
      let { error, status } = await supabase
        .from('transaction_list')
        .delete()
        .eq('id', Number(id))
      if (error) throw error;
      if (status === 204) {
        setTransactions(transactions.filter(transaction => transaction.id !== id));
        // setTransactions(data)
      }
    } catch (error) {
      alert(error.message.toString())
    }

  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard transactions={transactions} monthlyBudget={monthlyBudget} />;
      case 'add':
        return <TransactionForm addTransaction={downloadDataTransaction} />;
      case 'transactions':
        return <TransactionList transactions={transactions} deleteTransaction={deleteTransaction} />;
      // case 'budget':
      //   return <BudgetTracker monthlyBudget={monthlyBudget} setMonthlyBudget={setMonthlyBudget} />;
      case 'reports':
        return <Reports transactions={transactions} />;
      default:
        return <Dashboard transactions={transactions} monthlyBudget={monthlyBudget} />;
    }
  };

  return (
    <div className="app">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        {renderTabContent()}
      </main>
    </div>
  );
}

export default App;