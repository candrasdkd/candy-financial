import React, { useEffect, useState } from 'react';
import DateFilter from '../DateFilter/DateFilter';
import './index.css';

const TransactionList = ({ transactions, deleteTransaction }) => {
    const currentDate = new Date();

    const getLocalISODate = (date) => {
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date - offset).toISOString().split('T')[0];
    };

    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    const [dateRange, setDateRange] = useState({
        start: getLocalISODate(firstDayOfMonth),
        end: getLocalISODate(new Date())
    });

    // State for modal
    const [showModal, setShowModal] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState(null);

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

    const handleDateChange = (type, value) => {
        setDateRange(prev => ({
            ...prev,
            [type]: value
        }));
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
        // Reset scroll to top when component mounts
        window.scrollTo(0, 0);
    }, []);
    return (
        <div className="transaction-list">
            <h2>Daftar Transaksi</h2>
            <DateFilter
                startDate={dateRange.start}
                endDate={dateRange.end}
                onDateChange={handleDateChange}
            />

            {/* Confirmation Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Konfirmasi Hapus</h3>
                        <p>Apakah Anda yakin ingin menghapus transaksi ini?</p>
                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={cancelDelete}>
                                Batal
                            </button>
                            <button className="confirm-btn" onClick={confirmDelete}>
                                Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {filteredTransactions.length === 0 ? (
                <p>Tidak ada transaksi yang tercatat.</p>
            ) : (
                <div className="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Tanggal</th>
                                <th>Jenis</th>
                                <th>Kategori</th>
                                <th>Jumlah</th>
                                <th>Untuk</th>
                                <th>Keterangan</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...filteredTransactions].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map(transaction => (
                                <tr key={transaction.id}>
                                    <td>
                                        {new Date(transaction.created_at).toLocaleDateString('id-ID', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: 'numeric',
                                            minute: 'numeric'
                                        })}
                                    </td>
                                    <td>{transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</td>
                                    <td>{transaction.category}</td>
                                    <td className={transaction.type === 'income' ? 'income' : 'expense'}>
                                        Rp {parseFloat(transaction.amount).toLocaleString()}
                                    </td>
                                    <td>
                                        {transaction.person === 'both' ? 'Bersama' :
                                            transaction.person === 'person1' ? 'Candra' : 'Diny'}
                                    </td>
                                    <td>{transaction.description || '-'}</td>
                                    <td>
                                        <button
                                            onClick={() => handleDeleteClick(transaction.id)}
                                            className="delete-btn"
                                        >
                                            Hapus
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default TransactionList;