document.addEventListener('DOMContentLoaded', function() {
    // Carrega dados do perfil
    const profileData = JSON.parse(localStorage.getItem('profileData')) || {};
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};

    // Função para formatar o tipo de rota
    function formatRouteType(routeType) {
        if (!routeType) return 'Não definida';
        return routeType === 'normal' ? 'Normal' : 'Inversa';
    }

    // Função para atualizar a imagem do perfil
    function updateProfileImage() {
        const profileImage = document.getElementById('profileImage');
        const defaultAvatar = document.querySelector('.default-avatar');
        const imageWrapper = document.querySelector('.profile-image-wrapper');

        if (profileData.profileImage) {
            profileImage.src = profileData.profileImage;
            profileImage.style.display = 'block';
            defaultAvatar.style.display = 'none';
            imageWrapper.classList.add('has-image');
        } else {
            profileImage.style.display = 'none';
            defaultAvatar.style.display = 'flex';
            imageWrapper.classList.remove('has-image');
        }
    }

    // Função para atualizar informações do perfil
    function updateProfileInfo() {
        // Combina dados do perfil e do usuário atual
        const userData = {
            ...currentUser.profile,
            ...profileData
        };

        // Atualiza os campos com os dados do perfil
        const fields = {
            'profileName': userData.name || 'Nome não informado',
            'profileEmail': userData.email || 'Email não informado',
            'profilePhone': userData.phone || 'Telefone não informado',
            'profileRouteType': formatRouteType(userData.routeType)
        };

        // Atualiza cada campo
        Object.entries(fields).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                // Remove a classe de carregamento se existir
                element.classList.remove('loading');
                element.textContent = value;
            }
        });

        // Atualiza a imagem
        updateProfileImage();
    }

    // Atualiza as informações inicialmente
    updateProfileInfo();

    // Monitora mudanças no localStorage
    window.addEventListener('storage', function(e) {
        if (e.key === 'profileData' || e.key === 'currentUser') {
            const newData = JSON.parse(e.newValue);
            if (newData) {
                Object.assign(e.key === 'profileData' ? profileData : currentUser, newData);
                updateProfileInfo();
            }
        }
    });

    // Botão de editar perfil
    document.getElementById('editProfileBtn').addEventListener('click', function() {
        window.location.href = 'profile.html';
    });
}); 