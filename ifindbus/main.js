// Gerenciamento de Seções
function showSection(sectionId) {
    // Esconde todas as seções
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Remove a classe active de todos os links do menu
    document.querySelectorAll('.menu a').forEach(link => {
        link.classList.remove('active');
    });
    
    // Adiciona a classe active ao link clicado
    document.querySelector(`.menu a[href="#${sectionId}"]`).classList.add('active');
    
    // Mostra a seção selecionada
    document.getElementById(sectionId).classList.remove('hidden');

    // Inicializa o mapa se for a seção do mapa
    if (sectionId === 'map-section') {
        initMap();
    }
}

// Inicialização do Mapa
let map;
function initMap() {
    if (!map) {
        map = L.map('map').setView([-1.9021, -55.5187], 13); // Coordenadas de Óbidos
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Adiciona controle de localização
        L.control.locate({
            position: 'topright',
            strings: {
                title: "Mostrar minha localização"
            },
            locateOptions: {
                enableHighAccuracy: true
            }
        }).addTo(map);
    }
}

// Sistema de Notificações
document.addEventListener('DOMContentLoaded', () => {
    const notificationBtn = document.getElementById('enableNotifications');
    
    notificationBtn.addEventListener('click', () => {
        requestNotificationPermission();
    });
});

async function requestNotificationPermission() {
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            showNotification('Notificações Ativadas', 'Você receberá atualizações sobre o ônibus escolar.');
            subscribeToNotifications();
        }
    } catch (error) {
        console.error('Erro ao solicitar permissão:', error);
    }
}

function showNotification(title, body) {
    new Notification(title, {
        body: body,
        icon: '/path/to/icon.png'
    });
}

function subscribeToNotifications() {
    // Aqui você implementaria a lógica para se inscrever em notificações do servidor
    console.log('Inscrito para receber notificações');
}

// Inicializa mostrando a página inicial
document.addEventListener('DOMContentLoaded', () => {
    showSection('home');
}); 