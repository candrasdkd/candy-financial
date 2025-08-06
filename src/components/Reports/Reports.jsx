import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
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
import { supabase } from '../../lib/supabaseClient';

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

const Reports = () => {
    const currentDate = new Date();
    const [transactions, setTransactions] = useState([]);

    const getLocalISODate = (date) => {
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date - offset).toISOString().split('T')[0];
    };

    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    const [dateRange, setDateRange] = useState({
        start: getLocalISODate(firstDayOfMonth),
        end: getLocalISODate(new Date())
    });

    const filteredTransactions = transactions.filter(transaction => {
        if (!dateRange.start || !dateRange.end) return true;

        const transactionDate = new Date(transaction.created_at);
        transactionDate.setHours(0, 0, 0, 0);

        const startDate = new Date(dateRange.start);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);

        return transactionDate >= startDate && transactionDate <= endDate;
    });


    const monthlyTotals = useMemo(() => {
        return filteredTransactions.reduce((acc, t) => {
            const date = new Date(t.created_at);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!acc[monthYear]) {
                acc[monthYear] = { expense: 0 };
            }
            if (t.type === 'expense') {
                acc[monthYear].expense += parseFloat(t.amount);
            }
            return acc;
        }, {});
    }, [filteredTransactions]);

    const expenseByPersonMonthly = useMemo(() => {
        const result = {};

        filteredTransactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                const date = new Date(t.created_at);
                const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

                if (!result[monthYear]) {
                    result[monthYear] = { Candra: 0, Diny: 0 };
                }

                const amount = parseFloat(t.amount);

                if (t.person === 'both') {
                    result[monthYear].Candra += amount / 2;
                    result[monthYear].Diny += amount / 2;
                } else if (t.person === 'Candra') {
                    result[monthYear].Candra += amount;
                } else if (t.person === 'Diny') {
                    result[monthYear].Diny += amount;
                }
            });

        return result;
    }, [filteredTransactions]);

    const topExpenseCategories = useMemo(() => {
        const categoryData = filteredTransactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount);
                return acc;
            }, {});

        const categories = Object.entries(categoryData)
            .sort((a, b) => b[1] - a[1]);

        const topCategories = categories.slice(0, 11);
        const others = categories.slice(11).reduce((sum, [, amount]) => sum + amount, 0);

        if (others > 0) {
            topCategories.push(['Lainnya', others]);
        }

        return Object.fromEntries(topCategories);
    }, [filteredTransactions]);

    const formatMonthLabel = (monthKey) => {
        const [year, month] = monthKey.split('-');
        const date = new Date(year, parseInt(month) - 1);
        return date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
    };

    const sortedMonthlyEntries = Object.entries(monthlyTotals).sort(([a], [b]) => a.localeCompare(b));
    const sortedPersonMonthlyEntries = Object.entries(expenseByPersonMonthly).sort(([a], [b]) => a.localeCompare(b));

    const chartDataMonthly = {
        labels: sortedMonthlyEntries.map(([key]) => formatMonthLabel(key)),
        datasets: [
            {
                label: 'Pengeluaran',
                data: sortedMonthlyEntries.map(([, data]) => data.expense),
                borderColor: '#F44336',
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true
            }
        ]
    };

    const chartDataPersonMonthly = {
        labels: sortedPersonMonthlyEntries.map(([key]) => formatMonthLabel(key)),
        datasets: [
            {
                label: 'Candra',
                data: sortedPersonMonthlyEntries.map(([, data]) => data.Candra),
                backgroundColor: 'rgba(76, 175, 80, 0.4)',
                borderRadius: 4
            },
            {
                label: 'Diny',
                data: sortedPersonMonthlyEntries.map(([, data]) => data.Diny),
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
                'rgba(63, 81, 181, 0.7)',
                'rgba(33, 150, 243, 0.7)',
                'rgba(0, 188, 212, 0.7)',
                'rgba(76, 175, 80, 0.7)',
                'rgba(255, 193, 7, 0.7)',
                'rgba(255, 152, 0, 0.7)',
                'rgba(244, 67, 54, 0.7)',
                'rgba(156, 39, 176, 0.7)',
                'rgba(233, 30, 99, 0.7)',
                'rgba(121, 85, 72, 0.7)',
                'rgba(96, 125, 139, 0.7)',
                'rgba(0, 150, 136, 0.7)'
            ],
            borderWidth: 0
        }]
    };

    const handleDateChange = (type, value) => {
        setDateRange(prev => ({
            ...prev,
            [type]: value
        }));
    };

    const downloadDataTransaction = useCallback(async () => {
        try {
            const { start, end } = dateRange;

            let { data, error } = await supabase
                .from('transaction_list')
                .select('*')
                .gte('created_at', `${start}T00:00:00.000Z`)
                .lte('created_at', `${end}T23:59:59.999Z`);

            if (error) throw error;
            if (data) setTransactions(data);
        } catch (error) {
            alert(error.message.toString());
        }
    }, [dateRange]);

    useEffect(() => {
        downloadDataTransaction();
    }, [downloadDataTransaction]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="reports-container">
            <div className="reports-header">
                <h2>Laporan Pengeluaran</h2>
                <DateFilter
                    startDate={dateRange.start}
                    endDate={dateRange.end}
                    onDateChange={handleDateChange}
                />
            </div>

            <div className="charts-grid">
                <div className="chart-card">
                    <h3>Trend Bulanan</h3>
                    <div className="chart-wrapper">
                        <Line data={chartDataMonthly} options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                tooltip: {
                                    callbacks: {
                                        label: (context) => `${context.dataset.label}: Rp ${context.raw.toLocaleString('id-ID')}`
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
                        }} />
                    </div>
                </div>

                <div className="chart-card">
                    <h3>Perbandingan per Orang per Bulan</h3>
                    <div className="chart-wrapper">
                        <Bar data={chartDataPersonMonthly} options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                tooltip: {
                                    callbacks: {
                                        label: (context) => `${context.dataset.label}: Rp ${context.raw.toLocaleString('id-ID')}`
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
                        }} />
                    </div>
                </div>

                <div className="chart-card">
                    <h3>Pengeluaran per Kategori</h3>
                    <div className="chart-wrapper">
                        <Doughnut data={chartDataCategories} options={{
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
                        }} />
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
                                <th>Total Pengeluaran</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedMonthlyEntries.map(([key, totals]) => (
                                <tr key={key}>
                                    <td>{formatMonthLabel(key)}</td>
                                    <td className="expense">Rp {totals.expense.toLocaleString('id-ID')}</td>
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
