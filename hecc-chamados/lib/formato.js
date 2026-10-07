import { PRIORIDADE, ENCERRADOS } from './constantes';

const TZ = 'America/Bahia';

const fmtCompleto = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TZ,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const fmtCurto = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TZ,
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

export const dataHora = (d) => fmtCompleto.format(new Date(d));
export const dataCurta = (d) => fmtCurto.format(new Date(d));

export function tempoDesde(d) {
  const min = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h`;
  return `${Math.floor(h / 24)} d`;
}

export function prazo(c) {
  const horas = PRIORIDADE[c.prioridade]?.slaHoras ?? 24;
  const limite = new Date(new Date(c.criado_em).getTime() + horas * 3600000);
  const encerrado = ENCERRADOS.includes(c.status);
  const referencia = encerrado ? new Date(c.resolvido_em || c.atualizado_em) : new Date();
  return { limite, encerrado, vencido: referencia > limite };
}
