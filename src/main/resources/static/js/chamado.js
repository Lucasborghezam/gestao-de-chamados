// Detalhe do chamado: dados, andamento (status e técnico), edição, exclusão e comentários.
// Um chamado FECHADO não pode ser alterado: as ações ficam desativadas, como a API exige.

const id = parametroUrl('id');
const conteudo = document.getElementById('conteudo');
const erroPagina = document.getElementById('erro-pagina');
const CHAVE_AUTOR = 'chamados.autorComentario';

const elementoModal = document.getElementById('modal-editar');
const modal = new bootstrap.Modal(elementoModal);
const formulario = document.getElementById('formulario');
const erroFormulario = document.getElementById('erro-formulario');

let chamado = null;
let tecnicos = [];

// Volta para a lista com os mesmos filtros, se o usuário veio dela
if (document.referrer.includes('/chamados.html')) {
    document.getElementById('voltar').href = new URL(document.referrer).pathname + new URL(document.referrer).search;
}

async function carregar() {
    try {
        [chamado, tecnicos] = await Promise.all([api('GET', '/chamados/' + id), api('GET', '/tecnicos')]);
        tecnicos.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        limparErro(erroPagina);
        renderizar();
    } catch (erro) {
        conteudo.innerHTML =
            '<div class="cartao"><div class="vazio"><div class="vazio-icone"><i class="bi bi-ticket-detailed"></i></div>' +
            '<div class="vazio-titulo">Chamado não encontrado</div>' +
            '<p>' + escapar(erro.message) + '</p>' +
            '<a class="btn btn-primary" href="/chamados.html">Voltar para chamados</a></div></div>';
    }
}

function renderizar() {
    const fechado = chamado.status === 'FECHADO';
    const bloqueio = fechado ? ' disabled' : '';
    document.title = '#' + chamado.id + ' ' + chamado.titulo + ' · Central de Chamados';

    const opcoesStatus = Object.keys(STATUS).map(s =>
        '<option value="' + s + '"' + (s === chamado.status ? ' selected' : '') + '>' + STATUS[s].rotulo + '</option>').join('');
    const opcoesTecnico = '<option value="">' + (tecnicos.length ? 'Selecione um técnico' : 'Nenhum técnico cadastrado') + '</option>' +
        tecnicos.map(t => '<option value="' + t.id + '"' + (chamado.tecnico && chamado.tecnico.id === t.id ? ' selected' : '') + '>' +
            escapar(t.nome) + '</option>').join('');

    conteudo.innerHTML =
        // Cabeçalho
        '<div class="pagina-cabecalho">' +
        '<div><h1 class="pagina-titulo"><span class="chamado-numero">#' + chamado.id + '</span> ' + escapar(chamado.titulo) + '</h1>' +
        '<div class="chamado-etiquetas">' + etiqueta(STATUS, chamado.status) + etiqueta(PRIORIDADE, chamado.prioridade) + '</div></div>' +
        '<div class="d-flex gap-2">' +
        '<button class="btn btn-light border" type="button" id="botao-editar"' + bloqueio + '><i class="bi bi-pencil"></i>Editar</button>' +
        '<button class="btn btn-outline-danger" type="button" id="botao-excluir"><i class="bi bi-trash3"></i>Excluir</button>' +
        '</div></div>' +

        (fechado
            ? '<div class="alert alert-secondary d-flex gap-2 align-items-center" role="status">' +
              '<i class="bi bi-lock-fill"></i><div>Chamado fechado em ' + formatarData(chamado.dataFechamento) +
              '. Ele não pode mais ser alterado nem receber comentários.</div></div>'
            : '') +

        '<div class="row g-4">' +

        // Coluna principal: descrição e comentários
        '<div class="col-lg-8">' +
        '<div class="cartao mb-4"><div class="cartao-cabecalho"><h2 class="cartao-titulo">Descrição</h2></div>' +
        '<div class="descricao-texto">' + escapar(chamado.descricao) + '</div></div>' +

        '<div class="cartao"><div class="cartao-cabecalho"><h2 class="cartao-titulo">Comentários</h2>' +
        '<span class="contador">' + chamado.comentarios.length + '</span></div>' +
        renderizarComentarios() +
        (fechado ? '' :
            '<form class="comentario-novo" id="formulario-comentario" novalidate>' +
            '<div id="erro-comentario"></div>' +
            '<div class="row g-2 mb-2"><div class="col-sm-5">' +
            '<label class="form-label" for="comentario-autor">Seu nome</label>' +
            '<input type="text" class="form-control" id="comentario-autor" maxlength="100" required placeholder="Ex.: Carlos Lima">' +
            '<div class="invalid-feedback">Informe quem está comentando.</div></div></div>' +
            '<label class="form-label" for="comentario-texto">Comentário</label>' +
            '<textarea class="form-control" id="comentario-texto" rows="3" maxlength="1000" required placeholder="Registre o que foi feito ou peça uma informação ao cliente."></textarea>' +
            '<div class="invalid-feedback">Escreva o comentário.</div>' +
            '<div class="d-flex justify-content-between align-items-center mt-2 gap-2 flex-wrap">' +
            '<span class="form-text m-0">Ctrl + Enter para enviar</span>' +
            '<button class="btn btn-primary" type="submit" id="botao-comentar"><i class="bi bi-send"></i>Comentar</button></div>' +
            '</form>') +
        '</div></div>' +

        // Coluna lateral: andamento e detalhes
        '<div class="col-lg-4">' +
        '<div class="cartao mb-4"><div class="cartao-cabecalho"><h2 class="cartao-titulo">Andamento</h2></div>' +
        '<div class="andamento">' +
        '<label class="form-label" for="novo-status">Status</label>' +
        '<div class="d-flex gap-2 mb-3"><select class="form-select" id="novo-status"' + bloqueio + '>' + opcoesStatus + '</select>' +
        '<button class="btn btn-primary" type="button" id="botao-status"' + bloqueio + '>Alterar</button></div>' +
        '<label class="form-label" for="novo-tecnico">Técnico responsável</label>' +
        '<div class="d-flex gap-2"><select class="form-select" id="novo-tecnico"' + (fechado || !tecnicos.length ? ' disabled' : '') + '>' + opcoesTecnico + '</select>' +
        '<button class="btn btn-primary" type="button" id="botao-tecnico"' + (fechado || !tecnicos.length ? ' disabled' : '') + '>Atribuir</button></div>' +
        (!tecnicos.length && !fechado ? '<div class="aviso-cadastro texto-suave"><a href="/tecnicos.html">Cadastrar técnico</a></div>' : '') +
        '</div></div>' +

        '<div class="cartao"><div class="cartao-cabecalho"><h2 class="cartao-titulo">Detalhes</h2></div>' +
        '<dl class="info-lista">' +
        '<dt>Cliente</dt><dd><a href="/cliente.html?id=' + chamado.cliente.id + '">' + escapar(chamado.cliente.nome) + '</a>' +
        '<div class="texto-suave small">' + escapar(chamado.cliente.email) + '</div></dd>' +
        '<dt>Categoria</dt><dd>' + escapar(chamado.categoria.nome) + '</dd>' +
        '<dt>Técnico</dt><dd>' + (chamado.tecnico ? escapar(chamado.tecnico.nome) : '<span class="texto-suave">Não atribuído</span>') + '</dd>' +
        '<dt>Abertura</dt><dd>' + formatarData(chamado.dataAbertura) + '</dd>' +
        '<dt>Fechamento</dt><dd>' + formatarData(chamado.dataFechamento) + '</dd>' +
        '</dl></div>' +
        '</div></div>';

    ligarEventos(fechado);
}

function renderizarComentarios() {
    if (chamado.comentarios.length === 0) {
        return '<div class="vazio py-4"><div class="vazio-icone"><i class="bi bi-chat-left-text"></i></div>' +
            '<div class="vazio-titulo">Nenhum comentário</div>' +
            '<p class="mb-0">' + (chamado.status === 'FECHADO'
                ? 'O chamado foi fechado sem comentários.'
                : 'Registre o andamento do atendimento aqui.') + '</p></div>';
    }
    return '<ul class="comentarios">' + chamado.comentarios.map(c =>
        '<li class="comentario"><span class="avatar" aria-hidden="true">' + escapar(iniciais(c.autor)) + '</span>' +
        '<div class="flex-grow-1"><div class="comentario-cabecalho">' +
        '<span class="comentario-autor">' + escapar(c.autor) + '</span>' +
        '<span class="comentario-data">' + formatarData(c.data) + '</span></div>' +
        '<div class="comentario-texto">' + escapar(c.texto) + '</div></div></li>').join('') + '</ul>';
}

function ligarEventos(fechado) {
    document.getElementById('botao-excluir').addEventListener('click', excluir);
    if (fechado) {
        return;
    }
    document.getElementById('botao-editar').addEventListener('click', abrirEdicao);
    document.getElementById('botao-status').addEventListener('click', alterarStatus);
    document.getElementById('botao-tecnico').addEventListener('click', atribuirTecnico);

    const formularioComentario = document.getElementById('formulario-comentario');
    const autor = document.getElementById('comentario-autor');
    const texto = document.getElementById('comentario-texto');
    try {
        autor.value = localStorage.getItem(CHAVE_AUTOR) || '';
    } catch (e) {
        // Sem acesso ao armazenamento do navegador: o campo apenas começa vazio
    }
    formularioComentario.addEventListener('submit', comentar);
    texto.addEventListener('keydown', evento => {
        if (evento.key === 'Enter' && evento.ctrlKey) {
            formularioComentario.requestSubmit();
        }
    });
}

async function alterarStatus() {
    const novo = document.getElementById('novo-status').value;
    if (novo === chamado.status) {
        notificar('O chamado já está como "' + STATUS[novo].rotulo + '".', 'erro');
        return;
    }
    if (novo === 'FECHADO') {
        const confirmado = await confirmar('Fechar chamado?',
            'Depois de fechado, o chamado não poderá ser alterado nem receber comentários.', 'Fechar chamado');
        if (!confirmado) {
            document.getElementById('novo-status').value = chamado.status;
            return;
        }
    }
    try {
        await comCarregamento(document.getElementById('botao-status'), () =>
            api('PATCH', '/chamados/' + id + '/status', { status: novo }));
        notificar('Status alterado para "' + STATUS[novo].rotulo + '".');
        await carregar();
    } catch (erro) {
        notificar(erro.message, 'erro');
    }
}

async function atribuirTecnico() {
    const tecnicoId = document.getElementById('novo-tecnico').value;
    if (!tecnicoId) {
        notificar('Selecione um técnico.', 'erro');
        return;
    }
    try {
        await comCarregamento(document.getElementById('botao-tecnico'), () =>
            api('PATCH', '/chamados/' + id + '/atribuir', { tecnicoId: Number(tecnicoId) }));
        notificar('Técnico atribuído.');
        await carregar();
    } catch (erro) {
        notificar(erro.message, 'erro');
    }
}

async function comentar(evento) {
    evento.preventDefault();
    const formularioComentario = evento.target;
    const erro = document.getElementById('erro-comentario');
    limparErro(erro);
    if (!formularioComentario.checkValidity()) {
        formularioComentario.classList.add('was-validated');
        return;
    }

    const autor = document.getElementById('comentario-autor').value.trim();
    try {
        await comCarregamento(document.getElementById('botao-comentar'), () =>
            api('POST', '/chamados/' + id + '/comentarios', {
                texto: document.getElementById('comentario-texto').value.trim(),
                autor: autor
            }));
        try {
            localStorage.setItem(CHAVE_AUTOR, autor);
        } catch (e) {
            // Sem acesso ao armazenamento: o nome não fica lembrado, sem outro efeito
        }
        notificar('Comentário adicionado.');
        await carregar();
    } catch (e) {
        mostrarErro(erro, e);
    }
}

async function abrirEdicao() {
    formulario.classList.remove('was-validated');
    limparErro(erroFormulario);
    try {
        const [clientes, categorias] = await Promise.all([api('GET', '/clientes'), api('GET', '/categorias')]);
        const opcoes = lista => lista
            .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
            .map(i => '<option value="' + i.id + '">' + escapar(i.nome) + '</option>').join('');
        document.getElementById('cliente').innerHTML = opcoes(clientes);
        document.getElementById('categoria').innerHTML = opcoes(categorias);
    } catch (erro) {
        notificar(erro.message, 'erro');
        return;
    }

    document.getElementById('titulo').value = chamado.titulo;
    document.getElementById('descricao').value = chamado.descricao;
    document.getElementById('descricao-contador').textContent = chamado.descricao.length;
    document.getElementById('cliente').value = chamado.cliente.id;
    document.getElementById('categoria').value = chamado.categoria.id;
    formulario.querySelector('input[name="prioridade"][value="' + chamado.prioridade + '"]').checked = true;
    modal.show();
}

async function salvarEdicao(evento) {
    evento.preventDefault();
    limparErro(erroFormulario);
    if (!formulario.checkValidity()) {
        formulario.classList.add('was-validated');
        return;
    }
    const dados = {
        titulo: document.getElementById('titulo').value.trim(),
        descricao: document.getElementById('descricao').value.trim(),
        prioridade: formulario.querySelector('input[name="prioridade"]:checked').value,
        clienteId: Number(document.getElementById('cliente').value),
        categoriaId: Number(document.getElementById('categoria').value)
    };
    try {
        await comCarregamento(document.getElementById('botao-salvar'), () =>
            api('PUT', '/chamados/' + id, dados));
        modal.hide();
        notificar('Chamado atualizado.');
        await carregar();
    } catch (erro) {
        mostrarErro(erroFormulario, erro);
    }
}

async function excluir() {
    const confirmado = await confirmar('Excluir chamado?',
        'O chamado #' + chamado.id + ' e todos os comentários dele serão removidos. Essa ação não pode ser desfeita.');
    if (!confirmado) {
        return;
    }
    try {
        await api('DELETE', '/chamados/' + id);
        notificar('Chamado excluído.');
        setTimeout(() => location.href = document.getElementById('voltar').getAttribute('href'), 800);
    } catch (erro) {
        notificar(erro.message, 'erro');
    }
}

formulario.addEventListener('submit', salvarEdicao);
document.getElementById('descricao').addEventListener('input', evento =>
    document.getElementById('descricao-contador').textContent = evento.target.value.length);
elementoModal.addEventListener('shown.bs.modal', () => document.getElementById('titulo').focus());

carregar();
