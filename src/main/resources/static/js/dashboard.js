// Dashboard: contagem de chamados por status e prioridade, últimos chamados e atalhos.
// As contagens usam o totalElements da busca paginada, pedindo só 1 item por consulta.

const ICONES_STATUS = {
    ABERTO: 'bi-inbox',
    EM_ATENDIMENTO: 'bi-tools',
    AGUARDANDO_CLIENTE: 'bi-hourglass-split',
    FECHADO: 'bi-check2-circle'
};

const erroPagina = document.getElementById('erro-pagina');

function contar(filtro) {
    return api('GET', '/chamados?size=1&' + filtro).then(r => r.totalElements);
}

function renderizarIndicadores(porStatus) {
    document.getElementById('indicadores').innerHTML = Object.keys(STATUS).map(s =>
        '<div class="col-6 col-xl-3">' +
        '<a class="cartao indicador" href="/chamados.html?status=' + s + '">' +
        '<span class="indicador-icone bg-' + STATUS[s].cor + '-subtle text-' + STATUS[s].cor + '-emphasis">' +
        '<i class="bi ' + ICONES_STATUS[s] + '"></i></span>' +
        '<span class="indicador-rotulo">' + STATUS[s].rotulo + '</span>' +
        '<span class="indicador-valor" data-status="' + s + '">' + (porStatus ? porStatus[s] : '—') + '</span>' +
        '</a></div>').join('');
}

function renderizarResumo(porStatus) {
    const total = Object.values(porStatus).reduce((a, b) => a + b, 0);
    const pendentes = total - porStatus.FECHADO;
    document.getElementById('resumo').textContent = total === 0
        ? 'Nenhum chamado registrado ainda.'
        : total + (total === 1 ? ' chamado registrado, ' : ' chamados registrados, ') +
          pendentes + ' ainda em aberto.';
}

function renderizarPrioridades(porPrioridade) {
    const maior = Math.max(...Object.values(porPrioridade), 1);
    document.getElementById('prioridades').innerHTML = Object.keys(PRIORIDADE).map(p => {
        const valor = porPrioridade[p];
        return '<a class="barra" href="/chamados.html?prioridade=' + p + '" title="' +
            PRIORIDADE[p].rotulo + ': ' + valor + (valor === 1 ? ' chamado' : ' chamados') + '">' +
            '<span class="barra-rotulo">' + PRIORIDADE[p].rotulo + '</span>' +
            '<span class="barra-trilho"><span class="barra-preenchida" style="width:' + (valor / maior * 100) + '%"></span></span>' +
            '<span class="barra-valor">' + valor + '</span></a>';
    }).join('');
}

function renderizarUltimos(chamados) {
    const area = document.getElementById('ultimos');
    if (chamados.length === 0) {
        area.innerHTML =
            '<div class="vazio"><div class="vazio-icone"><i class="bi bi-ticket-detailed"></i></div>' +
            '<div class="vazio-titulo">Nenhum chamado ainda</div>' +
            '<p>Os chamados abertos mais recentes aparecerão aqui.</p>' +
            '<a class="btn btn-primary" href="/chamados.html?novo=1"><i class="bi bi-plus-lg"></i>Novo chamado</a></div>';
        return;
    }

    const linhas = chamados.map(c =>
        '<tr class="linha-clicavel" onclick="location.href=\'/chamado.html?id=' + c.id + '\'">' +
        '<td class="texto-suave">#' + c.id + '</td>' +
        '<td><a class="fw-medium text-reset text-decoration-none" href="/chamado.html?id=' + c.id + '">' + escapar(c.titulo) + '</a>' +
        '<div class="texto-suave small">' + escapar(c.cliente.nome) + '</div></td>' +
        '<td class="d-none d-md-table-cell">' + etiqueta(PRIORIDADE, c.prioridade) + '</td>' +
        '<td>' + etiqueta(STATUS, c.status) + '</td>' +
        '<td class="texto-suave d-none d-sm-table-cell text-nowrap">' + formatarData(c.dataAbertura) + '</td>' +
        '</tr>').join('');

    area.innerHTML =
        '<div class="table-responsive"><table class="table table-hover tabela mb-0">' +
        '<thead><tr><th>#</th><th>Chamado</th><th class="d-none d-md-table-cell">Prioridade</th>' +
        '<th>Status</th><th class="d-none d-sm-table-cell">Abertura</th></tr></thead>' +
        '<tbody>' + linhas + '</tbody></table></div>';
}

function renderizarCadastros(clientes, tecnicos, categorias) {
    const itens = [
        { rotulo: 'Clientes', icone: 'bi-people', total: clientes.length, link: '/clientes.html' },
        { rotulo: 'Técnicos', icone: 'bi-person-gear', total: tecnicos.length, link: '/tecnicos.html' },
        { rotulo: 'Categorias', icone: 'bi-tags', total: categorias.length, link: '/categorias.html' }
    ];
    document.getElementById('cadastros').innerHTML = itens.map(i =>
        '<a class="atalho" href="' + i.link + '">' +
        '<span class="atalho-icone"><i class="bi ' + i.icone + '"></i></span>' +
        '<span class="flex-grow-1">' + i.rotulo + '</span>' +
        '<span class="atalho-total">' + i.total + '</span>' +
        '<i class="bi bi-chevron-right texto-suave"></i></a>').join('');
}

async function carregar() {
    renderizarIndicadores(null);
    try {
        const status = Object.keys(STATUS);
        const prioridades = Object.keys(PRIORIDADE);
        const [contagemStatus, contagemPrioridade, ultimos, clientes, tecnicos, categorias] = await Promise.all([
            Promise.all(status.map(s => contar('status=' + s))),
            Promise.all(prioridades.map(p => contar('prioridade=' + p))),
            api('GET', '/chamados?size=5&sort=dataAbertura,desc&sort=id,desc'),
            api('GET', '/clientes'),
            api('GET', '/tecnicos'),
            api('GET', '/categorias')
        ]);

        const porStatus = Object.fromEntries(status.map((s, i) => [s, contagemStatus[i]]));
        const porPrioridade = Object.fromEntries(prioridades.map((p, i) => [p, contagemPrioridade[i]]));

        renderizarIndicadores(porStatus);
        renderizarResumo(porStatus);
        renderizarPrioridades(porPrioridade);
        renderizarUltimos(ultimos.content);
        renderizarCadastros(clientes, tecnicos, categorias);
    } catch (erro) {
        document.getElementById('ultimos').innerHTML = '';
        mostrarErro(erroPagina, erro);
    }
}

carregar();
