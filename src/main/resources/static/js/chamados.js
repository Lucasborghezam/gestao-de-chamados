// Lista de chamados com filtros, ordenação e paginação, e abertura de novos chamados.
// Os filtros ficam na URL, para o Voltar do navegador e o F5 manterem a busca.

const TAMANHO_PAGINA = 10;

const lista = document.getElementById('lista');
const contador = document.getElementById('contador');
const erroPagina = document.getElementById('erro-pagina');
const paginacao = document.getElementById('paginacao');
const filtroStatus = document.getElementById('filtro-status');
const filtroPrioridade = document.getElementById('filtro-prioridade');
const filtroCliente = document.getElementById('filtro-cliente');
const ordenacao = document.getElementById('ordenacao');
const limparFiltros = document.getElementById('limpar-filtros');

const elementoModal = document.getElementById('modal-chamado');
const modal = new bootstrap.Modal(elementoModal);
const formulario = document.getElementById('formulario');
const erroFormulario = document.getElementById('erro-formulario');
const campoTitulo = document.getElementById('titulo');
const campoDescricao = document.getElementById('descricao');
const campoCliente = document.getElementById('cliente');
const campoCategoria = document.getElementById('categoria');

let clientes = [];
let categorias = [];
let paginaAtual = 0;

function lerFiltrosDaUrl() {
    filtroStatus.value = parametroUrl('status') || '';
    filtroPrioridade.value = parametroUrl('prioridade') || '';
    filtroCliente.value = parametroUrl('clienteId') || '';
    ordenacao.value = parametroUrl('sort') || 'dataAbertura,desc';
    paginaAtual = Number(parametroUrl('page')) || 0;
}

function temFiltros() {
    return filtroStatus.value !== '' || filtroPrioridade.value !== '' || filtroCliente.value !== '';
}

function montarConsulta() {
    const consulta = new URLSearchParams();
    if (filtroStatus.value) consulta.set('status', filtroStatus.value);
    if (filtroPrioridade.value) consulta.set('prioridade', filtroPrioridade.value);
    if (filtroCliente.value) consulta.set('clienteId', filtroCliente.value);
    consulta.set('sort', ordenacao.value);
    if (paginaAtual > 0) consulta.set('page', paginaAtual);
    return consulta;
}

async function carregarCadastros() {
    try {
        [clientes, categorias] = await Promise.all([api('GET', '/clientes'), api('GET', '/categorias')]);
        clientes.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        categorias.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        filtroCliente.innerHTML = '<option value="">Todos os clientes</option>' +
            clientes.map(c => '<option value="' + c.id + '">' + escapar(c.nome) + '</option>').join('');
    } catch (erro) {
        mostrarErro(erroPagina, erro);
    }
}

async function carregar() {
    const consulta = montarConsulta();
    history.replaceState(null, '', '/chamados.html' + (consulta.toString() ? '?' + consulta : ''));
    limparFiltros.classList.toggle('d-none', !temFiltros());

    consulta.set('page', paginaAtual);
    consulta.set('size', TAMANHO_PAGINA);
    // Desempate pelo número: chamados criados no mesmo instante ficam sempre na mesma ordem
    consulta.append('sort', 'id,' + ordenacao.value.split(',')[1]);
    try {
        const resultado = await api('GET', '/chamados?' + consulta);
        limparErro(erroPagina);

        // Se a página pedida não existe mais (ex.: depois de filtrar), volta para a primeira
        if (resultado.content.length === 0 && paginaAtual > 0) {
            paginaAtual = 0;
            return carregar();
        }
        renderizar(resultado);
    } catch (erro) {
        lista.innerHTML = '';
        paginacao.innerHTML = '';
        contador.textContent = '';
        mostrarErro(erroPagina, erro);
    }
}

function renderizar(resultado) {
    const total = resultado.totalElements;
    contador.textContent = total + (total === 1 ? ' chamado' : ' chamados');

    if (total === 0) {
        contador.textContent = '';
        paginacao.innerHTML = '';
        lista.innerHTML = temFiltros()
            ? '<div class="vazio"><div class="vazio-icone"><i class="bi bi-funnel"></i></div>' +
              '<div class="vazio-titulo">Nenhum chamado com esses filtros</div>' +
              '<p>Tente outra combinação ou limpe os filtros.</p>' +
              '<button class="btn btn-light border" type="button" onclick="limpar()">Limpar filtros</button></div>'
            : '<div class="vazio"><div class="vazio-icone"><i class="bi bi-ticket-detailed"></i></div>' +
              '<div class="vazio-titulo">Nenhum chamado aberto ainda</div>' +
              '<p>Quando um cliente precisar de ajuda, registre o chamado aqui.</p>' +
              '<button class="btn btn-primary" type="button" onclick="abrirCadastro()">' +
              '<i class="bi bi-plus-lg"></i>Novo chamado</button></div>';
        return;
    }

    const linhas = resultado.content.map(c =>
        '<tr class="linha-clicavel" onclick="location.href=\'/chamado.html?id=' + c.id + '\'">' +
        '<td class="texto-suave">#' + c.id + '</td>' +
        '<td><a class="fw-medium text-reset text-decoration-none" href="/chamado.html?id=' + c.id + '">' + escapar(c.titulo) + '</a>' +
        '<div class="texto-suave small">' + escapar(c.categoria.nome) +
        '<span class="d-lg-none"> · ' + escapar(c.cliente.nome) + '</span></div></td>' +
        '<td class="d-none d-lg-table-cell">' + escapar(c.cliente.nome) + '</td>' +
        '<td class="d-none d-md-table-cell">' + etiqueta(PRIORIDADE, c.prioridade) + '</td>' +
        '<td>' + etiqueta(STATUS, c.status) + '</td>' +
        '<td class="texto-suave d-none d-xl-table-cell">' + (c.tecnico ? escapar(c.tecnico.nome) : 'Não atribuído') + '</td>' +
        '<td class="texto-suave d-none d-md-table-cell text-nowrap">' + formatarData(c.dataAbertura) + '</td>' +
        '</tr>').join('');

    lista.innerHTML =
        '<div class="table-responsive"><table class="table table-hover tabela">' +
        '<thead><tr><th>#</th><th>Chamado</th><th class="d-none d-lg-table-cell">Cliente</th>' +
        '<th class="d-none d-md-table-cell">Prioridade</th><th>Status</th>' +
        '<th class="d-none d-xl-table-cell">Técnico</th><th class="d-none d-md-table-cell">Abertura</th></tr></thead>' +
        '<tbody>' + linhas + '</tbody></table></div>';

    renderizarPaginacao(paginacao, resultado, pagina => {
        paginaAtual = pagina;
        carregar();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function aoFiltrar() {
    paginaAtual = 0;
    carregar();
}

function limpar() {
    filtroStatus.value = '';
    filtroPrioridade.value = '';
    filtroCliente.value = '';
    aoFiltrar();
}

function abrirCadastro() {
    formulario.reset();
    formulario.classList.remove('was-validated');
    limparErro(erroFormulario);
    document.getElementById('descricao-contador').textContent = '0';

    campoCliente.innerHTML = '<option value="">Selecione...</option>' +
        clientes.map(c => '<option value="' + c.id + '">' + escapar(c.nome) + '</option>').join('');
    campoCategoria.innerHTML = '<option value="">Selecione...</option>' +
        categorias.map(c => '<option value="' + c.id + '">' + escapar(c.nome) + '</option>').join('');
    document.getElementById('aviso-cliente').classList.toggle('d-none', clientes.length > 0);
    document.getElementById('aviso-categoria').classList.toggle('d-none', categorias.length > 0);

    // Se a lista estiver filtrada por um cliente, ele já vem selecionado
    if (filtroCliente.value) {
        campoCliente.value = filtroCliente.value;
    }
    modal.show();
}

async function salvar(evento) {
    evento.preventDefault();
    limparErro(erroFormulario);
    if (!formulario.checkValidity()) {
        formulario.classList.add('was-validated');
        return;
    }

    const dados = {
        titulo: campoTitulo.value.trim(),
        descricao: campoDescricao.value.trim(),
        prioridade: formulario.querySelector('input[name="prioridade"]:checked').value,
        clienteId: Number(campoCliente.value),
        categoriaId: Number(campoCategoria.value)
    };

    try {
        const criado = await comCarregamento(document.getElementById('botao-salvar'), () =>
            api('POST', '/chamados', dados));
        modal.hide();
        notificar('Chamado #' + criado.id + ' aberto.');
        paginaAtual = 0;
        await carregar();
    } catch (erro) {
        mostrarErro(erroFormulario, erro);
    }
}

document.getElementById('botao-novo').addEventListener('click', abrirCadastro);
[filtroStatus, filtroPrioridade, filtroCliente, ordenacao].forEach(f => f.addEventListener('change', aoFiltrar));
limparFiltros.addEventListener('click', limpar);
formulario.addEventListener('submit', salvar);
campoDescricao.addEventListener('input', () =>
    document.getElementById('descricao-contador').textContent = campoDescricao.value.length);
elementoModal.addEventListener('shown.bs.modal', () => campoTitulo.focus());

(async () => {
    await carregarCadastros();
    lerFiltrosDaUrl();
    await carregar();
})();
