export function NaoEncontrado({ contexto }: { contexto?: "participar" | "admin" }) {
  return (
    <div className="pagina">
      <main className="pagina__conteudo">
        <div className="cartao">
          <h1>Página não encontrada</h1>
          {contexto === "participar" ? (
            <p>
              Para participar da pesquisa, use o link de convite individual que
              foi enviado a você.
            </p>
          ) : (
            <p>O endereço acessado não existe nesta plataforma.</p>
          )}
        </div>
      </main>
    </div>
  );
}
