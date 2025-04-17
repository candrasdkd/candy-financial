import React, { useEffect, useState } from 'react';
import './index.css';
import { supabase } from '../../lib/supabaseClient';

const TransactionForm = ({ addTransaction }) => {
    const [formData, setFormData] = useState({
        type: 'expense',
        amount: '',
        category: '',
        description: '',
        person: 'both',
        created_at: new Date()
    });
    const [categories, setCategories] = useState({
        income: [],
        expense: []
    })
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const downloadDataCategory = async () => {
        try {
            let { data, error } = await supabase
                .from('transaction_category')
                .select('*')

            if (error) throw error;
            if (data) {
                const incomeCategories = data
                    .filter(category => category.type === 'income')
                    .map(category => category.name);


                const expenseCategories = data
                    .filter(category => category.type === 'expense')
                    .map(category => category.name);

                setCategories({
                    income: incomeCategories,
                    expense: expenseCategories
                });
            }
        } catch (error) {
            alert(error.message.toString())
        }
    }

    const validateForm = () => {
        const newErrors = {};
        const amountValue = parseFloat(formData.amount.replace(/\./g, ''));

        if (!formData.amount || isNaN(amountValue) || amountValue <= 0) {
            newErrors.amount = 'Jumlah harus lebih dari 0';
        }

        if (!formData.category) {
            newErrors.category = 'Kategori tidak boleh kosong';
        }

        if (!formData.created_at) {
            newErrors.created_at = 'Tanggal tidak valid';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    const formatCurrencyInput = (value) => {
        const numericValue = value.replace(/[^0-9]/g, '');
        return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const handleAmountChange = (e) => {
        const formattedValue = formatCurrencyInput(e.target.value);
        handleChange({
            target: {
                name: 'amount',
                value: formattedValue
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setIsSubmitting(true);

        const currentDate = new Date(formData.created_at);
        currentDate.setHours(new Date().getHours());
        currentDate.setMinutes(new Date().getMinutes());
        currentDate.setSeconds(new Date().getSeconds());

        try {
            let { data, error } = await supabase
                .from('transaction_list')
                .insert([
                    {
                        ...formData,
                        created_at: currentDate,
                        amount: formData.amount.replace(/\./g, ''),
                    }
                ])
                .select('*')
            if (error) throw error;
            if (data) {
                addTransaction();
                setShowSuccessModal(true);
                setTimeout(() => setShowSuccessModal(false), 3000);
            }

        } catch (error) {
            alert(error.message.toString())
        } finally {
            // Reset form
            setFormData({
                type: 'expense',
                amount: '',
                category: '',
                description: '',
                person: 'both',
                created_at: new Date()
            });
            setIsSubmitting(false);
        }
    };

    const closeModal = () => setShowSuccessModal(false);

    useEffect(() => {
        downloadDataCategory()
    }, [])

    return (
        <div className="transaction-form-container">
            {/* Success Modal */}
            {showSuccessModal && (
                <div className="modal-overlay">
                    <div className="success-modal">
                        <div className="modal-icon">
                            <i className="fas fa-check-circle"></i>
                        </div>
                        <h3>Transaksi Berhasil!</h3>
                        <p>Data transaksi telah berhasil disimpan.</p>
                        <button onClick={closeModal} className="modal-close-btn">
                            Tutup
                        </button>
                    </div>
                </div>
            )}

            <div className="transaction-form-card">
                <h2 className="form-title">
                    <i className="fas fa-plus-circle"></i> Tambah Transaksi
                </h2>

                <form onSubmit={handleSubmit} noValidate>
                    <div className={`form-group ${errors.created_at ? 'has-error' : ''}`}>
                        <label htmlFor="date">
                            <i className="fas fa-calendar-alt"></i> Tanggal
                        </label>
                        <input
                            id="date"
                            type="date"
                            name="created_at"
                            value={formData.created_at}
                            onChange={handleChange}
                            max={new Date().toISOString().split('T')[0]}
                            className="form-input"
                            required
                        />
                        {errors.created_at && <span className="error-message">{errors.created_at}</span>}
                    </div>

                    <div className="form-group">
                        <label>
                            <i className="fas fa-exchange-alt"></i> Jenis Transaksi
                        </label>
                        <div className="radio-group">
                            <label className="radio-label">
                                <input
                                    type="radio"
                                    name="type"
                                    value="income"
                                    checked={formData.type === 'income'}
                                    onChange={handleChange}
                                    className="radio-input"
                                />
                                <span className="radio-custom"></span>
                                <span className="radio-text">Pemasukan</span>
                            </label>
                            <label className="radio-label">
                                <input
                                    type="radio"
                                    name="type"
                                    value="expense"
                                    checked={formData.type === 'expense'}
                                    onChange={handleChange}
                                    className="radio-input"
                                />
                                <span className="radio-custom"></span>
                                <span className="radio-text">Pengeluaran</span>
                            </label>
                        </div>
                    </div>

                    <div className={`form-group ${errors.amount ? 'has-error' : ''}`}>
                        <label htmlFor="amount">
                            <i className="fas fa-money-bill-wave"></i> Jumlah (Rp)
                        </label>
                        <div className="amount-input-container">
                            <span className="currency-symbol">Rp</span>
                            <input
                                id="amount"
                                type="text"
                                name="amount"
                                value={formData.amount}
                                onChange={handleAmountChange}
                                className="form-input"
                                placeholder="0"
                                required
                            />
                        </div>
                        {errors.amount && <span className="error-message">{errors.amount}</span>}
                    </div>

                    <div className={`form-group ${errors.category ? 'has-error' : ''}`}>
                        <label htmlFor="category">
                            <i className="fas fa-tag"></i> Kategori
                        </label>
                        <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="form-select"
                            required
                        >
                            <option value="">Pilih Kategori</option>
                            {categories[formData.type].map(category => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </select>
                        {errors.category && <span className="error-message">{errors.category}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="person">
                            <i className="fas fa-user"></i> Untuk
                        </label>
                        <select
                            id="person"
                            name="person"
                            value={formData.person}
                            onChange={handleChange}
                            className="form-select"
                        >
                            <option value="both">Bersama</option>
                            <option value="Candra">Candra</option>
                            <option value="Diny">Diny</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">
                            <i className="fas fa-align-left"></i> Keterangan (Opsional)
                        </label>
                        <input
                            id="description"
                            type="text"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="form-input"
                            placeholder="Contoh: Makan siang di restoran"
                        />
                    </div>

                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i> Memproses...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-save"></i> Simpan Transaksi
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default TransactionForm;