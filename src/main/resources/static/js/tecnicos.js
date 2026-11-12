// Tela de Técnicos: lista, busca, filtro por perfil, cadastro, edição e exclusão.

let tecnicos = [];
let idEmEdicao = null;

const lista = document.getElementById('lista');
const busca = document.getElementById('busca');
const filtroPerfil = document.getElementById('filtro-perfil');
const contador = document.getElementById('contador');
const erroPagina = document.getElementById('erro-pagina');

const elementoModal = document.getElementById('modal-tecnico');
const modal = new bootstrap.Modal(elementoModal);
const formulario = document.getElementById('formulario');
const erroFormulario = document.getElementById('erro-formulario');
const campoNome = document.getElementById('nome');
const campoEmail = document.getElementById('email');
const campoPerfil = document.getElementById('perfil');

async function carregar() {
    try {
        tecnicos = await api('GET', '/tecnicos');
        tecnicos.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
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
    const perfil = filtroPerfil.value;
    const filtrados = tecnicos.filter(t =>
        (t.nome.toLowerCase().includes(termo) || t.email.toLowerCase().includes(termo)) &&
        (perfil === '' || t.perfil === perfil));

    if (tecnicos.length === 0) {
        contador.textContent = '';
        lista.innerHTML =
            '<div class="vazio"><div class="vazio-icone"><i class="bi bi-person-gear"></i></div>' +
            '<div class="vazio-titulo">Nenhum técnico cadastrado</div>' +
            '<p>Cadastre a equipe que vai atender os chamados.</p>' +
            '<button class="btn btn-primary" type="button" onclick="abrirCadastro()">' +
            '<i class="bi bi-plus-lg"></i>Novo técnico</button></div>';
        return;
    }

    contador.textContent = filtrados.length === tecnicos.length
        ? tecnicos.length + (tecnicos.length === 1 ? ' técnico' : ' técnicos')
        : filtrados.length + ' de ' + tecnicos.length;

    if (filtrados.length === 0) {
        lista.innerHTML =
            '<div class="vazio"><div class="vazio-icone"><i class="bi bi-search"></i></div>' +
            '<div class="vazio-titulo">Nenhum resultado</div>' +
            '<p class="mb-0">Nenhum técnico corresponde aos filtros.</p></div>';
        return;
    }

    const linhas = filtrados.map(t =>
        '<tr>' +
        '<td><div class="pessoa"><span class="avatar" aria-hidden="true">' + escapar(iniciais(t.nome)) + '</span>' +
        '<div><div class="fw-medium">' + escapar(t.nome) + '</div>' +
        '<div class="texto-suave small d-md-none">' + escapar(t.email) + '</div>' +
        '<div class="d-md-none mt-1">' + etiqueta(PERFIL, t.perfil) + '</div></div></div></td>' +
        '<td class="texto-suave d-none d-md-table-cell">' + escapar(t.email) + '</td>' +
        '<td class="d-none d-md-table-cell">' + etiqueta(PERFIL, t.perfil) + '</td>' +
        '<td class="coluna-acoes">' +
        '<button class="botao-icone" type="button" title="Editar" aria-label="Editar ' + escapar(t.nome) + '" onclick="abrirEdicao(' + t.id + ')">' +
        '<i class="bi bi-pencil"></i></button>' +
        '<button class="botao-icone perigo" type="button" title="Excluir" aria-label="Excluir ' + escapar(t.nome) + '" onclick="excluir(' + t.id + ')">' +
        '<i class="bi bi-trash3"></i></button>' +
        '</td></tr>').join('');

    lista.innerHTML =
        '<div class="table-responsive"><table class="table table-hover tabela">' +
        '<thead><tr><th>Nome</th><th class="d-none d-md-table-cell">E-mail</th><th class="d-none d-md-table-cell">Perfil</th><th class="coluna-acoes">Ações</th></tr></thead>' +
        '<tbody>' + linhas + '</tbody></table></div>';
}

function abrirCadastro() {
    idEmEdicao = null;
    document.getElementById('modal-titulo').textContent = 'Novo técnico';
    preencherFormulario('', '', 'TECNICO');
    modal.show();
}

function abrirEdicao(id) {
    const tecnico = tecnicos.find(t => t.id === id);
    idEmEdicao = id;
    document.getElementById('modal-titulo').textContent = 'Editar técnico';
    preencherFormulario(tecnico.nome, tecnico.email, tecnico.perfil);
    modal.show();
}

function preencherFormulario(nome, email, perfil) {
    formulario.classList.remove('was-validated');
    limparErro(erroFormulario);
    campoNome.value = nome;
    campoEmail.value = email;
    campoPerfil.value = perfil;
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
        email: campoEmail.value.trim(),
        perfil: campoPerfil.value
    };

    try {
        await comCarregamento(document.getElementById('botao-salvar'), () =>
            idEmEdicao === null
                ? api('POST', '/tecnicos', dados)
                : api('PUT', '/tecnicos/' + idEmEdicao, dados));
        modal.hide();
        notificar(idEmEdicao === null ? 'Técnico cadastrado.' : 'Técnico atualizado.');
        await carregar();
    } catch (erro) {
        mostrarErro(erroFormulario, erro);
    }
}

async function excluir(id) {
    const tecnico = tecnicos.find(t => t.id === id);
    const confirmado = await confirmar(
        'Excluir técnico?',
        tecnico.nome + ' será removido da equipe. Essa ação não pode ser desfeita.');
    if (!confirmado) {
        return;
    }

    try {
        await api('DELETE', '/tecnicos/' + id);
        notificar('Técnico excluído.');
        await carregar();
    } catch (erro) {
        notificar(erro.message, 'erro');
    }
}

document.getElementById('botao-novo').addEventListener('click', abrirCadastro);
busca.addEventListener('input', renderizar);
filtroPerfil.addEventListener('change', renderizar);
formulario.addEventListener('submit', salvar);
elementoModal.addEventListener('shown.bs.modal', () => campoNome.focus());

carregar();
