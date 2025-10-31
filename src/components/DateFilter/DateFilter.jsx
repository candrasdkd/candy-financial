import React from 'react';
import PropTypes from 'prop-types'; // Impor PropTypes untuk validasi prop
import './index.css';

const DateFilter = ({ startDate, endDate, onDateChange }) => {
    // Dapatkan tanggal hari ini, di-cache dengan useMemo agar tidak dihitung ulang setiap render
    const today = React.useMemo(() => new Date().toISOString().split('T')[0], []);

    // Pisahkan handler agar lebih jelas
    const handleStartDateChange = (e) => {
        onDateChange('start', e.target.value);
    };

    const handleEndDateChange = (e) => {
        onDateChange('end', e.target.value);
    };

    return (
        <div className="date-filter-container">
            <div className="date-filter">
                <div className="filter-group">
                    <label htmlFor="start-date" className="filter-label">
                        Dari Tanggal:
                    </label>
                    <div className="date-input-wrapper">
                        <input
                            id="start-date"
                            type="date"
                            value={startDate}
                            onChange={handleStartDateChange}
                            // Mencegah tanggal mulai > tanggal akhir ATAU > hari ini
                            max={endDate || today}
                            className="date-input"
                            aria-label="Pilih tanggal mulai"
                        />
                        {/* Ikon kustom dihapus dari JSX. 
                          Kita akan mengandalkan UI date picker bawaan browser.
                        */}
                    </div>
                </div>

                <div className="filter-group">
                    <label htmlFor="end-date" className="filter-label">
                        Sampai Tanggal:
                    </label>
                    <div className="date-input-wrapper">
                        <input
                            id="end-date"
                            type="date"
                            value={endDate}
                            onChange={handleEndDateChange}
                            // Mencegah tanggal akhir < tanggal mulai
                            min={startDate}
                            // Mencegah tanggal akhir > hari ini
                            max={today}
                            className="date-input"
                            aria-label="Pilih tanggal akhir"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

// Tambahkan PropTypes untuk debugging dan dokumentasi
DateFilter.propTypes = {
    startDate: PropTypes.string.isRequired,
    endDate: PropTypes.string.isRequired,
    onDateChange: PropTypes.func.isRequired,
};

export default DateFilter;