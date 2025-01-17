// Elementos do modal
const modal = document.getElementById('modalConfirmacao');
const btnConfirmar = document.getElementById('btnConfirmar');
const btnCancelar = document.getElementById('btnCancelar');
const inputSenha = document.getElementById('confirmPassword');

// Função para abrir o modal
function confirmarExclusao() {
    modal.style.display = 'block';
    inputSenha.value = ''; // Limpa o campo de senha
}

// Função para fechar o modal
function fecharModal() {
    modal.style.display = 'none';
    inputSenha.value = '';
}

// Função para validar senha e excluir dados
async function apagarDados() {
    const senha = inputSenha.value;
    
    if (!senha) {
        alert('Por favor, digite sua senha');
        return;
    }

    // Recupera o email do usuário logado
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        alert('Usuário não encontrado!');
        return;
    }

    // Recupera todos os usuários
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.email === currentUser.email);

    if (!user) {
        alert('Usuário não encontrado!');
        return;
    }

    // Verifica se a senha está correta
    if (senha === user.password) {
        // Remove o usuário da lista
        const updatedUsers = users.filter(u => u.email !== user.email);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        
        // Limpa dados do usuário atual
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userPreferences');
        localStorage.removeItem('userHistory');
        
        alert('Dados excluídos com sucesso!');
        window.location.href = 'index.html'; // Redireciona para a página de login
    } else {
        alert('Senha incorreta. Tente novamente.');
    }

    fecharModal();
}

// Event Listeners
btnConfirmar.addEventListener('click', apagarDados);
btnCancelar.addEventListener('click', fecharModal);

// Fecha o modal se clicar fora dele
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        fecharModal();
    }
});