package br.com.sistemas.chamados.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;

import br.com.sistemas.chamados.entity.Cliente;

@DataJpaTest
class ClienteRepositoryTest {

    @Autowired
    private ClienteRepository repository;

    @Test
    void deveSalvarClienteEGerarId() {
        Cliente salvo = repository.save(new Cliente("Ana Souza", "ana@exemplo.com", "47999999999"));

        assertThat(salvo.getId()).isNotNull();
        assertThat(repository.findById(salvo.getId())).isPresent();
    }

    @Test
    void deveInformarSeEmailJaExiste() {
        repository.save(new Cliente("Ana Souza", "ana@exemplo.com", "47999999999"));

        assertThat(repository.existsByEmail("ana@exemplo.com")).isTrue();
        assertThat(repository.existsByEmail("outro@exemplo.com")).isFalse();
    }

    @Test
    void deveIgnorarOProprioClienteAoVerificarEmail() {
        Cliente ana = repository.save(new Cliente("Ana Souza", "ana@exemplo.com", "47999999999"));
        Cliente bruno = repository.save(new Cliente("Bruno", "bruno@exemplo.com", "47988888888"));

        assertThat(repository.existsByEmailAndIdNot("ana@exemplo.com", ana.getId())).isFalse();
        assertThat(repository.existsByEmailAndIdNot("ana@exemplo.com", bruno.getId())).isTrue();
    }

    @Test
    void naoDevePermitirEmailDuplicadoNoBanco() {
        repository.saveAndFlush(new Cliente("Ana Souza", "ana@exemplo.com", "47999999999"));

        assertThatThrownBy(() -> repository.saveAndFlush(new Cliente("Outra Ana", "ana@exemplo.com", "47977777777")))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void deveRetornarVazioParaIdInexistente() {
        assertThat(repository.findById(999L)).isEmpty();
    }

}
