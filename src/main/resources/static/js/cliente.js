// Detalhe do cliente: dados de contato e os chamados dele, com paginação.

const id = parametroUrl('id');
const conteudo = document.getElementById('conteudo');
const erroPagina = document.getElementById('erro-pagina');
const TAMANHO_PAGINA = 5;

let cliente = null;

async function carregar() {
    try {
        cliente = await api('GET', '/clientes/' + id);
    } catch (erro) {
        conteudo.innerHTML =
            '<div class="cartao"><div class="vazio"><div class="vazio-icone"><i class="bi bi-person-x"></i></div>' +
            '<div class="vazio-titulo">Cliente não encontrado</div>' +
            '<p>' + escapar(erro.message) + '</p>' +
            '<a class="btn btn-primary" href="/clientes.html">Voltar para clientes</a></div></div>';
        return;
    }

    document.title = cliente.nome + ' · Central de Chamados';
    conteudo.innerHTML =
        '<div class="pagina-cabecalho">' +
        '<div class="pessoa"><span class="avatar avatar-grande" aria-hidden="true">' + escapar(iniciais(cliente.nome)) + '</span>' +
        '<div><h1 class="pagina-titulo">' + escapar(cliente.nome) + '</h1>' +
        '<p class="pagina-subtitulo">Cliente #' + cliente.id + '</p></div></div>' +
        '<div class="d-flex gap-2">' +
        '<button class="btn btn-light border" type="button" id="botao-editar"><i class="bi bi-pencil"></i>Editar</button>' +
        '<button class="btn btn-outline-danger" type="button" id="botao-excluir"><i class="bi bi-trash3"></i>Excluir</button>' +
        '</div></div>' +

        '<div class="row g-4">' +
        '<div class="col-lg-4">' +
        '<div class="cartao mb-4"><div class="cartao-cabecalho"><h2 class="cartao-titulo">Contato</h2></div>' +
        '<dl class="info-lista">' +
        '<dt>E-mail</dt><dd><a href="mailto:' + escapar(cliente.email) + '">' + escapar(cliente.email) + '</a></dd>' +
        '<dt>Telefone</dt><dd>' + escapar(formatarTelefone(cliente.telefone)) + '</dd>' +
        '</dl></div>' +
        '<div class="cartao p-4"><div class="texto-suave small fw-semibold text-uppercase">Total de chamados</div>' +
        '<div class="numero-destaque mt-1" id="total-chamados">—</div></div>' +
        '</div>' +

        '<div class="col-lg-8"><div class="cartao">' +
        '<div class="cartao-cabecalho"><h2 class="cartao-titulo">Chamados</h2></div>' +
        '<div id="chamados"><div class="carregando"><span class="spinner-border spinner-border-sm"></span>Carregando chamados...</div></div>' +
        '<div id="paginacao"></div>' +
        '</div></div></div>';

    document.getElementById('botao-editar').addEventListener('click', () =>
        abrirFormularioCliente(cliente, carregar));
    document.getElementById('botao-excluir').addEventListener('click', async () => {
        if (await excluirCliente(cliente)) {
            setTimeout(() => location.href = '/clientes.html', 800);
        }
    });

    await carregarChamados(0);
}

async function carregarChamados(pagina) {
    const area = document.getElementById('chamados');
    try {
        const resultado = await api('GET', '/clientes/' + id + '/chamados?page=' + pagina + '&size=' + TAMANHO_PAGINA);
        document.getElementById('total-chamados').textContent = resultado.totalElements;

        if (resultado.totalElements === 0) {
            area.innerHTML =
                '<div class="vazio"><div class="vazio-icone"><i class="bi bi-ticket-detailed"></i></div>' +
                '<div class="vazio-titulo">Nenhum chamado</div>' +
                '<p class="mb-0">Este cliente ainda não abriu chamados.</p></div>';
            document.getElementById('paginacao').innerHTML = '';
            return;
        }

        const linhas = resultado.content.map(c =>
            '<tr class="linha-clicavel" onclick="location.href=\'/chamado.html?id=' + c.id + '\'">' +
            '<td class="texto-suave">#' + c.id + '</td>' +
            '<td><a class="fw-medium text-reset text-decoration-none" href="/chamado.html?id=' + c.id + '">' + escapar(c.titulo) + '</a>' +
            '<div class="texto-suave small d-md-none">' + formatarData(c.dataAbertura) + '</div></td>' +
            '<td>' + etiqueta(PRIORIDADE, c.prioridade) + '</td>' +
            '<td>' + etiqueta(STATUS, c.status) + '</td>' +
            '<td class="texto-suave d-none d-md-table-cell">' + formatarData(c.dataAbertura) + '</td>' +
            '</tr>').join('');

        area.innerHTML =
            '<div class="table-responsive"><table class="table table-hover tabela">' +
            '<thead><tr><th>#</th><th>Título</th><th>Prioridade</th><th>Status</th>' +
            '<th class="d-none d-md-table-cell">Abertura</th></tr></thead>' +
            '<tbody>' + linhas + '</tbody></table></div>';
        renderizarPaginacao(document.getElementById('paginacao'), resultado, carregarChamados);
    } catch (erro) {
        area.innerHTML = '';
        mostrarErro(erroPagina, erro);
    }
}

carregar();
