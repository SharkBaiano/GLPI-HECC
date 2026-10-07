import { PRIORIDADE, STATUS_L } from '@/lib/constantes';
import { prazo, dataCurta } from '@/lib/formato';

export function PillPrioridade({ v }) {
  return (
    <span className={`pill prio-${v}`}>
      <i className="ponto" aria-hidden="true" />
      {PRIORIDADE[v]?.l ?? v}
    </span>
  );
}

export function PillStatus({ v }) {
  return <span className={`status st-${v}`}>{STATUS_L[v] ?? v}</span>;
}

export function Prazo({ c }) {
  const { limite, vencido, encerrado } = prazo(c);
  if (encerrado) {
    return <span className={vencido ? 'prazo-fim fora' : 'prazo-fim'}>{vencido ? 'Fora do prazo' : 'No prazo'}</span>;
  }
  return (
    <span className={vencido ? 'prazo vencido' : 'prazo'}>
      {vencido ? 'Venceu ' : 'Até '}
      {dataCurta(limite)}
    </span>
  );
}

export function Marca() {
  return (
    <span className="marca">
      <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
        <rect width="32" height="32" rx="7" fill="var(--accent)" />
        <path d="M13 7h6v6h6v6h-6v6h-6v-6H7v-6h6z" fill="var(--accent-ink)" />
      </svg>
      <span className="marca-texto">
        <strong>HECC</strong>
        <small>Hospital Estadual Costa dos Coqueiros</small>
      </span>
    </span>
  );
}
