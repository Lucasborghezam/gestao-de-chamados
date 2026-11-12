// Tela de Categorias: lista, busca, cadastro, edição e exclusão.

let categorias = [];
let idEmEdicao = null;

const lista = document.getElementById('lista');
const busca = document.getElementById('busca');
const contador = document.getElementById('contador');
const erroPagina = document.getElementById('erro-pagina');

const elementoModal = document.getElementById('modal-categoria');
const modal = new bootstrap.Modal(elementoModal);
const formulario = document.getElementById('formulario');
const erroFormulario = document.getElementById('erro-formulario');
const campoNome = document.getElementById('nome');
const campoDescricao = document.getElementById('descricao');
const contadorDescricao = document.getElementById('descricao-contador');

async function carregar() {
    try {
        categorias = await api('GET', '/categorias');
        categorias.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
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
    const filtradas = categorias.filter(c =>
        c.nome.toLowerCase().includes(termo) || (c.descricao || '').toLowerCase().includes(termo));

    contador.textContent = filtradas.length === categorias.length
        ? categorias.length + (categorias.length === 1 ? ' categoria' : ' categorias')
        : filtradas.length + ' de ' + categorias.length;

    if (categorias.length === 0) {
        contador.textContent = '';
        lista.innerHTML =
            '<div class="vazio"><div class="vazio-icone"><i class="bi bi-tags"></i></div>' +
            '<div class="vazio-titulo">Nenhuma categoria cadastrada</div>' +
            '<p>Crie categorias para classificar os chamados, como Hardware ou Rede.</p>' +
            '<button class="btn btn-primary" type="button" onclick="abrirCadastro()">' +
            '<i class="bi bi-plus-lg"></i>Nova categoria</button></div>';
        return;
    }

    if (filtradas.length === 0) {
        lista.innerHTML =
            '<div class="vazio"><div class="vazio-icone"><i class="bi bi-search"></i></div>' +
            '<div class="vazio-titulo">Nenhum resultado</div>' +
            '<p class="mb-0">Nenhuma categoria corresponde a "' + escapar(busca.value) + '".</p></div>';
        return;
    }

    const linhas = filtradas.map(c =>
        '<tr>' +
        '<td class="fw-medium">' + escapar(c.nome) + '</td>' +
        '<td class="texto-suave">' + (c.descricao ? escapar(c.descricao) : '—') + '</td>' +
        '<td class="coluna-acoes">' +
        '<button class="botao-icone" type="button" title="Editar" aria-label="Editar ' + escapar(c.nome) + '" onclick="abrirEdicao(' + c.id + ')">' +
        '<i class="bi bi-pencil"></i></button>' +
        '<button class="botao-icone perigo" type="button" title="Excluir" aria-label="Excluir ' + escapar(c.nome) + '" onclick="excluir(' + c.id + ')">' +
        '<i class="bi bi-trash3"></i></button>' +
        '</td></tr>').join('');

    lista.innerHTML =
        '<div class="table-responsive"><table class="table table-hover tabela">' +
        '<thead><tr><th>Nome</th><th>Descrição</th><th class="coluna-acoes">Ações</th></tr></thead>' +
        '<tbody>' + linhas + '</tbody></table></div>';
}

function abrirCadastro() {
    idEmEdicao = null;
    document.getElementById('modal-titulo').textContent = 'Nova categoria';
    preencherFormulario('', '');
    modal.show();
}

function abrirEdicao(id) {
    const categoria = categorias.find(c => c.id === id);
    idEmEdicao = id;
    document.getElementById('modal-titulo').textContent = 'Editar categoria';
    preencherFormulario(categoria.nome, categoria.descricao || '');
    modal.show();
}

function preencherFormulario(nome, descricao) {
    formulario.classList.remove('was-validated');
    limparErro(erroFormulario);
    campoNome.value = nome;
    campoDescricao.value = descricao;
    contadorDescricao.textContent = descricao.length;
}

async function salvar(evento) {
    evento.preventDefault();
    limparErro(erroFormulario);

    if (!formulario.checkValidity()) {
        formulario.classList.add('was-validated');
        return;
    }

    const dados = {
        nome: campoNome.value.trim(),
        descricao: campoDescricao.value.trim() || null
    };

    try {
        await comCarregamento(document.getElementById('botao-salvar'), () =>
            idEmEdicao === null
                ? api('POST', '/categorias', dados)
                : api('PUT', '/categorias/' + idEmEdicao, dados));
        modal.hide();
        notificar(idEmEdicao === null ? 'Categoria criada.' : 'Categoria atualizada.');
        await carregar();
    } catch (erro) {
        mostrarErro(erroFormulario, erro);
    }
}

async function excluir(id) {
    const categoria = categorias.find(c => c.id === id);
    const confirmado = await confirmar(
        'Excluir categoria?',
        'A categoria "' + categoria.nome + '" será removida. Essa ação não pode ser desfeita.');
    if (!confirmado) {
        return;
    }

    try {
        await api('DELETE', '/categorias/' + id);
        notificar('Categoria excluída.');
        await carregar();
    } catch (erro) {
        notificar(erro.message, 'erro');
    }
}

document.getElementById('botao-nova').addEventListener('click', abrirCadastro);
busca.addEventListener('input', renderizar);
formulario.addEventListener('submit', salvar);
campoDescricao.addEventListener('input', () => contadorDescricao.textContent = campoDescricao.value.length);
elementoModal.addEventListener('shown.bs.modal', () => campoNome.focus());

carregar();
