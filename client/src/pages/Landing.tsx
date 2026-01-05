export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-800 p-8">
      <header className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold">Presttech Ops — Demo</h1>
        <p className="mt-4 text-lg">Sales ops AIO para SDRs — gestão, propostas, produção e métricas.</p>
        <nav className="mt-6 flex gap-4">
          <a className="text-primary underline" href="#plans">Planos</a>
          <a className="text-primary underline" href="#demos">Demos</a>
          <a className="text-primary underline" href="https://wa.me/551199999999">Contato (WhatsApp)</a>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto mt-12">
        <section id="plans">
          <h2 className="text-2xl font-semibold">Planos</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded">Starter — Básico</div>
            <div className="p-4 border rounded">Business — Comercial</div>
            <div className="p-4 border rounded">Pro — Avançado</div>
          </div>
        </section>

        <section id="demos" className="mt-8">
          <h2 className="text-2xl font-semibold">Demos</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <a className="p-4 border rounded block" href="/templates">Starter Demo</a>
            <a className="p-4 border rounded block" href="/templates">Business Demo</a>
            <a className="p-4 border rounded block" href="/templates">Pro Demo</a>
          </div>
        </section>
      </main>
    </div>
  );
}
