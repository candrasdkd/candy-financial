import React from 'react';
import './index.css';

const DateFilter = ({ startDate, endDate, onDateChange }) => {
    const today = new Date().toISOString().split('T')[0];
    
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
                            onChange={(e) => onDateChange('start', e.target.value)}
                            max={endDate || today}
                            className="date-input"
                            aria-label="Pilih tanggal mulai"
                        />
                        <span className="date-icon">
                            <i className="fas fa-calendar-alt"></i>
                        </span>
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
                            onChange={(e) => onDateChange('end', e.target.value)}
                            min={startDate}
                            max={today}
                            className="date-input"
                            aria-label="Pilih tanggal akhir"
                        />
                        <span className="date-icon">
                            <i className="fas fa-calendar-alt"></i>
                        </span>
                    </div>
                </div>
                
            </div>
        </div>
    );
};

export default DateFilter;