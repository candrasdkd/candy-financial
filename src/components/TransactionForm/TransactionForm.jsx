import { useEffect, useState, useCallback } from 'react';
import './index.css'; // Kita akan perbarui CSS ini
import { supabase } from '../../lib/supabaseClient';

// Idealnya, ini adalah prop dari komponen App
const USER_NAMES = ['Candra', 'Diny'];

const TransactionForm = ({ addTransaction }) => {
    // State baru untuk Pemasukan/Pengeluaran
    const [transactionType, setTransactionType] = useState('expense'); // 'expense' or 'income'

    const [formData, setFormData] = useState({
        amount: '',
        category: '',
        description: '',
        person: 'both',
        created_at: new Date().toISOString().split('T')[0]
    });

    const [categories, setCategories] = useState([]);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [recentTransactions, setRecentTransactions] = useState([]);

    // --- Fungsi Data Dinamis ---
    const downloadDataCategory = useCallback(async (type) => {
        try {
            let { data, error } = await supabase
                .from('transaction_category')
                .select('name')
                .eq('type', type) // Dinamis berdasarkan 'type'
                .order('name');

            if (error) throw error;
            if (data) {
                setCategories(data.map(cat => cat.name));
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            alert('Gagal memuat kategori: ' + error.message);
        }
    }, []);

    const fetchRecentTransactions = useCallback(async (type) => {
        try {
            let { data, error } = await supabase
                .from('transaction_list')
                .select('description, category, amount, person')
                .eq('type', type) // Dinamis berdasarkan 'type'
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) throw error;
            if (data) {
                setRecentTransactions(data);
            }
        } catch (error) {
            console.error('Error fetching recent transactions:', error);
        }
    }, []);

    // --- Efek untuk memuat data saat 'type' berubah ---
    useEffect(() => {
        window.scrollTo(0, 0);
        downloadDataCategory(transactionType);
        fetchRecentTransactions(transactionType);
    }, [transactionType, downloadDataCategory, fetchRecentTransactions]);

    // --- Validasi & Handler ---
    const validateForm = () => {
        // (Logika validasi Anda sudah bagus, tidak perlu diubah)
        const newErrors = {};
        const numericAmount = parseFloat(formData.amount.replace(/\./g, ''));
        if (!formData.amount.trim()) newErrors.amount = 'Jumlah tidak boleh kosong';
        else if (isNaN(numericAmount) || numericAmount <= 0) newErrors.amount = 'Jumlah harus lebih dari 0';
        else if (numericAmount > 1000000000) newErrors.amount = 'Jumlah terlalu besar';
        if (!formData.category) newErrors.category = 'Pilih kategori';
        if (!formData.created_at) newErrors.created_at = 'Tanggal tidak valid';
        else {
            const selectedDate = new Date(formData.created_at);
            const today = new Date();
            today.setHours(23, 59, 59, 999);
            if (selectedDate > today) newErrors.created_at = 'Tanggal tidak boleh melebihi hari ini';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const formatCurrencyInput = (value) => value.replace(/[^0-9]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    const handleAmountChange = (e) => {
        handleChange({ target: { name: 'amount', value: formatCurrencyInput(e.target.value) } });
    };

    // Handler baru untuk 'type'
    const handleTypeChange = (type) => {
        setTransactionType(type);
        setFormData(prev => ({
            ...prev,
            category: '', // Reset kategori saat 'type' berubah
            description: ''
        }));
        setErrors({});
        setRecentTransactions([]); // Kosongkan saran
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            const firstErrorField = document.querySelector('.has-error');
            if (firstErrorField) firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        setIsSubmitting(true);
        try {
            const numericAmount = parseFloat(formData.amount.replace(/\./g, ''));
            const transactionDate = new Date(formData.created_at);
            transactionDate.setHours(new Date().getHours(), new Date().getMinutes(), new Date().getSeconds());

            const { data, error } = await supabase
                .from('transaction_list')
                .insert([{
                    ...formData,
                    type: transactionType, // Pastikan 'type' yang benar disimpan
                    created_at: transactionDate.toISOString(),
                    amount: numericAmount,
                }])
                .select('*');

            if (error) throw error;
            if (data) {
                addTransaction();
                setShowSuccessModal(true);
                resetForm();
                fetchRecentTransactions(transactionType); // Refresh saran
            }
        } catch (error) {
            console.error('Error saving transaction:', error);
            alert('Gagal menyimpan transaksi: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            amount: '',
            category: '',
            description: '',
            person: 'both',
            created_at: new Date().toISOString().split('T')[0]
        });
        setErrors({});
    };

    const closeModal = () => setShowSuccessModal(false);

    const quickAmounts = [10000, 25000, 50000, 100000];
    const setQuickAmount = (amount) => {
        handleChange({ target: { name: 'amount', value: formatCurrencyInput(amount.toString()) } });
    };

    const applySuggestion = (suggestion) => {
        setFormData(prev => ({
            ...prev,
            category: suggestion.category,
            description: suggestion.description,
            person: suggestion.person
        }));
    };

    useEffect(() => {
        let timeoutId;
        if (showSuccessModal) timeoutId = setTimeout(closeModal, 3000);
        return () => clearTimeout(timeoutId);
    }, [showSuccessModal]);

    return (
        <div className="transaction-form-container">
            {/* --- Success Modal --- */}
            {showSuccessModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="success-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-icon">
                            <i className="fas fa-check-circle"></i>
                        </div>
                        <h3>Transaksi Berhasil!</h3>
                        <p>Data {transactionType === 'expense' ? 'pengeluaran' : 'pemasukan'} telah disimpan.</p>
                        <button onClick={closeModal} className="modal-close-btn">
                            Tutup
                        </button>
                    </div>
                </div>
            )}

            {/* --- Form Card --- */}
            <div className="transaction-form-card">
                <header className="form-header">
                    <h1 className="form-title">
                        Catat Transaksi
                    </h1>
                    <p className="form-subtitle">
                        Pilih jenis transaksi dan isi detailnya di bawah ini.
                    </p>
                </header>

                <form onSubmit={handleSubmit} noValidate>
                    {/* --- Type Toggle (BARU) --- */}
                    <div className="form-group">
                        <div className="type-toggle">
                            <button
                                type="button"
                                className={`toggle-btn expense ${transactionType === 'expense' ? 'active' : ''}`}
                                onClick={() => handleTypeChange('expense')}
                            >
                                <i className="fas fa-arrow-up"></i> Pengeluaran
                            </button>
                            <button
                                type="button"
                                className={`toggle-btn income ${transactionType === 'income' ? 'active' : ''}`}
                                onClick={() => handleTypeChange('income')}
                            >
                                <i className="fas fa-arrow-down"></i> Pemasukan
                            </button>
                        </div>
                    </div>

                    {/* Tanggal */}
                    <div className={`form-group ${errors.created_at ? 'has-error' : ''}`}>
                        <label htmlFor="date"><i className="fas fa-calendar-alt"></i> Tanggal</label>
                        <input
                            id="date"
                            type="date"
                            name="created_at"
                            value={formData.created_at}
                            onChange={handleChange}
                            // max={new Date().toISOString().split('T')[0]}
                            className="form-input"
                            required
                        />
                        {errors.created_at && <span className="error-message"><i className="fas fa-exclamation-circle"></i> {errors.created_at}</span>}
                    </div>

                    {/* Amount */}
                    <div className={`form-group ${errors.amount ? 'has-error' : ''}`}>
                        <label htmlFor="amount"><i className="fas fa-money-bill-wave"></i> Jumlah</label>
                        <div className="amount-input-container">
                            <span className="currency-symbol">Rp</span>
                            <input
                                id="amount"
                                type="tel" // 'tel' lebih baik untuk input angka di mobile
                                name="amount"
                                value={formData.amount}
                                onChange={handleAmountChange}
                                className="form-input"
                                placeholder="0"
                                required
                                inputMode="numeric" // Menampilkan keypad numerik di mobile
                            />
                        </div>
                        <div className="quick-amounts">
                            {quickAmounts.map(amount => (
                                <button
                                    key={amount}
                                    type="button"
                                    className="quick-amount-btn"
                                    onClick={() => setQuickAmount(amount)}
                                >
                                    {amount.toLocaleString('id-ID')}
                                </button>
                            ))}
                        </div>
                        {errors.amount && <span className="error-message"><i className="fas fa-exclamation-circle"></i> {errors.amount}</span>}
                    </div>

                    {/* Kategori */}
                    <div className={`form-group ${errors.category ? 'has-error' : ''}`}>
                        <label htmlFor="category"><i className="fas fa-tag"></i> Kategori</label>
                        <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="form-input" // Gunakan style yg sama dgn input
                            required
                        >
                            <option value="">Pilih Kategori</option>
                            {categories.map(category => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </select>
                        {errors.category && <span className="error-message"><i className="fas fa-exclamation-circle"></i> {errors.category}</span>}
                    </div>

                    {/* Untuk Siapa (UI Dirombak) */}
                    <div className="form-group">
                        <label><i className="fas fa-user"></i> Untuk</label>
                        <div className="person-toggle">
                            <div className="person-option">
                                <input type="radio" id="person-both" name="person" value="both" checked={formData.person === 'both'} onChange={handleChange} />
                                <label htmlFor="person-both">Bersama</label>
                            </div>
                            {USER_NAMES.map(name => (
                                <div className="person-option" key={name}>
                                    <input type="radio" id={`person-${name}`} name="person" value={name} checked={formData.person === name} onChange={handleChange} />
                                    <label htmlFor={`person-${name}`}>{name}</label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Keterangan */}
                    <div className="form-group">
                        <label htmlFor="description"><i className="fas fa-align-left"></i> Keterangan (Opsional)</label>
                        <input
                            id="description"
                            type="text"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="form-input"
                            placeholder="Contoh: Makan siang di kantor"
                            maxLength={100}
                        />
                        <div className="char-counter">{formData.description.length}/100</div>
                    </div>

                    {/* Suggestions */}
                    {recentTransactions.length > 0 && (
                        <div className="suggestions-section">
                            <h4 className="suggestions-title"><i className="fas fa-history"></i> Transaksi Serupa</h4>
                            <div className="suggestions-list">
                                {recentTransactions.map((transaction, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        className="suggestion-item"
                                        onClick={() => applySuggestion(transaction)}
                                    >
                                        <span className="suggestion-desc">{transaction.description || 'Tanpa keterangan'}</span>
                                        <span className="suggestion-meta">{transaction.category} • Rp{transaction.amount.toLocaleString('id-ID')}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className={`submit-btn ${transactionType}`}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <><i className="fas fa-spinner fa-spin"></i> Menyimpan...</>
                        ) : (
                            <><i className="fas fa-save"></i> Simpan {transactionType === 'expense' ? 'Pengeluaran' : 'Pemasukan'}</>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default TransactionForm;