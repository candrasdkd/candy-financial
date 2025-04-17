import React, { useState, useMemo, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import DateFilter from '../DateFilter/DateFilter';
import './index.css';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    LinearScale,
    CategoryScale,
    PointElement,
    LineElement,
    BarElement,
    Title
} from "chart.js";

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    LinearScale,
    CategoryScale,
    PointElement,
    LineElement,
    BarElement,
    Title
);

const Reports = ({ transactions }) => {
    // Get current date in local timezone
    const currentDate = new Date();

    // Calculate first and last day of month with proper timezone handling
    const getLocalISODate = (date) => {
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date - offset).toISOString().split('T')[0];
    };

    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    const [dateRange, setDateRange] = useState({
        start: getLocalISODate(firstDayOfMonth),
        end: getLocalISODate(new Date())
    })

    const filteredTransactions = transactions.filter(transaction => {
        if (!dateRange.start || !dateRange.end) return true;

        // Convert dates to start of day for comparison
        const transactionDate = new Date(transaction.created_at);
        transactionDate.setHours(0, 0, 0, 0);

        const startDate = new Date(dateRange.start);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);

        return transactionDate >= startDate && transactionDate <= endDate;
    });

    // Calculate totals by person
    const { incomeByPerson, expenseByPerson } = useMemo(() => {
        const calculateByPerson = (type) => {
            return filteredTransactions
                .filter(t => t.type === type)
                .reduce((acc, t) => {
                    if (t.person === 'both') {
                        acc.Candra = (acc.Candra || 0) + parseFloat(t.amount) / 2;
                        acc.Diny = (acc.Diny || 0) + parseFloat(t.amount) / 2;
                    } else {
                        const person = t.person === 'Candra' ? 'Candra' : 'Diny';
                        acc[person] = (acc[person] || 0) + parseFloat(t.amount);
                    }
                    return acc;
                }, {});
        };

        return {
            incomeByPerson: calculateByPerson('income'),
            expenseByPerson: calculateByPerson('expense')
        };
    }, [filteredTransactions]);

    // Calculate monthly totals
    const monthlyTotals = useMemo(() => {
        return filteredTransactions.reduce((acc, t) => {
            const monthYear = new Date(t.created_at).toLocaleDateString('id-ID', {
                month: 'short',
                year: 'numeric'
            });
            if (!acc[monthYear]) {
                acc[monthYear] = { income: 0, expense: 0 };
            }
            acc[monthYear][t.type] += parseFloat(t.amount);
            return acc;
        }, {});
    }, [filteredTransactions]);

    // Calculate by category
    const { topExpenseCategories } = useMemo(() => {
        const categoryData = filteredTransactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount);
                return acc;
            }, {});

        // Get top 5 categories + others
        const categories = Object.entries(categoryData)
            .sort((a, b) => b[1] - a[1]);

        const topCategories = categories.slice(0, 11);
        const others = categories.slice(11).reduce((sum, [, amount]) => sum + amount, 0);
        console.log(topCategories);

        if (others > 0) {
            topCategories.push(['Lainnya', others]);
        }

        return {
            // expenseByCategory: categoryData,
            topExpenseCategories: Object.fromEntries(topCategories)
        };
    }, [filteredTransactions]);

    const handleDateChange = (type, value) => {
        setDateRange(prev => ({
            ...prev,
            [type]: value
        }));
    };

    // Chart data
    const chartDataMonthly = {
        labels: Object.keys(monthlyTotals),
        datasets: [
            {
                label: 'Pemasukan',
                data: Object.values(monthlyTotals).map(t => t.income),
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true
            },
            {
                label: 'Pengeluaran',
                data: Object.values(monthlyTotals).map(t => t.expense),
                borderColor: '#F44336',
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true
            }
        ]
    };

    const chartDataComparison = {
        labels: ['Pemasukan', 'Pengeluaran'],
        datasets: [
            {
                label: 'Candra',
                data: [incomeByPerson.Candra || 0, expenseByPerson.Candra || 0],
                backgroundColor: 'rgba(76, 175, 80, 0.4)',
                borderRadius: 4,
            },
            {
                label: 'Diny',
                data: [incomeByPerson.Diny || 0, expenseByPerson.Diny || 0],
                backgroundColor: 'rgba(244, 67, 54, 0.4)',
                borderRadius: 4
            }
        ]
    };

    const chartDataCategories = {
        labels: Object.keys(topExpenseCategories),
        datasets: [{
            data: Object.values(topExpenseCategories),
            backgroundColor: [
                'rgba(63, 81, 181, 0.7)',    // Indigo
                'rgba(33, 150, 243, 0.7)',   // Blue
                'rgba(0, 188, 212, 0.7)',    // Cyan
                'rgba(76, 175, 80, 0.7)',    // Green
                'rgba(255, 193, 7, 0.7)',    // Amber
                'rgba(255, 152, 0, 0.7)',    // Orange
                'rgba(244, 67, 54, 0.7)',    // Red
                'rgba(156, 39, 176, 0.7)',   // Purple
                'rgba(233, 30, 99, 0.7)',    // Pink
                'rgba(121, 85, 72, 0.7)',    // Brown
                'rgba(96, 125, 139, 0.7)',   // Blue Grey
                'rgba(0, 150, 136, 0.7)'     // Teal
            ],
            borderWidth: 0
        }]
    };

    const totalIncome = Object.values(monthlyTotals).reduce((sum, t) => sum + t.income, 0);
    const totalExpense = Object.values(monthlyTotals).reduce((sum, t) => sum + t.expense, 0);
    useEffect(() => {
        // Reset scroll to top when component mounts
        window.scrollTo(0, 0);
    }, []);
    return (
        <div className="reports-container">
            <div className="reports-header">
                <h2>Laporan Keuangan</h2>
                <DateFilter
                    startDate={dateRange.start}
                    endDate={dateRange.end}
                    onDateChange={handleDateChange}
                />
            </div>

            <div className="summary-cards">
                <div className="summary-card income">
                    <h3>Total Pemasukan</h3>
                    <p>Rp {totalIncome.toLocaleString('id-ID')}</p>
                </div>
                <div className="summary-card expense">
                    <h3>Total Pengeluaran</h3>
                    <p>Rp {totalExpense.toLocaleString('id-ID')}</p>
                </div>
                <div className={`summary-card ${totalIncome - totalExpense >= 0 ? 'income' : 'expense'}`}>
                    <h3>Saldo</h3>
                    <p>Rp {totalIncome - totalExpense >= 0 ? '' : '-'}{Math.abs(totalIncome - totalExpense).toLocaleString('id-ID')}</p>
                </div>
            </div>

            <div className="charts-grid">
                <div className="chart-card">
                    <h3>Trend Bulanan</h3>
                    <div className="chart-wrapper">
                        <Line
                            data={chartDataMonthly}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    title: {
                                        display: false
                                    },
                                    tooltip: {
                                        callbacks: {
                                            label: (context) => {
                                                return `${context.dataset.label}: Rp ${context.raw.toLocaleString('id-ID')}`;
                                            }
                                        }
                                    }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        ticks: {
                                            callback: value => `Rp ${value.toLocaleString('id-ID')}`
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="chart-card">
                    <h3>Perbandingan per Orang</h3>
                    <div className="chart-wrapper">
                        <Bar
                            data={chartDataComparison}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    tooltip: {
                                        callbacks: {
                                            label: (context) => {
                                                return `${context.dataset.label}: Rp ${context.raw.toLocaleString('id-ID')}`;
                                            }
                                        }
                                    }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        ticks: {
                                            callback: value => `Rp ${value.toLocaleString('id-ID')}`
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="chart-card">
                    <h3>Pengeluaran per Kategori</h3>
                    <div className="chart-wrapper">
                        <Doughnut
                            data={chartDataCategories}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    tooltip: {
                                        callbacks: {
                                            label: (context) => {
                                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                                const value = context.raw;
                                                const percentage = Math.round((value / total) * 100);
                                                return `${context.label}: Rp ${value.toLocaleString('id-ID')} (${percentage}%)`;
                                            }
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="monthly-table-container">
                <h3>Riwayat Bulanan</h3>
                <div className="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Bulan</th>
                                <th>Total Pemasukan</th>
                                <th>Total Pengeluaran</th>
                                <th>Saldo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(monthlyTotals)
                                .sort((a, b) => new Date(b[0]) - new Date(a[0]))
                                .map(([monthYear, totals]) => (
                                    <tr key={monthYear}>
                                        <td>{monthYear}</td>
                                        <td className="income">Rp {totals.income.toLocaleString('id-ID')}</td>
                                        <td className="expense">Rp {totals.expense.toLocaleString('id-ID')}</td>
                                        <td className={totals.income - totals.expense >= 0 ? 'income' : 'expense'}>
                                            Rp {Math.abs(totals.income - totals.expense).toLocaleString('id-ID')}
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reports;