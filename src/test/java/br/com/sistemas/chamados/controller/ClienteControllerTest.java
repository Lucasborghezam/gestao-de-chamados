package br.com.sistemas.chamados.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import br.com.sistemas.chamados.dto.ClienteResponse;
import br.com.sistemas.chamados.exception.RecursoNaoEncontradoException;
import br.com.sistemas.chamados.exception.RegraNegocioException;
import br.com.sistemas.chamados.service.ChamadoService;
import br.com.sistemas.chamados.service.ClienteService;

@WebMvcTest(ClienteController.class)
class ClienteControllerTest {

    private static final String CLIENTE_VALIDO = """
            {"nome": "Ana Souza", "email": "ana@exemplo.com", "telefone": "47999999999"}
            """;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ClienteService service;

    @MockitoBean
    private ChamadoService chamadoService;

    @Test
    void deveCriarClienteERetornar201() throws Exception {
        when(service.criar(any()))
                .thenReturn(new ClienteResponse(1L, "Ana Souza", "ana@exemplo.com", "47999999999"));

        mockMvc.perform(post("/clientes").contentType(MediaType.APPLICATION_JSON).content(CLIENTE_VALIDO))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/clientes/1"))
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.nome").value("Ana Souza"));
    }

    @Test
    void deveRetornar400QuandoDadosForemInvalidos() throws Exception {
        String invalido = """
                {"nome": "", "email": "email-invalido", "telefone": "123"}
                """;

        mockMvc.perform(post("/clientes").contentType(MediaType.APPLICATION_JSON).content(invalido))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value("Dados inválidos"))
                .andExpect(jsonPath("$.detalhes.length()").value(2));

        verify(service, never()).criar(any());
    }

    @Test
    void deveRetornar409QuandoEmailJaExistir() throws Exception {
        when(service.criar(any()))
                .thenThrow(new RegraNegocioException("Já existe cliente com o e-mail ana@exemplo.com"));

        mockMvc.perform(post("/clientes").contentType(MediaType.APPLICATION_JSON).content(CLIENTE_VALIDO))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("Já existe cliente com o e-mail ana@exemplo.com"));
    }

    @Test
    void deveBuscarClientePorId() throws Exception {
        when(service.buscar(1L))
                .thenReturn(new ClienteResponse(1L, "Ana Souza", "ana@exemplo.com", "47999999999"));

        mockMvc.perform(get("/clientes/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("ana@exemplo.com"));
    }

    @Test
    void deveRetornar404QuandoClienteNaoExistir() throws Exception {
        when(service.buscar(999L))
                .thenThrow(new RecursoNaoEncontradoException("Cliente 999 não encontrado"));

        mockMvc.perform(get("/clientes/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.erro").value("Cliente 999 não encontrado"));
    }

    @Test
    void deveExcluirClienteERetornar204() throws Exception {
        mockMvc.perform(delete("/clientes/1"))
                .andExpect(status().isNoContent());

        verify(service).excluir(1L);
    }

}
