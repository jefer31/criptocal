"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface HistoryEntry {
  id: string;
  fecha: string;
  estrategia: string;
  capital: string;
  compra: string;
  venta: string;
  neto: string;
  spread: string;
}

export default function HistoryTable() {
  const [filterType, setFilterType] = useState<'todos' | 'ganancias' | 'perdidas'>('todos');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [user, setUser] = useState<any>(null);

  const fetchHistory = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      const { data, error } = await supabase
        .from('operation_history')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      
      if (data) setHistory(data);
    }
  };

  useEffect(() => {
    fetchHistory();
    
    // Auto-refresh when tab is opened
    const interval = setInterval(fetchHistory, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalOps = history.length;
  const gananciaOps = history.filter(h => parseFloat(h.spread) >= 0).length;
  const perdidaOps = history.filter(h => parseFloat(h.spread) < 0).length;

  const filteredHistory = history.filter(entry => {
    const spreadVal = parseFloat(entry.spread);
    if (filterType === 'ganancias') return spreadVal >= 0;
    if (filterType === 'perdidas') return spreadVal < 0;
    return true;
  });

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar este registro de la nube?')) {
      await supabase.from('operation_history').delete().eq('id', id);
      setHistory(history.filter(h => h.id !== id));
    }
  };

  const handleClearAll = async () => {
    if (confirm('¿Estás seguro de eliminar todo tu historial de la nube? Esto no se puede deshacer.')) {
      if (user) {
        await supabase.from('operation_history').delete().eq('user_id', user.id);
        setHistory([]);
      }
    }
  };

  const exportCSV = () => {
    if (history.length === 0) {
      alert("⚠️ No existen registros para exportar.");
      return;
    }
    let csv = "Fecha/Hora,Ruta de Arbitraje,Capital Inicial,Precio Compra,Precio Venta,Retorno Neto,Spread %\n";
    history.forEach(f => {
      csv += `"${f.fecha}","${f.estrategia}","${f.capital}","${f.compra}","${f.venta}","${f.neto}",${f.spread}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Historial_Arbitraje_Nube.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="dashboard-stats-grid">
        <div className={`stat-card-widget ${filterType === 'todos' ? 'active-filter' : ''}`} onClick={() => setFilterType('todos')}>
          <div className="stat-widget-icon">📋</div>
          <div className="stat-widget-info">
            <span className="stat-label">Total Ops</span>
            <span className="stat-val">{totalOps}</span>
          </div>
        </div>
        <div className={`stat-card-widget ${filterType === 'ganancias' ? 'active-filter' : ''}`} onClick={() => setFilterType('ganancias')}>
          <div className="stat-widget-icon">📈</div>
          <div className="stat-widget-info">
            <span className="stat-label">Ganancias</span>
            <span className="stat-val">{gananciaOps}</span>
          </div>
        </div>
        <div className={`stat-card-widget ${filterType === 'perdidas' ? 'active-filter' : ''}`} onClick={() => setFilterType('perdidas')}>
          <div className="stat-widget-icon">📉</div>
          <div className="stat-widget-info">
            <span className="stat-label">Pérdidas</span>
            <span className="stat-val">{perdidaOps}</span>
          </div>
        </div>
      </div>

      <div className="history-table-wrapper">
        <div className="table-header-actions">
          <h3>Registros en la Nube</h3>
          <div className="actions-right-group">
            <button className="btn-secondary" onClick={exportCSV}>📤 Exportar CSV</button>
            <button className="btn-secondary" onClick={handleClearAll}>🗑️ Borrar Todo</button>
          </div>
        </div>
        <div className="scrollable-table-area">
          <table>
            <thead>
              <tr>
                <th>Fecha / Hora</th>
                <th>Ruta (Origen &rarr; Destino)</th>
                <th>Capital Inicial</th>
                <th>Precio Compra</th>
                <th>Precio Venta</th>
                <th>Resultado Neto</th>
                <th>Spread</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                    No hay registros en la base de datos
                  </td>
                </tr>
              ) : (
                filteredHistory.map(entry => (
                  <tr key={entry.id}>
                    <td>{entry.fecha}</td>
                    <td>{entry.estrategia}</td>
                    <td>{entry.capital}</td>
                    <td>{entry.compra}</td>
                    <td>{entry.venta}</td>
                    <td>
                      <span className={`badge-type ${parseFloat(entry.spread) >= 0 ? 'ganancia' : 'perdida'}`}>
                        {entry.neto}
                      </span>
                    </td>
                    <td style={{ color: parseFloat(entry.spread) >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                      {entry.spread}%
                    </td>
                    <td>
                      <button className="action-delete-row-btn" onClick={() => handleDelete(entry.id)}>🗑️</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
