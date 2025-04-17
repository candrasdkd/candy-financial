import React, { useState, useMemo, useEffect } from 'react';
import DateFilter from '../DateFilter/DateFilter';
import './index.css';

const Dashboard = ({ transactions, monthlyBudget }) => {
    // Get current date in local timezone
    const currentDate = new Date();

    // Calculate first and last day of month with proper timezone handling
    const getLocalISODate = (date) => {
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date - offset).toISOString();
    };

    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const [dateRange, setDateRange] = useState({
        start: getLocalISODate(firstDayOfMonth),
        end: getLocalISODate(currentDate)
    });

    // Memoize filtered transactions for better performance
    const filteredTransactions = useMemo(() => {
        if (!dateRange.start || !dateRange.end) return transactions;

        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999); // Set to end of day

        return transactions.filter(transaction => {
            const transactionDate = new Date(transaction.created_at);
            return transactionDate >= startDate && transactionDate <= endDate;
        });
    }, [transactions, dateRange]);

    // Calculate totals with useMemo for optimization
    const { totalIncome, totalExpense, balance, remainingBudget } = useMemo(() => {
        const income = filteredTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const expense = filteredTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        return {
            totalIncome: income,
            totalExpense: expense,
            balance: income - expense,
            remainingBudget: monthlyBudget - expense
        };
    }, [filteredTransactions, monthlyBudget]);

    // Recent transactions
    const recentTransactions = useMemo(() =>
        [...filteredTransactions]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5),
        [filteredTransactions]
    );

    // Expense by category with percentage calculation
    const expenseByCategory = useMemo(() => {
        const categoryData = filteredTransactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount);
                return acc;
            }, {});

        // Sort by amount descending
        return Object.entries(categoryData)
            .sort((a, b) => b[1] - a[1])
            .map(([category, amount]) => ({
                category,
                amount,
                percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0
            }));
    }, [filteredTransactions, totalExpense]);

    // Format currency with IDR locale
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };
    useEffect(() => {
        // Reset scroll to top when component mounts
        window.scrollTo(0, 0);
    }, []);
    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h2>Dashboard Keuangan</h2>
                <DateFilter
                    startDate={dateRange.start.split('T')[0]}
                    endDate={dateRange.end.split('T')[0]}
                    onDateChange={(type, value) => setDateRange(prev => ({ ...prev, [type]: value }))}
                />
            </div>

            <div className="summary-grid">
                <div className="summary-card income-card">
                    <div className="card-icon">
                        <i className="fas fa-wallet"></i>
                    </div>
                    <div className="card-content">
                        <h3>Total Pemasukan</h3>
                        <p>{formatCurrency(totalIncome)}</p>
                    </div>
                </div>

                <div className="summary-card expense-card">
                    <div className="card-icon">
                        <i className="fas fa-shopping-bag"></i>
                    </div>
                    <div className="card-content">
                        <h3>Total Pengeluaran</h3>
                        <p>{formatCurrency(totalExpense)}</p>
                    </div>
                </div>

                <div className="summary-card balance-card">
                    <div className="card-icon">
                        <i className="fas fa-balance-scale"></i>
                    </div>
                    <div className="card-content">
                        <h3>Saldo</h3>
                        <p className={balance >= 0 ? 'positive' : 'negative'}>
                            {formatCurrency(Math.abs(balance))}
                        </p>
                    </div>
                </div>

                {monthlyBudget > 0 && (
                    <div className="summary-card budget-card">
                        <div className="card-icon">
                            <i className="fas fa-chart-line"></i>
                        </div>
                        <div className="card-content">
                            <h3>Sisa Anggaran</h3>
                            <p className={remainingBudget >= 0 ? 'positive' : 'negative'}>
                                {formatCurrency(Math.abs(remainingBudget))}
                            </p>
                            <div className="budget-progress">
                                <div
                                    className="progress-bar"
                                    style={{
                                        width: `${Math.min(100, (totalExpense / monthlyBudget) * 100)}%`,
                                        backgroundColor: remainingBudget >= 0 ? '#4CAF50' : '#F44336'
                                    }}
                                ></div>
                            </div>
                            <small>
                                {Math.min(100, Math.round((totalExpense / monthlyBudget) * 100))}% digunakan
                            </small>
                        </div>
                    </div>
                )}
            </div>

            <div className="dashboard-content">
                <div className="recent-transactions">
                    <div className="section-header">
                        <h3><i className="fas fa-history"></i> Transaksi Terakhir</h3>
                        {recentTransactions.length === 0 && (
                            <p className="empty-message">Tidak ada transaksi terakhir</p>
                        )}
                    </div>

                    <div className="transactions-list">
                        {recentTransactions.map(t => (
                            <div key={t.id} className="transaction-item">
                                <div className="transaction-icon">
                                    <i className={`fas ${t.type === 'income' ? 'fa-arrow-down' : 'fa-arrow-up'}`}></i>
                                </div>
                                <div className="transaction-details">
                                    <div className="transaction-meta">
                                        <span className="transaction-category">{t.category}</span>
                                    </div>
                                    <div className="transaction-person">
                                        {t.person === 'both' ? 'Bersama' : t.person}
                                    </div>
                                </div>
                                <div className='transaction-info'>
                                    <div className="transaction-date">
                                        {new Date(t.created_at).toLocaleDateString('id-ID', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: 'numeric',
                                            minute: 'numeric'
                                        })}
                                    </div>
                                    <div className={`transaction-amount ${t.type}`}>
                                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="expense-categories">
                    <div className="section-header">
                        <h3><i className="fas fa-tags"></i> Pengeluaran per Kategori</h3>
                        {expenseByCategory.length === 0 && (
                            <p className="empty-message">Tidak ada data pengeluaran</p>
                        )}
                    </div>

                    <div className="categories-list">
                        {expenseByCategory.map(({ category, amount, percentage }) => (
                            <div key={category} className="category-item">
                                <div className="category-info">
                                    <span className="category-name">{category}</span>
                                    <span className="category-percentage">
                                        <span className="percentage-badge">{percentage}%</span>
                                    </span>
                                </div>
                                <div className="category-amount">
                                    {formatCurrency(amount)}
                                </div>
                                <div className="category-progress">
                                    <div
                                        className="progress-bar"
                                        style={{
                                            width: `${percentage}%`,
                                            backgroundColor: `hsl(${percentage * 1.2}, 70%, 50%)`
                                        }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;