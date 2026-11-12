// Janela de cadastro e edição de cliente, usada na lista (clientes.html) e no detalhe (cliente.html).
// A página chama abrirFormularioCliente(cliente) e recebe o cliente salvo pela função passada em aoSalvar.

const formularioCliente = (() => {
    const elemento = document.createElement('div');
    elemento.className = 'modal fade';
    elemento.id = 'modal-cliente';
    elemento.tabIndex = -1;
    elemento.setAttribute('aria-labelledby', 'modal-cliente-titulo');
    elemento.innerHTML =
        '<div class="modal-dialog modal-dialog-centered"><form class="modal-content" id="formulario-cliente" novalidate>' +
        '<div class="modal-header"><h5 class="modal-title" id="modal-cliente-titulo">Novo cliente</h5>' +
        '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button></div>' +
        '<div class="modal-body"><div id="erro-formulario-cliente"></div>' +
        '<div class="mb-3"><label class="form-label" for="cliente-nome">Nome <span class="obrigatorio">*</span></label>' +
        '<input type="text" class="form-control" id="cliente-nome" maxlength="100" required placeholder="Ex.: Ana Souza">' +
        '<div class="invalid-feedback">Informe o nome do cliente.</div></div>' +
        '<div class="mb-3"><label class="form-label" for="cliente-email">E-mail <span class="obrigatorio">*</span></label>' +
        '<input type="email" class="form-control" id="cliente-email" maxlength="120" required placeholder="Ex.: ana@empresa.com">' +
        '<div class="invalid-feedback">Informe um e-mail válido.</div></div>' +
        '<div class="mb-1"><label class="form-label" for="cliente-telefone">Telefone</label>' +
        '<input type="tel" class="form-control" id="cliente-telefone" maxlength="20" placeholder="(47) 99999-9999"></div>' +
        '</div><div class="modal-footer">' +
        '<button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancelar</button>' +
        '<button type="submit" class="btn btn-primary" id="botao-salvar-cliente">Salvar</button>' +
        '</div></form></div>';
    document.body.appendChild(elemento);

    const modal = new bootstrap.Modal(elemento);
    const formulario = elemento.querySelector('form');
    const erro = document.getElementById('erro-formulario-cliente');
    const nome = document.getElementById('cliente-nome');
    const email = document.getElementById('cliente-email');
    const telefone = document.getElementById('cliente-telefone');
    let idEmEdicao = null;
    let aoSalvar = () => {};

    aplicarMascaraTelefone(telefone);
    elemento.addEventListener('shown.bs.modal', () => nome.focus());

    formulario.addEventListener('submit', async evento => {
        evento.preventDefault();
        limparErro(erro);
        if (!formulario.checkValidity()) {
            formulario.classList.add('was-validated');
            return;
        }

        const dados = {
            nome: nome.value.trim(),
            email: email.value.trim(),
            telefone: telefone.value.trim() || null
        };
        try {
            const salvo = await comCarregamento(document.getElementById('botao-salvar-cliente'), () =>
                idEmEdicao === null
                    ? api('POST', '/clientes', dados)
                    : api('PUT', '/clientes/' + idEmEdicao, dados));
            modal.hide();
            notificar(idEmEdicao === null ? 'Cliente cadastrado.' : 'Cliente atualizado.');
            aoSalvar(salvo);
        } catch (e) {
            mostrarErro(erro, e);
        }
    });

    return {
        abrir(cliente, callback) {
            idEmEdicao = cliente ? cliente.id : null;
            aoSalvar = callback;
            document.getElementById('modal-cliente-titulo').textContent = cliente ? 'Editar cliente' : 'Novo cliente';
            formulario.classList.remove('was-validated');
            limparErro(erro);
            nome.value = cliente ? cliente.nome : '';
            email.value = cliente ? cliente.email : '';
            telefone.value = cliente && cliente.telefone ? formatarTelefone(cliente.telefone) : '';
            modal.show();
        }
    };
})();

function abrirFormularioCliente(cliente, aoSalvar) {
    formularioCliente.abrir(cliente, aoSalvar);
}

// Exclusão com confirmação, também usada nas duas telas
async function excluirCliente(cliente) {
    const confirmado = await confirmar(
        'Excluir cliente?',
        cliente.nome + ' será removido. Essa ação não pode ser desfeita.');
    if (!confirmado) {
        return false;
    }
    try {
        await api('DELETE', '/clientes/' + cliente.id);
        notificar('Cliente excluído.');
        return true;
    } catch (erro) {
        notificar(erro.message, 'erro');
        return false;
    }
}
