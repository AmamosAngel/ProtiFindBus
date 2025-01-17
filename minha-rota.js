document.addEventListener('DOMContentLoaded', function() {
    // Inicializa o mapa em Óbidos-PA (centralizado no IFPA)
    const ifpaLocation = [-1.8820737230276727, -55.5179265251259]; // Coordenadas do IFPA Óbidos
    const map = L.map('map').setView(ifpaLocation, 15);
    
    // Camadas de mapa
    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    });

    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: '© Esri'
    });

    // Adiciona a camada de ruas por padrão
    streetLayer.addTo(map);

    // Ícone personalizado para o usuário
    const userIcon = L.divIcon({
        className: 'user-marker',
        html: '<div class="user-marker-icon"><i class="fas fa-user"></i></div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });

    // Ícone personalizado para o IFPA
    const ifpaIcon = L.divIcon({
        className: 'ifpa-marker',
        html: '<div class="ifpa-marker-icon"><i class="fas fa-graduation-cap"></i></div>',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });

    // Variáveis de controle
    let currentLayer = streetLayer;
    let userMarker;
    let locationWatchId = null;
    let isTracking = false;
    let isMapSatellite = false;

    // Cache para armazenar o último endereço conhecido
    let lastKnownAddress = null;

    // Adiciona o CSS dinâmicamente para o marcador
    const style = document.createElement('style');
    style.textContent = `
        .user-marker {
            background: transparent;
            border: none;
        }
        .user-marker-icon {
            width: 30px;
            height: 30px;
            background: #2e7d32;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            border: 2px solid white;
        }
        .user-marker-icon i {
            font-size: 16px;
        }
        .ifpa-marker {
            background: transparent;
            border: none;
        }
        .ifpa-marker-icon {
            width: 40px;
            height: 40px;
            background: #2e7d32;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            border: 3px solid white;
        }
        .ifpa-marker-icon i {
            font-size: 20px;
        }
        .ifpa-popup {
            text-align: center;
            padding: 5px;
        }
        .ifpa-popup h3 {
            color: #2e7d32;
            margin-bottom: 5px;
            font-size: 14px;
        }
        .ifpa-popup p {
            color: #666;
            font-size: 12px;
            margin: 0;
        }
    `;
    document.head.appendChild(style);

    // Toggle do menu
    document.querySelector('.menu-toggle').addEventListener('click', function(e) {
        e.stopPropagation();
        const menuContent = document.querySelector('.menu-content');
        const menuToggle = this;
        
        menuContent.classList.toggle('open');
        menuToggle.classList.toggle('active');
    });

    // Fecha o menu ao clicar fora
    document.addEventListener('click', function(event) {
        const menu = document.querySelector('.menu-dropdown');
        const menuContent = document.querySelector('.menu-content');
        const menuToggle = document.querySelector('.menu-toggle');
        
        if (!menu.contains(event.target)) {
            menuContent.classList.remove('open');
            menuToggle.classList.remove('active');
        }
    });

    // Função para mudar tipo de mapa
    window.changeMapType = function() {
        map.removeLayer(currentLayer);
        const mapButton = document.querySelector('.map-type-btn');
        
        if (!isMapSatellite) {
            // Muda para satélite
            currentLayer = satelliteLayer;
            mapButton.innerHTML = '<i class="fas fa-map"></i>';
            mapButton.setAttribute('title', 'Mudar para mapa normal');
            isMapSatellite = true;
        } else {
            // Muda para mapa normal
            currentLayer = streetLayer;
            mapButton.innerHTML = '<i class="fas fa-satellite"></i>';
            mapButton.setAttribute('title', 'Mudar para satélite');
            isMapSatellite = false;
        }
        
        currentLayer.addTo(map);
    }

    // Função para formatar o endereço
    function formatAddress(geocodeResult) {
        try {
            const address = {};
            
            geocodeResult.address_components.forEach(component => {
                if (component.types.includes('route')) {
                    address.street = component.long_name;
                }
                if (component.types.includes('sublocality') || component.types.includes('neighborhood')) {
                    address.neighborhood = component.long_name;
                }
            });

            if (address.street && address.neighborhood) {
                return `<i class="fas fa-map-marker-alt"></i> ${address.street}<br>
                        <small style="margin-left: 20px">${address.neighborhood}</small>`;
            } else {
                return `<i class="fas fa-map-marker-alt"></i> ${geocodeResult.formatted_address}`;
            }
        } catch (error) {
            return `<i class="fas fa-map-marker-alt"></i> Localização encontrada`;
        }
    }

    // Função para mostrar loading
    function showLoading(elementId) {
        const element = document.getElementById(elementId);
        element.innerHTML = `
            <div class="loading-info">
                <i class="fas fa-map-marker-alt"></i>
                <span>Buscando localização...</span>
            </div>
        `;
    }

    // Função para atualizar a posição do usuário
    function updatePosition(position) {
        const { latitude, longitude } = position.coords;
        const newPosition = [latitude, longitude];
        const myLocationElement = document.getElementById('myLocation');

        if (userMarker) {
            userMarker.setLatLng(newPosition);
        } else {
            userMarker = L.marker(newPosition, { icon: userIcon }).addTo(map);
        }

        // Ajusta o zoom para um nível que mostre mais detalhes do bairro
        map.setView(newPosition, map.getZoom() || 16);

        // Mostra loading
        showLoading('myLocation');

        // Faz múltiplas requisições com diferentes níveis de zoom para garantir precisão
        Promise.all([
            // Zoom 18 para detalhes da rua
            fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`),
            // Zoom 14 para garantir informações do bairro
            fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`)
        ])
            .then(responses => Promise.all(responses.map(r => r.json())))
            .then(([detailedData, areaData]) => {
                // Combina as informações dos dois níveis de zoom
                const street = detailedData.address.road || 
                             detailedData.address.pedestrian || 
                             detailedData.address.street || 
                             detailedData.address.path || 
                             'Endereço não identificado';
                
                // Tenta obter o bairro de ambas as respostas
                const neighborhood = areaData.address.suburb || 
                                   areaData.address.neighbourhood ||
                                   areaData.address.residential ||
                                   detailedData.address.suburb || 
                                   detailedData.address.neighbourhood || 
                                   detailedData.address.residential ||
                                   detailedData.address.district || 
                                   detailedData.address.subdistrict || 
                                   'Bairro não identificado';

                // Armazena o último endereço conhecido
                lastKnownAddress = {
                    street: street,
                    neighborhood: neighborhood
                };

                myLocationElement.innerHTML = `
                    <div class="address-info">
                        <i class="fas fa-map-marker-alt"></i>
                        <div class="address-details">
                            <span class="street">${street}</span>
                            <span class="neighborhood">${neighborhood}</span>
                        </div>
                    </div>
                `;
            })
            .catch(error => {
                console.error('Erro ao obter endereço:', error);
                // Se houver erro, usa o último endereço conhecido se disponível
                if (lastKnownAddress) {
                    myLocationElement.innerHTML = `
                        <div class="address-info">
                            <i class="fas fa-map-marker-alt"></i>
                            <div class="address-details">
                                <span class="street">${lastKnownAddress.street}</span>
                                <span class="neighborhood">${lastKnownAddress.neighborhood}</span>
                            </div>
                        </div>
                    `;
                } else {
                    myLocationElement.innerHTML = `
                        <div class="address-info">
                            <i class="fas fa-exclamation-circle"></i>
                            <span>Não foi possível obter o endereço</span>
                        </div>
                    `;
                }
            });
    }

    // Função para alternar localização em tempo real
    window.toggleRealTimeLocation = function() {
        const locateButton = document.getElementById('locateButton');
        isTracking = !isTracking;

        if (isTracking) {
            locateButton.classList.add('active');
            
            if (navigator.geolocation) {
                locationWatchId = navigator.geolocation.watchPosition(
                    updatePosition,
                    function(error) {
                        console.error('Erro de localização:', error);
                        isTracking = false;
                        locateButton.classList.remove('active');
                        const myLocationElement = document.getElementById('myLocation');
                        myLocationElement.innerHTML = '<i class="fas fa-exclamation-circle"></i> Erro ao obter localização';
                    },
                    {
                        enableHighAccuracy: true,
                        maximumAge: 10000,
                        timeout: 5000
                    }
                );
            } else {
                alert('Seu navegador não suporta geolocalização');
                isTracking = false;
                locateButton.classList.remove('active');
            }
        } else {
            locateButton.classList.remove('active');
            if (locationWatchId !== null) {
                navigator.geolocation.clearWatch(locationWatchId);
                locationWatchId = null;
            }
        }
    }

    // Força um recálculo do tamanho do mapa
    setTimeout(() => {
        map.invalidateSize();
    }, 100);

    // Adiciona listener para mudanças no zoom
    map.on('zoomend', function() {
        // Se temos um último endereço conhecido, mantemos ele exibido
        if (lastKnownAddress) {
            document.getElementById('myLocation').innerHTML = `
                <div class="address-info">
                    <i class="fas fa-map-marker-alt"></i>
                    <div class="address-details">
                        <span class="street">${lastKnownAddress.street}</span>
                        <span class="neighborhood">${lastKnownAddress.neighborhood}</span>
                    </div>
                </div>
            `;
        }
    });

    // Adiciona o marcador do IFPA
    const ifpaMarker = L.marker(ifpaLocation, { 
        icon: ifpaIcon,
        zIndexOffset: 1000 // Mantém o ícone do IFPA sempre visível
    }).addTo(map);

    // Adiciona popup com informações do IFPA
    ifpaMarker.bindPopup(`
        <div class="ifpa-popup">
            <h3>IFPA Campus Óbidos</h3>
            <p>Instituto Federal do Pará</p>
        </div>
    `);
}); 