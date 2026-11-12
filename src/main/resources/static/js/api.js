// Comunicação com a API REST e utilidades usadas por todas as telas.

class ErroApi extends Error {
    constructor(mensagem, detalhes) {
        super(mensagem);
        this.detalhes = detalhes || [];
    }
}

async function api(metodo, url, corpo) {
    const opcoes = { method: metodo, headers: {} };
    if (corpo !== undefined) {
        opcoes.headers['Content-Type'] = 'application/json';
        opcoes.body = JSON.stringify(corpo);
    }

    let resposta;
    try {
        resposta = await fetch(url, opcoes);
    } catch (e) {
        throw new ErroApi('Não foi possível conectar ao servidor. Verifique se a aplicação está rodando.');
    }

    // 204 No Content não tem corpo
    if (resposta.status === 204) {
        return null;
    }

    const dados = await resposta.json().catch(() => null);
    if (!resposta.ok) {
        throw criarErro(resposta.status, dados);
    }
    return dados;
}

// 400, 404 e 409 chegam no formato ErroResposta: { erro, detalhes }
function criarErro(status, dados) {
    if (status >= 500) {
        return new ErroApi('Não foi possível concluir a operação. O registro pode estar em uso por um chamado.');
    }
    if (dados && dados.erro) {
        return new ErroApi(dados.erro, dados.detalhes);
    }
    return new ErroApi('Requisição inválida (erro ' + status + ').');
}

// Escapa texto vindo da API antes de colocar no HTML
function escapar(texto) {
    const div = document.createElement('div');
    div.textContent = texto == null ? '' : String(texto);
    return div.innerHTML;
}

// Alerta de erro dentro da página ou de um formulário
function mostrarErro(container, erro) {
    const detalhes = (erro.detalhes || [])
        .map(d => '<li>' + escapar(d.replace(':', ': ')) + '</li>')
        .join('');
    container.innerHTML =
        '<div class="alert alert-danger d-flex gap-2 mb-3" role="alert">' +
        '<i class="bi bi-exclamation-circle-fill"></i>' +
        '<div>' + escapar(erro.message) +
        (detalhes ? '<ul class="mb-0 mt-1 ps-3">' + detalhes + '</ul>' : '') +
        '</div></div>';
}

function limparErro(container) {
    container.innerHTML = '';
}

// Notificação discreta no canto da tela, para confirmar ações
function notificar(texto, tipo = 'sucesso') {
    let area = document.getElementById('notificacoes');
    if (!area) {
        area = document.createElement('div');
        area.id = 'notificacoes';
        area.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(area);
    }

    const icone = tipo === 'sucesso' ? 'bi-check-circle-fill text-success' : 'bi-exclamation-circle-fill text-danger';
    const elemento = document.createElement('div');
    elemento.className = 'toast align-items-center border-0 shadow';
    elemento.setAttribute('role', 'status');
    elemento.innerHTML =
        '<div class="d-flex"><div class="toast-body d-flex align-items-center gap-2">' +
        '<i class="bi ' + icone + '"></i>' + escapar(texto) + '</div>' +
        '<button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Fechar"></button></div>';
    area.appendChild(elemento);

    const toast = new bootstrap.Toast(elemento, { delay: 3500 });
    elemento.addEventListener('hidden.bs.toast', () => elemento.remove());
    toast.show();
}

// Janela de confirmação. Retorna uma Promise com true (confirmou) ou false.
function confirmar(titulo, mensagem, textoBotao = 'Excluir') {
    return new Promise(resolve => {
        const elemento = document.createElement('div');
        elemento.className = 'modal fade';
        elemento.tabIndex = -1;
        elemento.innerHTML =
            '<div class="modal-dialog modal-dialog-centered"><div class="modal-content">' +
            '<div class="modal-body p-4">' +
            '<h5 class="fw-semibold mb-2">' + escapar(titulo) + '</h5>' +
            '<p class="text-secondary mb-0">' + escapar(mensagem) + '</p></div>' +
            '<div class="modal-footer border-0 pt-0">' +
            '<button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancelar</button>' +
            '<button type="button" class="btn btn-danger" data-acao="confirmar">' + escapar(textoBotao) + '</button>' +
            '</div></div></div>';
        document.body.appendChild(elemento);

        const modal = new bootstrap.Modal(elemento);
        let confirmado = false;
        elemento.querySelector('[data-acao="confirmar"]').addEventListener('click', () => {
            confirmado = true;
            modal.hide();
        });
        elemento.addEventListener('hidden.bs.modal', () => {
            elemento.remove();
            resolve(confirmado);
        });
        modal.show();
    });
}

// Coloca um botão em estado de carregamento enquanto a requisição acontece
async function comCarregamento(botao, acao) {
    const original = botao.innerHTML;
    botao.disabled = true;
    botao.innerHTML = '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Salvando...';
    try {
        return await acao();
    } finally {
        botao.disabled = false;
        botao.innerHTML = original;
    }
}

// Datas no formato brasileiro: 05/11/2026 16:05
function formatarData(valor) {
    if (!valor) {
        return '—';
    }
    return new Date(valor).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
}

// Nomes e cores dos enums da API
const STATUS = {
    ABERTO: { rotulo: 'Aberto', cor: 'primary' },
    EM_ATENDIMENTO: { rotulo: 'Em atendimento', cor: 'warning' },
    AGUARDANDO_CLIENTE: { rotulo: 'Aguardando cliente', cor: 'info' },
    FECHADO: { rotulo: 'Fechado', cor: 'secondary' }
};

const PRIORIDADE = {
    BAIXA: { rotulo: 'Baixa', cor: 'secondary' },
    MEDIA: { rotulo: 'Média', cor: 'info' },
    ALTA: { rotulo: 'Alta', cor: 'warning' },
    CRITICA: { rotulo: 'Crítica', cor: 'danger' }
};

const PERFIL = {
    ADMIN: { rotulo: 'Administrador', cor: 'primary' },
    TECNICO: { rotulo: 'Técnico', cor: 'secondary' }
};

// Iniciais para o avatar: "Carlos Lima" vira "CL"
function iniciais(nome) {
    const partes = nome.trim().split(/\s+/);
    const primeira = partes[0].charAt(0);
    const ultima = partes.length > 1 ? partes[partes.length - 1].charAt(0) : '';
    return (primeira + ultima).toUpperCase();
}

function etiqueta(tabela, valor) {
    const item = tabela[valor] || { rotulo: valor, cor: 'secondary' };
    return '<span class="badge rounded-pill text-bg-' + item.cor + ' bg-opacity-75">' + escapar(item.rotulo) + '</span>';
}
