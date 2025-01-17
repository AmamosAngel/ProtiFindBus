document.addEventListener('DOMContentLoaded', function() {
    // Elementos
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');
    const mapPage = document.getElementById('mapPage');
    const logoutBtn = document.getElementById('logoutBtn');
    const routeNormal = document.getElementById('routeNormal');
    const routeInverse = document.getElementById('routeInverse');
    const notificationToggle = document.getElementById('notificationToggle');

    // Variáveis globais para o mapa
    let map = null;
    let userMarker = null;
    let watchId = null;

    // Função para verificar se o perfil está completo
    function isProfileComplete() {
        const profileData = JSON.parse(localStorage.getItem('profileData')) || {};
        const viewProfileData = JSON.parse(localStorage.getItem('viewProfileData')) || {};
        
        // Combina os dados de ambos os perfis
        const combinedProfile = {
            ...profileData,
            ...viewProfileData
        };

        const requiredFields = [
            'name',
            'email',
            'phone',
            'address',
            'city',
            'state'
        ];

        // Verifica se todos os campos necessários estão preenchidos em qualquer um dos perfis
        return requiredFields.every(field => {
            const value = combinedProfile[field];
            return value && value.trim() !== '';
        });
    }

    // Função para sincronizar dados do perfil
    function syncProfileData() {
        const profileData = JSON.parse(localStorage.getItem('profileData')) || {};
        const viewProfileData = JSON.parse(localStorage.getItem('viewProfileData')) || {};

        // Combina os dados, dando preferência aos dados mais recentes
        const combinedData = {
            ...profileData,
            ...viewProfileData,
            lastUpdate: Date.now()
        };

        // Verifica se há uma imagem de perfil no localStorage
        const profileImageData = localStorage.getItem('profileImageData');
        if (profileImageData) {
            combinedData.profileImage = profileImageData;
        }

        // Atualiza ambos os storages com os dados combinados
        localStorage.setItem('profileData', JSON.stringify(combinedData));
        localStorage.setItem('viewProfileData', JSON.stringify(combinedData));

        return combinedData;
    }

    // Função para redirecionar para completar o perfil
    function redirectToProfile() {
        showMessage('Por favor, complete seu perfil primeiro', 'warning');
        setTimeout(() => {
            window.location.href = 'view-profile.html';
        }, 2000);
    }

    // Função atualizada para verificar e mostrar alerta
    function checkProfileAndShowMap() {
        if (!isProfileComplete()) {
            showProfileAlert();
            return false;
        }
        return true;
    }

    // Função atualizada para gerenciar navegação
    function handleNavigation(targetPage) {
        const pages = document.querySelectorAll('.page');
        const navItems = document.querySelectorAll('.nav-item');
        
        pages.forEach(page => {
            page.classList.remove('active');
            if (page.id === `${targetPage}Page`) {
                page.classList.add('active');
            }
        });

        navItems.forEach(nav => {
            nav.classList.remove('active');
            if (nav.getAttribute('data-page') === targetPage) {
                nav.classList.add('active');
            }
        });

        // Inicializa o mapa se necessário
        if (targetPage === 'map' && !map) {
            initMap();
        }
    }

    // Navegação atualizada
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = item.getAttribute('data-page');
            handleNavigation(targetPage);
        });
    });

    // Configurações de Rota
    routeNormal.addEventListener('click', () => {
        routeNormal.classList.add('active');
        routeInverse.classList.remove('active');
        localStorage.setItem('selectedRoute', 'normal');
        showMessage('Rota normal selecionada', 'success');
    });

    routeInverse.addEventListener('click', () => {
        routeInverse.classList.add('active');
        routeNormal.classList.remove('active');
        localStorage.setItem('selectedRoute', 'inverse');
        showMessage('Rota inversa selecionada', 'success');
    });

    // Toggle de Notificações
    notificationToggle.addEventListener('change', async () => {
        if (notificationToggle.checked) {
            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    localStorage.setItem('notifications', 'true');
                    showMessage('Notificações ativadas', 'success');
                } else {
                    notificationToggle.checked = false;
                    showMessage('Permissão de notificações negada', 'error');
                }
            } catch (error) {
                console.error('Erro ao solicitar permissão:', error);
                notificationToggle.checked = false;
                showMessage('Erro ao ativar notificações', 'error');
            }
        } else {
            localStorage.setItem('notifications', 'false');
            showMessage('Notificações desativadas', 'success');
        }
    });

    // Logout
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        showMessage('Desconectado com sucesso!', 'success');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    });

    // Função atualizada para carregar dados do usuário
    function loadUserProfile() {
        // Obtém dados de ambos os perfis
        const profileData = JSON.parse(localStorage.getItem('profileData')) || {};
        const viewProfileData = JSON.parse(localStorage.getItem('viewProfileData')) || {};
        
        // Usa os dados mais recentes baseado no lastUpdate
        const userData = viewProfileData.lastUpdate > (profileData.lastUpdate || 0) 
            ? viewProfileData 
            : profileData;

        // Atualiza a exibição
        if (userData) {
            const userImage = document.getElementById('userImage');
            const userName = document.getElementById('userName');
            const userEmail = document.getElementById('userEmail');

            if (userName) userName.textContent = userData.name || 'Usuário';
            if (userEmail) userEmail.textContent = userData.email || 'email@exemplo.com';
            if (userImage) {
                userImage.src = userData.profileImage || 'default-avatar.png';
                userImage.onerror = function() {
                    this.src = 'default-avatar.png';
                };
            }
        }
    }

    // Observador para mudanças no localStorage
    window.addEventListener('storage', function(e) {
        if (e.key === 'profileData' || e.key === 'viewProfileData') {
            loadUserProfile();
        }
    });

    // Verifica atualizações periodicamente
    setInterval(loadUserProfile, 1000);

    // Função de carregamento de configurações atualizada
    function loadSettings() {
        loadUserProfile();
        checkProfileOnLoad(); // Verificar perfil ao carregar

        const selectedRoute = localStorage.getItem('selectedRoute');
        if (selectedRoute === 'inverse') {
            routeInverse.classList.add('active');
            routeNormal.classList.remove('active');
        }

        notificationToggle.checked = localStorage.getItem('notifications') === 'true';
    }

    // Função para mostrar mensagens
    function showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);
        
        setTimeout(() => messageDiv.classList.add('show'), 10);
        setTimeout(() => {
            messageDiv.classList.remove('show');
            setTimeout(() => messageDiv.remove(), 300);
        }, 3000);
    }

    // Verificar perfil ao carregar a página - remove redirecionamento automático
    function checkProfileOnLoad() {
        if (mapPage.classList.contains('active')) {
            checkProfileAndShowMap();
        }
    }

    // Função para mostrar alerta de perfil incompleto
    function showProfileAlert() {
        const mapPage = document.getElementById('mapPage');
        const alertDiv = document.createElement('div');
        alertDiv.className = 'profile-alert';
        alertDiv.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <div class="alert-content">
                <h3>Complete seu perfil</h3>
                <p>Para acessar o mapa, complete seu perfil em qualquer uma das páginas:</p>
                <div class="profile-buttons">
                    <a href="profile.html" class="alert-btn">Perfil Básico</a>
                    <a href="view-profile.html" class="alert-btn">Perfil Detalhado</a>
                </div>
            </div>
        `;
        
        const mapContainer = mapPage.querySelector('.map-container');
        if (mapContainer) {
            mapContainer.innerHTML = '';
            mapContainer.appendChild(alertDiv);
        }
    }

    // Função para criar o card de localização
    function createLocationCard() {
        const mapPage = document.getElementById('mapPage');
        const locationCard = document.createElement('div');
        locationCard.className = 'location-card';
        locationCard.innerHTML = `
            <div class="card-header">
                <i class="fas fa-map-marker-alt"></i>
                <h3>Localização Atual</h3>
            </div>
            <div class="card-content">
                <div class="location-detail">
                    <span class="label">Endereço:</span>
                    <span id="currentAddress">Carregando...</span>
                </div>
                <div class="location-detail">
                    <span class="label">Bairro:</span>
                    <span id="currentNeighborhood">Carregando...</span>
                </div>
                <div class="location-detail">
                    <span class="label">Cidade:</span>
                    <span id="currentCity">Carregando...</span>
                </div>
                <div class="location-detail">
                    <span class="label">Coordenadas:</span>
                    <span id="currentCoords">Carregando...</span>
                </div>
            </div>
        `;
        mapPage.appendChild(locationCard);
    }

    // Função atualizada para atualizar informações de localização
    function updateLocationInfo(lat, lng) {
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`)
            .then(response => response.json())
            .then(data => {
                const address = data.address;
                
                // Atualiza os elementos do card
                document.getElementById('currentAddress').textContent = 
                    address.road || address.pedestrian || 'Endereço não disponível';
                document.getElementById('currentNeighborhood').textContent = 
                    address.suburb || address.neighbourhood || 'Bairro não disponível';
                document.getElementById('currentCity').textContent = 
                    address.city || address.town || 'Cidade não disponível';
                document.getElementById('currentCoords').textContent = 
                    `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            })
            .catch(error => {
                console.error('Erro ao obter detalhes do endereço:', error);
                document.getElementById('currentAddress').textContent = 'Erro ao carregar endereço';
                document.getElementById('currentNeighborhood').textContent = 'Não disponível';
                document.getElementById('currentCity').textContent = 'Não disponível';
                document.getElementById('currentCoords').textContent = 
                    `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            });
    }

    // Função para limpar o rastreamento quando necessário
    function cleanupMap() {
        if (watchId) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
        }
    }

    // Gerenciamento de Notificações
    const enableNotificationsBtn = document.getElementById('enableNotifications');
    
    if (enableNotificationsBtn) {
        enableNotificationsBtn.addEventListener('click', async () => {
            try {
                if (!('Notification' in window)) {
                    showMessage('Seu navegador não suporta notificações', 'error');
                    enableNotificationsBtn.classList.add('disabled');
                    return;
                }

                if (Notification.permission === 'granted') {
                    showMessage('Notificações já estão ativadas', 'info');
                    updateNotificationsView(true);
                    return;
                }

                if (Notification.permission === 'denied') {
                    showMessage('Permissão de notificações foi negada. Verifique as configurações do navegador', 'warning');
                    return;
                }

                const permission = await Notification.requestPermission();
                
                if (permission === 'granted') {
                    showMessage('Notificações ativadas com sucesso!', 'success');
                    new Notification('iFind Bus', {
                        body: 'Você receberá atualizações sobre os ônibus por aqui!',
                        icon: '/path/to/icon.png'
                    });
                    
                    updateNotificationsView(true);
                } else {
                    showMessage('Permissão de notificações negada', 'error');
                }
            } catch (error) {
                console.error('Erro ao solicitar permissão:', error);
                showMessage('Erro ao ativar notificações', 'error');
            }
        });

        // Verifica o estado inicial das notificações
        checkInitialNotificationState();
    }

    // Função para verificar o estado inicial das notificações
    function checkInitialNotificationState() {
        if (Notification.permission === 'granted') {
            updateNotificationsView(true);
        }
    }

    // Função para atualizar a visualização das notificações
    function updateNotificationsView(notificationsEnabled) {
        const notificationsList = document.getElementById('notificationsList');
        
        if (notificationsEnabled) {
            notificationsList.innerHTML = `
                <div class="notifications-enabled">
                    <i class="fas fa-bell"></i>
                    <h3>Notificações Ativadas</h3>
                    <p>Você receberá atualizações sobre os ônibus aqui.</p>
                </div>
            `;
        }
    }

    // Função para verificar e atualizar a imagem periodicamente
    function checkProfileImage() {
        const userImage = document.getElementById('userImage');
        if (userImage) {
            const profileImageData = localStorage.getItem('profileImageData');
            if (profileImageData && userImage.src !== profileImageData) {
                userImage.src = profileImageData;
            }
        }
    }

    // Verificar a imagem a cada segundo
    setInterval(checkProfileImage, 1000);

    // Inicialização
    loadSettings();
    loadUserProfile();
    
    // Inicializa o mapa se estiver na página do mapa
    if (document.querySelector('#mapPage.active')) {
        initMap();
    }

    // Limpeza ao fechar/recarregar a página
    window.addEventListener('beforeunload', cleanupMap);

    // Função para inicializar o mapa
    function initMap() {
        // Verifica se o container do mapa existe
        const mapContainer = document.getElementById('mapPage');
        if (!mapContainer) return;

        // Cria o elemento div para o mapa
        const mapDiv = document.createElement('div');
        mapDiv.id = 'map';
        mapDiv.style.height = '100%';
        mapContainer.appendChild(mapDiv);

        // Inicializa o mapa
        map = L.map('map').setView([-1.4557, -48.4902], 13);

        // Adiciona o layer do OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Adiciona o botão de localização
        const locationButton = L.control({ position: 'bottomright' });
        locationButton.onAdd = function() {
            const btn = L.DomUtil.create('button', 'custom-map-button');
            btn.innerHTML = '<i class="fas fa-location-arrow"></i>';
            btn.onclick = centerOnUser;
            return btn;
        };
        locationButton.addTo(map);

        // Inicia o rastreamento de localização
        startLocationTracking();

        // Atualiza o tamanho do mapa
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }

    // Função para rastrear localização
    function startLocationTracking() {
        if (!navigator.geolocation) {
            showMessage('Geolocalização não suportada pelo seu navegador', 'error');
            return;
        }

        watchId = navigator.geolocation.watchPosition(
            position => updateLocation(position),
            error => handleLocationError(error),
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    }

    // Função para atualizar a localização
    function updateLocation(position) {
        const { latitude: lat, longitude: lng } = position.coords;

        if (!userMarker) {
            const customIcon = L.divIcon({
                className: 'custom-marker',
                html: '<div class="marker-pin"></div>'
            });

            userMarker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
            map.setView([lat, lng], 16);
        } else {
            userMarker.setLatLng([lat, lng]);
        }

        updateLocationInfo(lat, lng);
    }

    // Função para centralizar no usuário
    function centerOnUser() {
        if (userMarker) {
            map.setView(userMarker.getLatLng(), 16);
        } else {
            navigator.geolocation.getCurrentPosition(
                position => {
                    const { latitude, longitude } = position.coords;
                    map.setView([latitude, longitude], 16);
                },
                error => handleLocationError(error)
            );
        }
    }

    // Função para tratar erros de localização
    function handleLocationError(error) {
        let message = 'Erro ao obter localização';
        switch(error.code) {
            case error.PERMISSION_DENIED:
                message = 'Permissão de localização negada';
                break;
            case error.POSITION_UNAVAILABLE:
                message = 'Informação de localização indisponível';
                break;
            case error.TIMEOUT:
                message = 'Tempo esgotado ao obter localização';
                break;
        }
        showMessage(message, 'error');
    }

    // Função simplificada para editar perfil
    function editProfile() {
        window.location.href = 'profile.html'; // Caminho direto
    }

    // Adiciona evento de clique ao botão de editar perfil
    const editProfileBtn = document.querySelector('.edit-profile-btn');
    if (editProfileBtn) {
        editProfileBtn.onclick = function(e) {
            e.preventDefault();
            editProfile();
        };
    }

    // Atualiza o botão de editar perfil para modo responsivo
    function updateEditButton() {
        const editBtn = document.querySelector('.edit-profile-btn');
        if (window.innerWidth <= 768) {
            editBtn.innerHTML = '<i class="fas fa-user-edit"></i>';
        } else {
            editBtn.innerHTML = '<i class="fas fa-user-edit"></i><span>Editar Perfil</span>';
        }
    }

    // Adiciona listener para redimensionamento da janela
    window.addEventListener('resize', updateEditButton);

    // Inicializa o estado do botão
    document.addEventListener('DOMContentLoaded', function() {
        updateEditButton();
    });

    // Função atualizada para gerenciar navegação externa
    function handleExternalNavigation(targetPage) {
        switch(targetPage) {
            case 'home':
                window.open('https://obidos.ifpa.edu.br', '_blank');
                break;
            case 'map':
                showPage('map');
                if (!map) initMap();
                break;
            case 'notifications':
                showPage('notifications');
                break;
            case 'settings':
                showPage('settings');
                break;
        }
    }

    // Função para mostrar páginas dentro do dashboard
    function showPage(pageId) {
        const pages = document.querySelectorAll('.page');
        const navItems = document.querySelectorAll('.nav-item');
        
        pages.forEach(page => {
            page.classList.remove('active');
            if (page.id === `${pageId}Page`) {
                page.classList.add('active');
            }
        });

        navItems.forEach(nav => {
            nav.classList.remove('active');
            if (nav.getAttribute('data-page') === pageId) {
                nav.classList.add('active');
            }
        });
    }

    // Inicialização atualizada
    function init() {
        loadUserProfile();
        // Inicia na página inicial
        handleNavigation('home');
    }

    // Chama a inicialização
    init();

    // Função para atualizar informações do perfil
    function updateProfileInfo() {
        // Busca dados do perfil e do usuário atual
        const profileData = JSON.parse(localStorage.getItem('profileData') || '{}');
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        
        // Elementos do DOM
        const userName = document.getElementById('userName');
        const userImage = document.getElementById('userImage');
        const defaultAvatar = document.querySelector('.default-avatar');
        
        // Pega os dados mais recentes (prioriza profileData)
        const name = profileData.name || currentUser.name || 'Usuário';
        const profileImage = profileData.profileImage || (currentUser.profile && currentUser.profile.profileImage);

        // Atualiza o nome com "Bem-vindo"
        if (userName) {
            userName.textContent = `Bem-vindo, ${name}`;
        }

        // Atualiza a foto
        if (userImage && defaultAvatar) {
            if (profileImage && profileImage !== '') {
                userImage.src = profileImage;
                userImage.style.display = 'block';
                defaultAvatar.style.display = 'none';
            } else {
                userImage.style.display = 'none';
                defaultAvatar.style.display = 'flex';
            }
        }
    }

    // Atualiza imediatamente ao carregar
    updateProfileInfo();

    // Monitora mudanças no localStorage
    window.addEventListener('storage', function(e) {
        if (e.key === 'profileData' || e.key === 'currentUser') {
            updateProfileInfo();
        }
    });

    // First interval (for profile info updates)
    const profileUpdateInterval = setInterval(updateProfileInfo, 500);

    // Limpa o intervalo ao fechar a página
    window.addEventListener('beforeunload', () => {
        clearInterval(profileUpdateInterval);
    });

    // Listener para logout
    document.querySelector('.logout-button')?.addEventListener('click', function() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('profileData');
        window.location.href = 'login.html';
    });

    function updateHeaderProfile() {
        // Busca os dados mais recentes
        const profileData = JSON.parse(localStorage.getItem('profileData') || '{}');
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        
        // Elementos do DOM
        const userProfile = document.querySelector('.user-profile');
        const userName = document.getElementById('userName');
        const userImage = document.getElementById('userImage');
        const defaultAvatar = document.querySelector('.default-avatar');
        
        // Atualiza o nome
        const name = profileData.name || currentUser.name || 'Usuário';
        userName.textContent = `Bem-vindo, ${name}`;

        // Atualiza a foto
        if (profileData.profileImage) {
            userImage.src = profileData.profileImage;
            userImage.style.display = 'block';
            defaultAvatar.style.display = 'none';
        } else {
            userImage.style.display = 'none';
            defaultAvatar.style.display = 'flex';
        }
    }

    // Atualiza imediatamente
    updateHeaderProfile();

    // Atualiza quando houver mudanças no perfil
    window.addEventListener('profileUpdate', updateHeaderProfile);
    window.addEventListener('storage', function(e) {
        if (e.key === 'profileData' || e.key === 'currentUser') {
            updateHeaderProfile();
        }
    });

    // Atualiza a cada 100ms nos primeiros 5 segundos
    let attempts = 0;
    const profileInterval = setInterval(() => {
        updateHeaderProfile();
        attempts++;
        if (attempts >= 50) { // 5 segundos (50 * 100ms)
            clearInterval(profileInterval);
        }
    }, 100);
});