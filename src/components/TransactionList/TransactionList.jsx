import React, { useEffect, useState } from 'react';
import DateFilter from '../DateFilter/DateFilter';
import './index.css'; // Kita akan ganti total CSS ini

const TransactionList = ({ transactions, deleteTransaction }) => {

    // Helper konsisten dari form (lebih baik ditaruh di file utils)
    const toLocalISOString = (date) => {
        const tzOffset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - tzOffset).toISOString().split('T')[0];
    }

    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    const [dateRange, setDateRange] = useState({
        start: toLocalISOString(firstDayOfMonth),
        end: toLocalISOString(currentDate)
    });

    // State for modal
    const [showModal, setShowModal] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState(null);

    const filteredTransactions = transactions.filter(transaction => {
        if (!dateRange.start || !dateRange.end) return true;

        // Perbandingan tanggal yang lebih aman
        const transactionDate = new Date(transaction.created_at).setHours(0, 0, 0, 0);
        const startDate = new Date(dateRange.start).setHours(0, 0, 0, 0);
        const endDate = new Date(dateRange.end).setHours(0, 0, 0, 0);

        return transactionDate >= startDate && transactionDate <= endDate;
    });

    const handleDateChange = (type, value) => {
        setDateRange(prev => ({ ...prev, [type]: value }));
    };

    const handleDeleteClick = (transactionId) => {
        setTransactionToDelete(transactionId);
        setShowModal(true);
    };

    const confirmDelete = () => {
        deleteTransaction(transactionToDelete);
        setShowModal(false);
        setTransactionToDelete(null);
    };

    const cancelDelete = () => {
        setShowModal(false);
        setTransactionToDelete(null);
    };

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(amount);

    return (
        <div className="transaction-list-container">
            {/* --- Modal Konfirmasi Hapus --- */}
            {showModal && (
                <div className="modal-overlay" onClick={cancelDelete}>
                    <div className="modal-content warning" onClick={e => e.stopPropagation()}>
                        <div className="modal-icon">
                            <i className="fas fa-exclamation-triangle"></i>
                        </div>
                        <h3>Konfirmasi Hapus</h3>
                        <p>Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan.</p>
                        <div className="modal-actions">
                            <button className="modal-btn secondary" onClick={cancelDelete}>
                                Batal
                            </button>
                            <button className="modal-btn danger" onClick={confirmDelete}>
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Konten Utama --- */}
            <div className="transaction-list-card card">
                <header className="section-header">
                    <h3><i className="fas fa-list-ul"></i> Daftar Transaksi</h3>
                    <DateFilter
                        startDate={dateRange.start}
                        endDate={dateRange.end}
                        onDateChange={handleDateChange}
                    />
                </header>

                {filteredTransactions.length === 0 ? (
                    <div className="empty-message">
                        <i className="fas fa-search"></i>
                        <p>Tidak ada transaksi pada rentang tanggal ini.</p>
                    </div>
                ) : (
                    <div className="list-wrapper">
                        {/* Header ini hanya tampil di Desktop */}
                        <div className="transaction-list-header">
                            <span className="header-col-main">Detail Transaksi</span>
                            <span className="header-col">Jumlah</span>
                            <span className="header-col">Tanggal</span>
                            <span className="header-col">Untuk</span>
                            <span className="header-col-action">Aksi</span>
                        </div>

                        {/* Body List */}
                        <div className="transaction-list-body">
                            {[...filteredTransactions]
                                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) // Terbaru di atas
                                .map(t => (
                                    <div key={t.id} className="transaction-list-item">
                                        <div className="item-icon">
                                            <div className={`icon-wrapper ${t.type}`}>
                                                <i className={`fas ${t.type === 'income' ? 'fa-arrow-down' : 'fa-arrow-up'}`}></i>
                                            </div>
                                        </div>
                                        <div className="item-details">
                                            <span className="item-category">{t.category}</span>
                                            <span className="item-description">{t.description || 'Tanpa keterangan'}</span>

                                            {/* --- FIX: Tanggal untuk Mobile --- */}
                                            <span className="item-date-mobile">
                                                {new Date(t.created_at).toLocaleDateString('id-ID', {
                                                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </span>
                                            {/* --- End Fix --- */}
                                        </div>
                                        <div className={`item-amount ${t.type}`}>
                                            {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                                        </div>

                                        {/* Ini adalah tanggal untuk Desktop */}
                                        <div className="item-date">
                                            {new Date(t.created_at).toLocaleDateString('id-ID', {
                                                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </div>

                                        <div className="item-person">
                                            {t.person === 'both' ? 'Bersama' : t.person}
                                        </div>
                                        <div className="item-actions">
                                            <button
                                                className="delete-btn"
                                                title="Hapus transaksi"
                                                onClick={() => handleDeleteClick(t.id)}
                                            >
                                                <i className="fas fa-trash-alt"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TransactionList;