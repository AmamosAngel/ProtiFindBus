async function alterarSenha(event) {
    event.preventDefault();
    
    const senhaAtual = document.getElementById('senhaAtual').value;
    const novaSenha = document.getElementById('novaSenha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;

    // Verifica se as senhas novas coincidem
    if (novaSenha !== confirmarSenha) {
        alert('As senhas não coincidem!');
        return;
    }

    // Recupera dados do usuário do localStorage
    const userData = JSON.parse(localStorage.getItem('userData'));
    
    if (!userData) {
        alert('Usuário não encontrado!');
        return;
    }

    // Verifica se a senha atual está correta
    if (senhaAtual !== userData.password) {
        alert('Senha atual incorreta!');
        return;
    }

    // Atualiza a senha
    userData.password = novaSenha;
    localStorage.setItem('userData', JSON.stringify(userData));

    alert('Senha alterada com sucesso!');
    window.location.href = 'configuracoes.html';
} 