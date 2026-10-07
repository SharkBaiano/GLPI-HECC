import Link from 'next/link';

export default function NaoEncontrado() {
  return (
    <div className="vazio">
      <h2>Página ou chamado não encontrado</h2>
      <p className="muted">O endereço pode estar errado, ou este chamado não é seu.</p>
      <Link href="/" className="btn btn-primario">
        Voltar para os chamados
      </Link>
    </div>
  );
}
