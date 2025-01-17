document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signupForm');
    
    function showNotification(message, type) {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = 'block';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }

    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validações básicas
        if (!name || !email || !password || !confirmPassword) {
            showNotification('Por favor, preencha todos os campos!', 'error');
            return;
        }

        let users = [];
        try {
            users = JSON.parse(localStorage.getItem('users')) || [];
        } catch (error) {
            users = [];
        }

        if (users.some(user => user.email === email)) {
            showNotification('Este email já está cadastrado!', 'error');
            return;
        }

        // Cria novo usuário com perfil padrão
        const newUser = {
            name: name,
            email: email,
            password: password,
            profile: {
                name: name,
                email: email,
                phone: '',
                routeType: 'normal',
                profileImage: '',
                preferences: {
                    notifications: true,
                    theme: 'light'
                }
            }
        };

        try {
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));
            showNotification('Cadastro realizado com sucesso!', 'success');
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);

        } catch (error) {
            console.error('Erro ao salvar usuário:', error);
            showNotification('Erro ao realizar cadastro.', 'error');
        }
    });
});