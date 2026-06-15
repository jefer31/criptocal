'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface CalcHistoryEntry {
  id: string;
  operacion: string;
  resultado: string;
  hora: string;
}

const STORAGE_KEY = 'arbitraje_math_history';
const USER_KEY = 'current_user';

export default function MathCalculator() {
  const [mathExpression, setMathExpression] = useState<string>('');
  const [displayValue, setDisplayValue] = useState<string>('0');
  const [historyDisplay, setHistoryDisplay] = useState<string>('');
  const [calcHistory, setCalcHistory] = useState<CalcHistoryEntry[]>([]);

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${USER_KEY}`);
      if (stored) {
        setCalcHistory(JSON.parse(stored));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Save history to localStorage
  const saveHistory = useCallback((history: CalcHistoryEntry[]) => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_${USER_KEY}`, JSON.stringify(history));
    } catch {
      // ignore storage errors
    }
  }, []);

  const appendCalcValue = (val: string) => {
    if (displayValue === '0' && val !== '.') {
      setDisplayValue(val);
      setMathExpression(val);
    } else {
      setDisplayValue(displayValue + val);
      setMathExpression(mathExpression + val);
    }
  };

  const clearCalcDisplay = () => {
    setDisplayValue('0');
    setMathExpression('');
    setHistoryDisplay('');
  };

  const backspaceCalc = () => {
    if (displayValue.length <= 1) {
      setDisplayValue('0');
      setMathExpression('');
    } else {
      const newVal = displayValue.slice(0, -1);
      setDisplayValue(newVal);
      setMathExpression(mathExpression.slice(0, -1));
    }
  };

  // Safe recursive descent parser — NO eval/Function used
  const safeMathEval = (expr: string): number => {
    const sanitized = expr.replace(/\s/g, '');
    if (!/^[0-9+\-*/.()]+$/.test(sanitized)) {
      throw new Error('Expresión inválida');
    }
    let pos = 0;
    const peek = () => sanitized[pos];
    const next = () => sanitized[pos++];

    // Grammar: expr = term (('+' | '-') term)*
    const parseExpr = (): number => {
      let result = parseTerm();
      while (peek() === '+' || peek() === '-') {
        const op = next();
        const right = parseTerm();
        result = op === '+' ? result + right : result - right;
      }
      return result;
    };

    // term = factor (('*' | '/') factor)*
    const parseTerm = (): number => {
      let result = parseFactor();
      while (peek() === '*' || peek() === '/') {
        const op = next();
        const right = parseFactor();
        if (op === '/' && right === 0) throw new Error('División por cero');
        result = op === '*' ? result * right : result / right;
      }
      return result;
    };

    // factor = ['-'] ( '(' expr ')' | number )
    const parseFactor = (): number => {
      if (peek() === '-') {
        next();
        return -parseFactor();
      }
      if (peek() === '(') {
        next(); // skip '('
        const result = parseExpr();
        if (peek() === ')') next(); // skip ')'
        return result;
      }
      // Parse number
      let numStr = '';
      while (pos < sanitized.length && (/[0-9.]/).test(peek())) {
        numStr += next();
      }
      if (!numStr) throw new Error('Expresión inválida');
      return parseFloat(numStr);
    };

    const result = parseExpr();
    if (pos < sanitized.length) throw new Error('Sintaxis inválida');
    return result;
  };

  const executeMathCalcResult = () => {
    if (!mathExpression) return;
    try {
      const result = safeMathEval(mathExpression);
      if (!isFinite(result)) throw new Error('Resultado infinito');
      const resultStr = String(result);

      setHistoryDisplay(mathExpression + ' =');
      setDisplayValue(resultStr);

      const entry: CalcHistoryEntry = {
        id: Date.now().toString(),
        operacion: mathExpression,
        resultado: resultStr,
        hora: new Date().toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      };

      const newHistory = [entry, ...calcHistory];
      setCalcHistory(newHistory);
      saveHistory(newHistory);

      setMathExpression(resultStr);
    } catch {
      setDisplayValue('Error');
      setMathExpression('');
    }
  };

  const loadFromHistory = (entry: CalcHistoryEntry) => {
    setDisplayValue(entry.resultado);
    setMathExpression(entry.resultado);
    setHistoryDisplay(entry.operacion + ' =');
  };

  const clearHistory = () => {
    setCalcHistory([]);
    saveHistory([]);
  };

  const buttons: { label: string; className: string; action: () => void }[] = [
    { label: 'C', className: 'math-btn clear-op', action: clearCalcDisplay },
    { label: '⌫', className: 'math-btn clear-op', action: backspaceCalc },
    { label: '/', className: 'math-btn operator', action: () => appendCalcValue('/') },
    { label: '*', className: 'math-btn operator', action: () => appendCalcValue('*') },
    { label: '7', className: 'math-btn', action: () => appendCalcValue('7') },
    { label: '8', className: 'math-btn', action: () => appendCalcValue('8') },
    { label: '9', className: 'math-btn', action: () => appendCalcValue('9') },
    { label: '-', className: 'math-btn operator', action: () => appendCalcValue('-') },
    { label: '4', className: 'math-btn', action: () => appendCalcValue('4') },
    { label: '5', className: 'math-btn', action: () => appendCalcValue('5') },
    { label: '6', className: 'math-btn', action: () => appendCalcValue('6') },
    { label: '+', className: 'math-btn operator', action: () => appendCalcValue('+') },
    { label: '1', className: 'math-btn', action: () => appendCalcValue('1') },
    { label: '2', className: 'math-btn', action: () => appendCalcValue('2') },
    { label: '3', className: 'math-btn', action: () => appendCalcValue('3') },
    { label: '=', className: 'math-btn equals-op', action: executeMathCalcResult },
    { label: '0', className: 'math-btn', action: () => appendCalcValue('0') },
    { label: '.', className: 'math-btn', action: () => appendCalcValue('.') },
  ];

  return (
    <div className="standard-calc">
      {/* Calculator Widget */}
      <div className="math-calculator-widget">
        <div className="math-calc-screen">
          <div className="expression-history">{historyDisplay || '\u00A0'}</div>
          <div className="main-display-num">{displayValue}</div>
        </div>
        <div className="math-calc-grid-buttons">
          {buttons.map((btn) => (
            <button key={btn.label} className={btn.className} onClick={btn.action}>
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* History Panel */}
      <div className="calc-panel-box">
        <div className="panel-title-bar">
          <span>Historial</span>
          <button className="btn-secondary" onClick={clearHistory}>
            Vaciar
          </button>
        </div>
        <div>
          {calcHistory.length === 0 ? (
            <p style={{ textAlign: 'center', opacity: 0.6, padding: '1rem' }}>
              Sin cálculos recientes
            </p>
          ) : (
            calcHistory.map((entry) => (
              <div
                key={entry.id}
                className="result-row-item"
                onClick={() => loadFromHistory(entry)}
                style={{ cursor: 'pointer' }}
              >
                <div>
                  <strong>{entry.operacion}</strong> = {entry.resultado}
                </div>
                <small>{entry.hora}</small>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
