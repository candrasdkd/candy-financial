import React from 'react';
import './index.css';

const Navbar = ({ activeTab, setActiveTab, user }) => {
    return (
        <nav className="navbar">
            {/* Bagian brand/header hanya muncul di desktop */}
            <div className="navbar-brand">
                <h1>C & D Finansial</h1>
            </div>

            {/* Bagian navigasi */}
            <div className="navbar-links">
                <button
                    className={activeTab === 'dashboard' ? 'active' : ''}
                    onClick={() => setActiveTab('dashboard')}
                >
                    <i className="fas fa-home"></i>
                    <span>Dashboard</span>
                </button>
                <button
                    className={activeTab === 'add' ? 'active' : ''}
                    onClick={() => setActiveTab('add')}
                >
                    <i className="fas fa-plus-circle"></i>
                    <span>Tambah</span>
                </button>
                <button
                    className={activeTab === 'transactions' ? 'active' : ''}
                    onClick={() => setActiveTab('transactions')}
                >
                    <i className="fas fa-list"></i>
                    <span>Transaksi</span>
                </button>
                <button
                    className={activeTab === 'budget' ? 'active' : ''}
                    onClick={() => setActiveTab('budget')}
                >
                    <i className="fas fa-wallet"></i>
                    <span>Anggaran</span>
                </button>
                <button
                    className={activeTab === 'reports' ? 'active' : ''}
                    onClick={() => setActiveTab('reports')}
                >
                    <i className="fas fa-chart-bar"></i>
                    <span>Laporan</span>
                </button>
            </div>
        </nav>
    );
};

export default Navbar;