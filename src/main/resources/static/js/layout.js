// Monta o menu lateral e a barra do celular em todas as páginas.

const MENU = [
    { titulo: 'Dashboard', icone: 'bi-grid-1x2', endereco: '/index.html', paginas: ['/', '/index.html'] },
    { titulo: 'Chamados', icone: 'bi-ticket-detailed', endereco: '/chamados.html', paginas: ['/chamados.html', '/chamado.html'] },
    { titulo: 'Clientes', icone: 'bi-people', endereco: '/clientes.html', paginas: ['/clientes.html', '/cliente.html'] },
    { titulo: 'Categorias', icone: 'bi-tags', endereco: '/categorias.html', paginas: ['/categorias.html'] },
    { titulo: 'Técnicos', icone: 'bi-person-gear', endereco: '/tecnicos.html', paginas: ['/tecnicos.html'] }
];

function montarLayout() {
    const atual = location.pathname;

    const itens = MENU.map(item => {
        const ativo = item.paginas.includes(atual);
        return '<li><a class="menu-item' + (ativo ? ' ativo' : '') + '" href="' + item.endereco + '"' +
            (ativo ? ' aria-current="page"' : '') + '>' +
            '<i class="bi ' + item.icone + '"></i>' + item.titulo + '</a></li>';
    }).join('');

    const menu = document.createElement('aside');
    menu.className = 'app-menu';
    menu.innerHTML =
        '<a class="menu-marca" href="/index.html">' +
        '<span class="menu-marca-icone"><i class="bi bi-headset"></i></span>Central de Chamados</a>' +
        '<div class="menu-secao">Menu</div>' +
        '<ul class="menu-lista">' + itens + '</ul>' +
        '<div class="menu-rodape"><span class="status-ponto" id="status-api"></span>' +
        '<span id="status-api-texto">Verificando API...</span></div>';

    const topo = document.createElement('header');
    topo.className = 'app-topo';
    topo.innerHTML =
        '<button class="btn btn-light btn-sm" type="button" id="abrir-menu" aria-label="Abrir menu">' +
        '<i class="bi bi-list fs-5 m-0"></i></button>Central de Chamados';

    const fundo = document.createElement('div');
    fundo.className = 'app-fundo-menu';

    document.body.prepend(fundo);
    document.body.prepend(menu);
    document.body.prepend(topo);

    document.getElementById('abrir-menu').addEventListener('click', () => document.body.classList.add('menu-aberto'));
    fundo.addEventListener('click', () => document.body.classList.remove('menu-aberto'));

    verificarApi();
}

// Indicador no rodapé do menu: mostra se o back-end está respondendo
async function verificarApi() {
    const ponto = document.getElementById('status-api');
    const texto = document.getElementById('status-api-texto');
    try {
        await api('GET', '/categorias');
        ponto.classList.add('ok');
        texto.textContent = 'API conectada';
    } catch (e) {
        ponto.classList.add('falha');
        texto.textContent = 'API indisponível';
    }
}

montarLayout();
