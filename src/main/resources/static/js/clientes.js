// Tela de Clientes: lista e busca. Cadastro, edição e exclusão vêm de formulario-cliente.js.

let clientes = [];

const lista = document.getElementById('lista');
const busca = document.getElementById('busca');
const contador = document.getElementById('contador');
const erroPagina = document.getElementById('erro-pagina');

async function carregar() {
    try {
        clientes = await api('GET', '/clientes');
        clientes.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        limparErro(erroPagina);
        renderizar();
    } catch (erro) {
        lista.innerHTML = '';
        contador.textContent = '';
        mostrarErro(erroPagina, erro);
    }
}

function renderizar() {
    const termo = busca.value.trim().toLowerCase();
    const digitos = termo.replace(/\D/g, '');
    const filtrados = clientes.filter(c =>
        c.nome.toLowerCase().includes(termo) ||
        c.email.toLowerCase().includes(termo) ||
        (digitos !== '' && (c.telefone || '').replace(/\D/g, '').includes(digitos)));

    if (clientes.length === 0) {
        contador.textContent = '';
        lista.innerHTML =
            '<div class="vazio"><div class="vazio-icone"><i class="bi bi-people"></i></div>' +
            '<div class="vazio-titulo">Nenhum cliente cadastrado</div>' +
            '<p>Cadastre os clientes para poder abrir chamados em nome deles.</p>' +
            '<button class="btn btn-primary" type="button" onclick="novoCliente()">' +
            '<i class="bi bi-plus-lg"></i>Novo cliente</button></div>';
        return;
    }

    contador.textContent = filtrados.length === clientes.length
        ? clientes.length + (clientes.length === 1 ? ' cliente' : ' clientes')
        : filtrados.length + ' de ' + clientes.length;

    if (filtrados.length === 0) {
        lista.innerHTML =
            '<div class="vazio"><div class="vazio-icone"><i class="bi bi-search"></i></div>' +
            '<div class="vazio-titulo">Nenhum resultado</div>' +
            '<p class="mb-0">Nenhum cliente corresponde a "' + escapar(busca.value) + '".</p></div>';
        return;
    }

    const linhas = filtrados.map(c =>
        '<tr class="linha-clicavel" onclick="verCliente(' + c.id + ')">' +
        '<td><div class="pessoa"><span class="avatar" aria-hidden="true">' + escapar(iniciais(c.nome)) + '</span>' +
        '<div><a class="fw-medium text-reset text-decoration-none" href="/cliente.html?id=' + c.id + '">' + escapar(c.nome) + '</a>' +
        '<div class="texto-suave small d-md-none">' + escapar(c.email) + '</div></div></div></td>' +
        '<td class="texto-suave d-none d-md-table-cell">' + escapar(c.email) + '</td>' +
        '<td class="texto-suave d-none d-lg-table-cell">' + escapar(formatarTelefone(c.telefone)) + '</td>' +
        '<td class="coluna-acoes" onclick="event.stopPropagation()">' +
        '<button class="botao-icone" type="button" title="Editar" aria-label="Editar ' + escapar(c.nome) + '" onclick="editarCliente(' + c.id + ')">' +
        '<i class="bi bi-pencil"></i></button>' +
        '<button class="botao-icone perigo" type="button" title="Excluir" aria-label="Excluir ' + escapar(c.nome) + '" onclick="removerCliente(' + c.id + ')">' +
        '<i class="bi bi-trash3"></i></button>' +
        '</td></tr>').join('');

    lista.innerHTML =
        '<div class="table-responsive"><table class="table table-hover tabela">' +
        '<thead><tr><th>Nome</th><th class="d-none d-md-table-cell">E-mail</th>' +
        '<th class="d-none d-lg-table-cell">Telefone</th><th class="coluna-acoes">Ações</th></tr></thead>' +
        '<tbody>' + linhas + '</tbody></table></div>';
}

function verCliente(id) {
    location.href = '/cliente.html?id=' + id;
}

function novoCliente() {
    abrirFormularioCliente(null, carregar);
}

function editarCliente(id) {
    abrirFormularioCliente(clientes.find(c => c.id === id), carregar);
}

async function removerCliente(id) {
    if (await excluirCliente(clientes.find(c => c.id === id))) {
        await carregar();
    }
}

document.getElementById('botao-novo').addEventListener('click', novoCliente);
busca.addEventListener('input', renderizar);

carregar();
