import React from 'react';
import './index.css'; // Kita akan perbarui file CSS ini

const Navbar = ({ activeTab, setActiveTab, user }) => {
    return (
        <nav className="navbar">
            {/* Container ini akan mengatur lebar maksimum di desktop */}
            <div className="navbar-container">

                {/* Bagian brand/header hanya muncul di tablet/desktop */}
                <div className="navbar-brand">
                    <i className="fas fa-wallet brand-icon"></i>
                    <h1>C&D Finansial</h1>
                </div>

                {/* Bagian navigasi utama */}
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
                        className={activeTab === 'reports' ? 'active' : ''}
                        onClick={() => setActiveTab('reports')}
                    >
                        <i className="fas fa-chart-bar"></i>
                        <span>Laporan</span>
                    </button>
                </div>

                {/* Bagian Profil Pengguna (hanya di tablet/desktop) */}
                <div className="navbar-user">
                    {user ? (
                        <>
                            <span className="user-greeting">Halo, {user.name}</span>
                            <button className="user-avatar" title="Profil Anda">
                                {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt="Avatar" />
                                ) : (
                                    <span>{user.name.charAt(0)}</span> // Tampilkan inisial
                                )}
                            </button>
                        </>
                    ) : (
                        <button className="login-button">Login</button>
                    )}
                </div>

            </div>
        </nav>
    );
};

export default Navbar;