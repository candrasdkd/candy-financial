import React, { useState, useEffect } from 'react';
import "./index.css";

const BudgetTracker = ({ monthlyBudget, setMonthlyBudget }) => {
    const [budgetInput, setBudgetInput] = useState(monthlyBudget > 0 ? monthlyBudget.toString() : '');
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        setBudgetInput(monthlyBudget.toString());
    }, [monthlyBudget]);

    const handleBudgetSubmit = (e) => {
        e.preventDefault();
        const newBudget = parseFloat(budgetInput.replace(/\./g, ''));

        if (isNaN(newBudget)) {
            setError('Masukkan angka yang valid');
            return;
        }

        if (newBudget < 0) {
            setError('Anggaran tidak boleh negatif');
            return;
        }

        setMonthlyBudget(newBudget);
        setError('');
        setSuccessMessage('Anggaran berhasil diperbarui!');
        setIsEditing(false);

        setTimeout(() => {
            setSuccessMessage('');
        }, 3000);
    };

    const formatCurrencyInput = (value) => {
        // Remove non-numeric characters
        const numericValue = value.replace(/[^0-9]/g, '');

        // Format with thousand separators
        return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const handleInputChange = (e) => {
        const formattedValue = formatCurrencyInput(e.target.value);
        setBudgetInput(formattedValue);
        setError('');
    };

    const toggleEdit = () => {
        setIsEditing(!isEditing);
        setError('');
    };

    return (
        <div className="budget-tracker-container">
            <div className="budget-tracker-card">
                <h2 className="budget-title">
                    <i className="fas fa-wallet"></i> Anggaran Bulanan
                </h2>

                {successMessage && (
                    <div className="success-message">
                        <i className="fas fa-check-circle"></i> {successMessage}
                    </div>
                )}

                {!isEditing ? (
                    <div className="budget-display">
                        <div className="current-budget">
                            <h3>Anggaran Bulan Ini:</h3>
                            <p className="budget-amount">Rp {monthlyBudget.toLocaleString('id-ID')}</p>
                        </div>
                        <button
                            onClick={toggleEdit}
                            className="edit-btn"
                            aria-label="Edit budget"
                        >
                            <i className="fas fa-edit"></i> Ubah Anggaran
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleBudgetSubmit} className="budget-form">
                        <div className={`form-group ${error ? 'has-error' : ''}`}>
                            <label htmlFor="budgetInput">Anggaran Bulanan (Rp)</label>
                            <div className="input-with-icon">
                                <span className="currency-icon">Rp</span>
                                <input
                                    id="budgetInput"
                                    type="text"
                                    value={budgetInput}
                                    onChange={handleInputChange}
                                    className="budget-input"
                                    placeholder="0"
                                    autoFocus
                                />
                            </div>
                            {error && <span className="error-message">{error}</span>}
                        </div>

                        <div className="form-actions">
                            <button
                                type="submit"
                                className="submit-btn primary"
                            >
                                <i className="fas fa-save"></i> Simpan
                            </button>
                            <button
                                type="button"
                                onClick={toggleEdit}
                                className="submit-btn secondary"
                            >
                                <i className="fas fa-times"></i> Batal
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default BudgetTracker;