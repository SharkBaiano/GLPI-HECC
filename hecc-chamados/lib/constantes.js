// Níveis de prioridade e prazo de atendimento (em horas). Ajuste o slaHoras à realidade da equipe.
export const PRIORIDADES = [
  {
    v: 'critica',
    l: 'Crítica',
    slaHoras: 1,
    dica: 'Parou o atendimento ao paciente ou um setor crítico (PS, UTI, Centro Cirúrgico).',
  },
  {
    v: 'alta',
    l: 'Alta',
    slaHoras: 4,
    dica: 'Impede o trabalho de uma pessoa ou equipe e não há alternativa.',
  },
  {
    v: 'media',
    l: 'Média',
    slaHoras: 8,
    dica: 'Atrapalha o trabalho, mas dá para seguir de outro jeito.',
  },
  {
    v: 'baixa',
    l: 'Baixa',
    slaHoras: 24,
    dica: 'Dúvida, pedido ou melhoria sem urgência.',
  },
];
export const PRIORIDADE = Object.fromEntries(PRIORIDADES.map((p) => [p.v, p]));

export const STATUS = [
  { v: 'aberto', l: 'Aberto' },
  { v: 'em_atendimento', l: 'Em atendimento' },
  { v: 'aguardando', l: 'Aguardando solicitante' },
  { v: 'resolvido', l: 'Resolvido' },
  { v: 'fechado', l: 'Fechado' },
];
export const STATUS_L = Object.fromEntries(STATUS.map((s) => [s.v, s.l]));
export const ENCERRADOS = ['resolvido', 'fechado'];

export const PERFIS = [
  { v: 'usuario', l: 'Usuário' },
  { v: 'tecnico', l: 'Técnico' },
  { v: 'admin', l: 'Administrador' },
];
export const PERFIL_L = Object.fromEntries(PERFIS.map((p) => [p.v, p.l]));

export const CATEGORIAS = [
  'Computador / Notebook',
  'Impressora / Etiquetadora',
  'Rede / Internet / Wi-Fi',
  'Sistema hospitalar / Prontuário',
  'Acesso / Senha / E-mail',
  'Telefonia / Ramal',
  'Equipamento médico (Engenharia Clínica)',
  'Manutenção predial',
  'Outros',
];

export const SETORES = [
  'Pronto-Socorro',
  'UTI Adulto',
  'UTI Neonatal',
  'Centro Cirúrgico',
  'Centro Obstétrico',
  'Clínica Médica',
  'Clínica Cirúrgica',
  'Maternidade / Alojamento Conjunto',
  'Pediatria',
  'Ambulatório',
  'Laboratório',
  'Imagem / Radiologia',
  'Farmácia',
  'CME',
  'Nutrição',
  'Recepção',
  'NIR (Regulação de Leitos)',
  'SAME / Arquivo',
  'Faturamento',
  'Financeiro',
  'Compras / Almoxarifado',
  'Recursos Humanos',
  'Qualidade',
  'SCIH',
  'Diretoria',
  'Manutenção',
  'Tecnologia da Informação',
  'Outro',
];

// Expressão SQL com o prazo em horas de cada prioridade (usa a tabela "c").
export const SQL_SLA_HORAS = `CASE c.prioridade ${PRIORIDADES.map(
  (p) => `WHEN '${p.v}' THEN ${p.slaHoras}`
).join(' ')} END`;

export const SQL_ORDEM_PRIORIDADE = `CASE c.prioridade ${PRIORIDADES.map(
  (p, i) => `WHEN '${p.v}' THEN ${i}`
).join(' ')} END`;
