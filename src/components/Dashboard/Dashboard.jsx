import { useState, useMemo, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

import DateFilter from '../DateFilter/DateFilter';
import './index.css'; // Kita akan menggunakan file CSS baru

// Registrasi komponen Chart.js yang dibutuhkan
ChartJS.register(ArcElement, Tooltip, Legend);

// --- Helper Components (Idealnya ini file terpisah) ---

const SummaryCard = ({ title, amount, icon, formatCurrency, type = '' }) => (
    <div className={`summary-card ${type}`}>
        <div className="card-icon-wrapper">
            <i className={`fas ${icon}`}></i>
        </div>
        <div className="card-content">
            <h4>{title}</h4>
            <p>{formatCurrency(amount)}</p>
        </div>
    </div>
);

const TransactionItem = ({ transaction, formatCurrency }) => (
    <div className="transaction-item">
        <div className={`transaction-icon-wrapper ${transaction.type}`}>
            <i className={`fas ${transaction.type === 'income' ? 'fa-arrow-down' : 'fa-arrow-up'}`}></i>
        </div>
        <div className="transaction-details">
            <span className="transaction-category">{transaction.category}</span>
            <span className="transaction-person">{transaction.person === 'both' ? 'Bersama' : transaction.person}</span>
        </div>
        <div className="transaction-info">
            <span className={`transaction-amount ${transaction.type}`}>
                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
            </span>
            <span className="transaction-date">
                {new Date(transaction.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
            </span>
        </div>
    </div>
);


const Dashboard = ({ transactions }) => {
    // State untuk beralih tampilan pengeluaran (chart/list)
    const [expenseView, setExpenseView] = useState('chart'); // 'chart' or 'list'

    // Get current date in local timezone
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    // Helper untuk menghindari masalah timezone saat mengonversi ke ISO string
    const toLocalISOString = (date) => {
        const tzOffset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - tzOffset).toISOString().split('T')[0];
    }

    const [dateRange, setDateRange] = useState({
        start: toLocalISOString(firstDayOfMonth),
        end: toLocalISOString(currentDate)
    });

    const filteredTransactions = useMemo(() => {
        if (!dateRange.start || !dateRange.end) return transactions;
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);

        return transactions.filter(transaction => {
            const transactionDate = new Date(transaction.created_at);
            return transactionDate >= startDate && transactionDate <= endDate;
        });
    }, [transactions, dateRange]);

    const { totalIncome, totalExpense, balance } = useMemo(() => {
        let income = 0;
        let expense = 0;
        for (const t of filteredTransactions) {
            if (t.type === 'income') {
                income += parseFloat(t.amount);
            } else {
                expense += parseFloat(t.amount);
            }
        }
        return {
            totalIncome: income,
            totalExpense: expense,
            balance: income - expense
        };
    }, [filteredTransactions]);

    const recentTransactions = useMemo(() =>
        [...filteredTransactions]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5),
        [filteredTransactions]
    );

    const expenseByCategory = useMemo(() => {
        const categoryData = filteredTransactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount);
                return acc;
            }, {});

        return Object.entries(categoryData)
            .sort((a, b) => b[1] - a[1])
            .map(([category, amount]) => ({
                category,
                amount,
                percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0
            }));
    }, [filteredTransactions, totalExpense]);

    const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(amount);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // --- Data & Options untuk Donut Chart ---
    const chartData = {
        labels: expenseByCategory.map(c => c.category),
        datasets: [{
            label: 'Pengeluaran',
            data: expenseByCategory.map(c => c.amount),
            backgroundColor: [
                '#4A90E2', '#50E3C2', '#F5A623', '#F8E71C', '#BD10E0',
                '#9013FE', '#B8E986', '#7ED321', '#E84A5F', '#FF847C'
            ],
            borderColor: '#FFFFFF',
            borderWidth: 2,
            hoverOffset: 4
        }]
    };
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    boxWidth: 12,
                    padding: 20,
                    font: {
                        family: "'Inter', sans-serif"
                    }
                }
            }
        }
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div>
                    <h1>Dashboard</h1>
                    <p className="subtitle">Ringkasan aktivitas keuangan Anda.</p>
                </div>
                <DateFilter
                    startDate={dateRange.start}
                    endDate={dateRange.end}
                    onDateChange={(type, value) => setDateRange(prev => ({ ...prev, [type]: value }))}
                />
            </header>

            <section className="summary-grid">
                {/* Card Pemasukan & Saldo (Contoh, bisa Anda tambahkan dari data) */}
                <SummaryCard title="Total Pemasukan" amount={totalIncome} icon="fa-arrow-down" formatCurrency={formatCurrency} type="income" />
                <SummaryCard title="Total Pengeluaran" amount={totalExpense} icon="fa-arrow-up" formatCurrency={formatCurrency} type="expense" />
                <SummaryCard title="Saldo Saat Ini" amount={balance} icon="fa-wallet" formatCurrency={formatCurrency} type="balance" />
            </section>

            <main className="dashboard-main-content">
                <section className="card">
                    <header className="section-header">
                        <h3><i className="fas fa-chart-pie"></i> Pengeluaran per Kategori</h3>
                        <div className="view-toggle">
                            <button onClick={() => setExpenseView('chart')} className={expenseView === 'chart' ? 'active' : ''}><i className="fas fa-chart-pie"></i></button>
                            <button onClick={() => setExpenseView('list')} className={expenseView === 'list' ? 'active' : ''}><i className="fas fa-list"></i></button>
                        </div>
                    </header>
                    {expenseByCategory.length === 0 ? (
                        <p className="empty-message">Belum ada data pengeluaran pada rentang tanggal ini.</p>
                    ) : (
                        <div>
                            {expenseView === 'chart' ? (
                                <div className="chart-container">
                                    <Doughnut data={chartData} options={chartOptions} />
                                </div>
                            ) : (
                                <div className="categories-list">
                                    {expenseByCategory.map(({ category, amount, percentage }) => (
                                        <div key={category} className="category-item">
                                            <div className="category-details">
                                                <span className="category-name">{category}</span>
                                                <span className="category-amount">{formatCurrency(amount)}</span>
                                            </div>
                                            <div className="category-progress">
                                                <div className="progress-bar" style={{ width: `${percentage}%` }}></div>
                                                <span className="category-percentage">{percentage}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </section>

                <section className="card">
                    <header className="section-header">
                        <h3><i className="fas fa-history"></i> Transaksi Terakhir</h3>
                    </header>
                    {recentTransactions.length === 0 ? (
                        <p className="empty-message">Tidak ada transaksi terbaru.</p>
                    ) : (
                        <div className="transactions-list">
                            {recentTransactions.map(t => (
                                <TransactionItem key={t.id} transaction={t} formatCurrency={formatCurrency} />
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default Dashboard;