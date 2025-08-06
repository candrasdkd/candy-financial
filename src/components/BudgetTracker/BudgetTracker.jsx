import { useState, useEffect, useCallback } from 'react';
import "./index.css";
import { supabase } from '../../lib/supabaseClient';

const BudgetTracker = () => {
    const [monthlyBudget, setMonthlyBudget] = useState(null);
    const [budgetInput, setBudgetInput] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchBudget = useCallback(async () => {
        const { data, error } = await supabase
            .from('budget_tracker')
            .select('*')
            .single();

        if (error) {
            console.error('Error fetching budget:', error.message);
        } else {
            setMonthlyBudget(data);
            setBudgetInput(formatCurrencyInput(data?.nominal ?? 0));
        }
        setLoading(false);
    }, []);
    const updateBudget = async (newBudget) => {
        const { error } = await supabase
            .from('budget_tracker')
            .update({ nominal: newBudget })
            .eq('id', monthlyBudget.id);

        if (error) {
            setError('Gagal menyimpan anggaran: ' + error.message);
            return false;
        }

        // Update state lokal
        setMonthlyBudget((prev) => ({ ...prev, nominal: newBudget }));
        return true;
    };

    const handleBudgetSubmit = async (e) => {
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

        const success = await updateBudget(newBudget);

        if (success) {
            setError('');
            setSuccessMessage('Anggaran berhasil diperbarui!');
            setIsEditing(false);
            setTimeout(() => setSuccessMessage(''), 1000);
        }
    };

    const formatCurrencyInput = (value) => {
        const numericValue = value.toString().replace(/[^0-9]/g, '');
        return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const handleInputChange = (e) => {
        const formattedValue = formatCurrencyInput(e.target.value);
        setBudgetInput(formattedValue);
        setError('');
    };

    const toggleEdit = () => {
        if (isEditing) {
            setBudgetInput(formatCurrencyInput(monthlyBudget?.nominal ?? 0));
        }
        setIsEditing(!isEditing);
        setError('');
    };
    useEffect(() => {
        window.scrollTo(0, 0);
        fetchBudget();
    }, [fetchBudget]);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="budget-tracker-container">
            <div className="budget-tracker-card">
                <h2 className="budget-title">
                    <i className="fas fa-wallet"></i> Anggaran Bulanan
                </h2>

                {successMessage && (
                    <div className="modal-overlay">
                        <div className="modal-success">
                            <i className="fas fa-check-circle icon-success"></i>
                            <h3>{successMessage}</h3>
                        </div>
                    </div>
                )}


                {!isEditing ? (
                    <div className="budget-display">
                        <div className="current-budget">
                            <h3>Anggaran Bulan Ini:</h3>
                            <p className="budget-amount">Rp {formatCurrencyInput(monthlyBudget?.nominal ?? 0)}</p>
                        </div>
                        <button onClick={toggleEdit} className="edit-btn">
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
                            <button type="submit" className="submit-btn primary">
                                <i className="fas fa-save"></i> Simpan
                            </button>
                            <button type="button" onClick={toggleEdit} className="submit-btn secondary">
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
