import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './FilterModal.css';

const CATEGORIES = [
  'Concerts', 'Festivals', 'Théâtre & Humour', 'Cinéma',
  'Sport', 'Divertissement', 'Jeune Public', 'Salon & Formation',
];

const CITIES = [
  'Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger',
  'Agadir', 'Meknès', 'Oujda',
];

const CATEGORY_SLUGS = {
  'Concerts': 'concerts', 'Festivals': 'festivals',
  'Théâtre & Humour': 'theatre-humour', 'Cinéma': 'cinema',
  'Sport': 'sport', 'Divertissement': 'divertissement',
  'Jeune Public': 'jeune-public', 'Salon & Formation': 'salon-formation',
};

const TIME_OPTIONS = [
  { label: "Aujourd'hui", value: 'today' },
  { label: 'Cette semaine', value: 'week' },
  { label: 'Ce weekend', value: 'weekend' },
  { label: 'Ce mois-ci', value: 'month' },
];

export default function FilterModal({ isOpen, onClose }) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const navigate = useNavigate();

  function handleReset() {
    setSelectedCategory('');
    setSelectedCity('');
    setSelectedTime('');
  }

  function handleApply() {
    const params = new URLSearchParams();
    if (selectedCity) params.set('city', selectedCity);
    if (selectedTime) params.set('time', selectedTime);

    if (selectedCategory) {
      const slug = CATEGORY_SLUGS[selectedCategory] || selectedCategory;
      navigate(`/category/${slug}?${params.toString()}`);
    } else {
      navigate(`/?${params.toString()}`);
    }
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Filtres</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="filter-group">
            <label className="filter-label">Catégorie</label>
            <select
              className="filter-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Toutes les catégories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Ville</label>
            <select
              className="filter-select"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
            >
              <option value="">Toutes les villes</option>
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Période</label>
            <div className="filter-time-grid">
              <button className="filter-time-picker">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Choisir dans le calendrier
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginLeft:'auto'}}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {TIME_OPTIONS.map((opt) => {
                const isSelected = selectedTime === opt.value;
                return (
                  <label key={opt.value} className={`filter-checkbox ${isSelected ? 'selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => setSelectedTime(isSelected ? '' : opt.value)}
                    />
                    <span className="checkmark" />
                    {opt.label}
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-outline" onClick={handleReset}>Réinitialiser</button>
          <button className="btn-primary" onClick={handleApply}>Appliquer les filtres</button>
        </div>
      </div>
    </div>
  );
}
