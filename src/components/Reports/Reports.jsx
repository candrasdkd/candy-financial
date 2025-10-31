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

// Registrasi semua elemen Chart.js
ChartJS.register(
    ArcElement, Tooltip, Legend, LinearScale, CategoryScale,
    PointElement, LineElement, BarElement, Title
);

// Helper untuk memformat mata uang
const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
}).format(amount);

// Helper ambil nilai dari CSS variable (dengan fallback)
const cssVar = (name, fallback) => {
    try {
        if (typeof window === 'undefined') return fallback;
        const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        return v || fallback;
    } catch {
        return fallback;
    }
};

// Baca kumpulan warna dari CSS variables
const readColors = () => ({
    success: cssVar('--success-color', '#50E3C2'),
    danger: cssVar('--danger-color', '#E84A5F'),
    primary: cssVar('--primary-color', '#4A90E2'),
    primaryDark: cssVar('--primary-color-dark', '#357ABD'),
    accent: cssVar('--accent-color', '#F5A623'),
    accentDark: cssVar('--accent-color-dark', '#D08A00'),
});

// Opsi default untuk semua chart agar konsisten
const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            labels: {
                font: { family: "'Inter', sans-serif" }
            }
        },
        tooltip: {
            bodyFont: { family: "'Inter', sans-serif" },
            titleFont: { family: "'Inter', sans-serif" },
            callbacks: {
                label: (context) => {
                    const label = context.dataset.label || context.label || '';
                    const value = context.raw;
                    return `${label}: ${formatCurrency(value)}`;
                }
            }
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            ticks: {
                font: { family: "'Inter', sans-serif" },
                callback: (value) => formatCurrency(value)
            }
        },
        x: {
            ticks: {
                font: { family: "'Inter', sans-serif" }
            }
        }
    }
};


const Reports = () => {
    const [transactions, setTransactions] = useState([]);
    const currentDate = new Date();

    // warna dari CSS vars (auto update kalau class/style <html> berubah, mis. dark mode)
    const [COLORS, setCOLORS] = useState(readColors());
    useEffect(() => {
        setCOLORS(readColors()); // pastikan kebaca setelah mount
        if (typeof window === 'undefined') return;
        const el = document.documentElement;
        const obs = new MutationObserver(() => setCOLORS(readColors()));
        obs.observe(el, { attributes: true, attributeFilter: ['class', 'style'] });
        return () => obs.disconnect();
    }, []);

    const getLocalISODate = (date) => {
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset).toISOString().split('T')[0];
    };

    const sixMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 5, 1);

    const [dateRange, setDateRange] = useState({
        start: getLocalISODate(sixMonthsAgo),
        end: getLocalISODate(currentDate)
    });

    const downloadDataTransaction = useCallback(async () => {
        try {
            const { start, end } = dateRange;
            const { data, error } = await supabase
                .from('transaction_list')
                .select('*')
                .gte('created_at', `${start}T00:00:00.000Z`)
                .lte('created_at', `${end}T23:59:59.999Z`);

            if (error) throw error;
            if (data) setTransactions(data);
        } catch (error) {
            alert(error.message?.toString?.() ?? String(error));
        }
    }, [dateRange]);

    useEffect(() => {
        downloadDataTransaction();
    }, [downloadDataTransaction]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const { totalIncome, totalExpense, balance } = useMemo(() => {
        let income = 0;
        let expense = 0;
        for (const t of transactions) {
            const amt = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
            if (t.type === 'income') income += amt || 0;
            else if (t.type === 'expense') expense += amt || 0;
        }
        return { totalIncome: income, totalExpense: expense, balance: income - expense };
    }, [transactions]);

    const monthlyTotals = useMemo(() => {
        return transactions.reduce((acc, t) => {
            const date = new Date(t.created_at);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!acc[monthYear]) acc[monthYear] = { expense: 0, income: 0 };
            const amt = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
            if (t.type === 'expense') acc[monthYear].expense += amt || 0;
            if (t.type === 'income') acc[monthYear].income += amt || 0;
            return acc;
        }, {});
    }, [transactions]);

    const expenseByPersonMonthly = useMemo(() => {
        const result = {};
        transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                const date = new Date(t.created_at);
                const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                if (!result[monthYear]) result[monthYear] = { Candra: 0, Diny: 0 };
                const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount || 0;
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
    }, [transactions]);

    const topExpenseCategories = useMemo(() => {
        const categoryData = transactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => {
                const amt = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount || 0;
                const key = t.category || 'Tanpa Kategori';
                acc[key] = (acc[key] || 0) + amt;
                return acc;
            }, {});
        const categories = Object.entries(categoryData).sort((a, b) => b[1] - a[1]);
        const topCategories = categories.slice(0, 11);
        const others = categories.slice(11).reduce((sum, [, amount]) => sum + amount, 0);
        if (others > 0) topCategories.push(['Lainnya', others]);
        return Object.fromEntries(topCategories);
    }, [transactions]);

    const formatMonthLabel = (monthKey) => {
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
        return date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
    };

    const sortedMonthlyEntries = Object.entries(monthlyTotals).sort(([a], [b]) => a.localeCompare(b));
    const sortedPersonMonthlyEntries = Object.entries(expenseByPersonMonthly).sort(([a], [b]) => a.localeCompare(b));

    const chartDataMonthly = {
        labels: sortedMonthlyEntries.map(([key]) => formatMonthLabel(key)),
        datasets: [
            {
                label: 'Pemasukan',
                data: sortedMonthlyEntries.map(([, data]) => data.income),
                borderColor: COLORS.success,
                backgroundColor: 'rgba(80, 227, 194, 0.15)',
                borderWidth: 2, tension: 0.3, fill: true
            },
            {
                label: 'Pengeluaran',
                data: sortedMonthlyEntries.map(([, data]) => data.expense),
                borderColor: COLORS.danger,
                backgroundColor: 'rgba(232, 74, 95, 0.15)',
                borderWidth: 2, tension: 0.3, fill: true
            }
        ]
    };

    const chartDataPersonMonthly = {
        labels: sortedPersonMonthlyEntries.map(([key]) => formatMonthLabel(key)),
        datasets: [
            {
                label: 'Candra',
                data: sortedPersonMonthlyEntries.map(([, data]) => data.Candra),
                backgroundColor: COLORS.primary,
                hoverBackgroundColor: COLORS.primaryDark,
                borderRadius: 4
            },
            {
                label: 'Diny',
                data: sortedPersonMonthlyEntries.map(([, data]) => data.Diny),
                backgroundColor: COLORS.accent,
                hoverBackgroundColor: COLORS.accentDark,
                borderRadius: 4
            }
        ]
    };

    const chartDataCategories = {
        labels: Object.keys(topExpenseCategories),
        datasets: [{
            data: Object.values(topExpenseCategories),
            backgroundColor: [
                '#4A90E2', '#50E3C2', '#F5A623', '#E84A5F', '#BD10E0', '#9013FE',
                '#B8E986', '#7ED321', '#FF847C', '#4A4A4A', '#00BCD4', '#FFC107'
            ]
            // borderWidth: 0, borderColor: 'transparent'
        }]
    };

    return (
        <div className="reports-container">
            <div className="card">
                <header className="section-header no-border">
                    <h2><i className="fas fa-chart-line"></i> Laporan Keuangan</h2>
                    <DateFilter
                        startDate={dateRange.start}
                        endDate={dateRange.end}
                        onDateChange={(type, value) =>
                            setDateRange(prev => ({ ...prev, [type]: value }))
                        }
                    />
                </header>
            </div>

            <div className="kpi-grid">
                <div className="card kpi-card income">
                    <h4>Total Pemasukan</h4>
                    <p>{formatCurrency(totalIncome)}</p>
                </div>
                <div className="card kpi-card expense">
                    <h4>Total Pengeluaran</h4>
                    <p>{formatCurrency(totalExpense)}</p>
                </div>
                <div className={`card kpi-card balance ${balance < 0 ? 'negative' : 'positive'}`}>
                    <h4>Selisih</h4>
                    <p>{formatCurrency(balance)}</p>
                </div>
            </div>

            <div className="reports-main-grid">
                <div className="reports-col-main">
                    <div className="card chart-card">
                        <h3><i className="fas fa-chart-line"></i> Trend Pemasukan vs Pengeluaran</h3>
                        <div className="chart-wrapper">
                            <Line data={chartDataMonthly} options={commonChartOptions} />
                        </div>
                    </div>

                    <div className="card">
                        <header className="section-header">
                            <h3><i className="fas fa-history"></i> Riwayat Total Bulanan</h3>
                        </header>
                        {sortedMonthlyEntries.length === 0 ? (
                            <div className="empty-message">
                                <i className="fas fa-search"></i>
                                <p>Tidak ada data.</p>
                            </div>
                        ) : (
                            <div className="monthly-list-body">
                                {sortedMonthlyEntries.slice().reverse().map(([key, totals]) => (
                                    <div key={key} className="monthly-list-item">
                                        <span className="month-label">{formatMonthLabel(key)}</span>
                                        <div className="month-totals">
                                            <span className="total-income">
                                                <i className="fas fa-arrow-down"></i> {formatCurrency(totals.income)}
                                            </span>
                                            <span className="total-expense">
                                                <i className="fas fa-arrow-up"></i> {formatCurrency(totals.expense)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="reports-col-sidebar">
                    <div className="card chart-card">
                        <h3><i className="fas fa-chart-pie"></i> Top Kategori</h3>
                        <div className="chart-wrapper">
                            <Doughnut
                                data={chartDataCategories}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { position: 'bottom', labels: { font: { family: "'Inter', sans-serif" } } },
                                        tooltip: {
                                            ...commonChartOptions.plugins.tooltip,
                                            callbacks: {
                                                label: (context) => {
                                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                                    const value = context.raw;
                                                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                                    return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                                                }
                                            }
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>

                    <div className="card chart-card">
                        <h3><i className="fas fa-users"></i> Per Orang (Bulanan)</h3>
                        <div className="chart-wrapper">
                            <Bar
                                data={chartDataPersonMonthly}
                                options={{
                                    ...commonChartOptions,
                                    scales: {
                                        ...commonChartOptions.scales,
                                        x: { ...commonChartOptions.scales.x, stacked: true },
                                        y: { ...commonChartOptions.scales.y, stacked: true }
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
