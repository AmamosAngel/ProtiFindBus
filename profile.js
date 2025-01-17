document.addEventListener('DOMContentLoaded', function() {
    // Elementos necessários
    const addPhotoBtn = document.querySelector('.profile-image-wrapper');
    const photoModal = document.getElementById('photoModal');
    const closeModalBtn = document.querySelector('.close-modal');
    const fileInput = document.getElementById('fileInput');
    const cameraBtn = document.querySelector('[data-option="tirar-foto"]');
    const profileImage = document.getElementById('profileImage');

    // Abrir modal ao clicar em adicionar foto
    addPhotoBtn.addEventListener('click', function() {
        photoModal.style.display = 'flex';
    });

    // Fechar modal
    closeModalBtn.addEventListener('click', function() {
        photoModal.style.display = 'none';
        stopCamera();
    });

    // Câmera
    let videoStream = null;
    
    async function startCamera() {
        const cameraContainer = document.getElementById('cameraContainer');
        const photoOptions = document.querySelector('.photo-options');
        const cameraPreview = document.getElementById('cameraPreview');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user' }, 
                audio: false 
            });
            
            videoStream = stream;
            cameraPreview.srcObject = stream;
            await cameraPreview.play();
            
            cameraContainer.style.display = 'block';
            photoOptions.style.display = 'none';
        } catch (err) {
            console.error('Erro ao acessar câmera:', err);
            alert('Não foi possível acessar a câmera. Por favor, verifique as permissões.');
        }
    }

    function stopCamera() {
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
            videoStream = null;
            document.getElementById('cameraContainer').style.display = 'none';
            document.querySelector('.photo-options').style.display = 'flex';
        }
    }

    // Iniciar câmera
    cameraBtn.addEventListener('click', startCamera);

    // Capturar foto
    document.getElementById('captureBtn').addEventListener('click', function() {
        const cameraPreview = document.getElementById('cameraPreview');
        const canvas = document.createElement('canvas');
        canvas.width = cameraPreview.videoWidth;
        canvas.height = cameraPreview.videoHeight;
        canvas.getContext('2d').drawImage(cameraPreview, 0, 0);
        
        const photoData = canvas.toDataURL('image/jpeg');
        profileImage.src = photoData;
        profileImage.style.display = 'block';
        document.querySelector('.default-avatar').style.display = 'none';
        updatePhotoButtons(true);
        updateProfilePhoto(photoData);
        
        stopCamera();
        photoModal.style.display = 'none';
    });

    // Cancelar câmera
    document.getElementById('cancelCameraBtn').addEventListener('click', stopCamera);

    // Upload de arquivo
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                profileImage.src = e.target.result;
                profileImage.style.display = 'block';
                document.querySelector('.default-avatar').style.display = 'none';
                photoModal.style.display = 'none';
                updatePhotoButtons(true);
                updateProfilePhoto(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

    // Fechar modal ao clicar fora
    window.addEventListener('click', function(e) {
        if (e.target === photoModal) {
            photoModal.style.display = 'none';
            stopCamera();
        }
    });

    // Função para atualizar visibilidade dos botões de foto
    function updatePhotoButtons(hasPhoto) {
        const addPhotoBtn = document.getElementById('addPhotoBtn');
        const photoEditButtons = document.getElementById('photoEditButtons');
        
        if (hasPhoto) {
            addPhotoBtn.style.display = 'none';
            photoEditButtons.style.display = 'flex';
        } else {
            addPhotoBtn.style.display = 'flex';
            photoEditButtons.style.display = 'none';
        }
    }

    // Remover foto
    document.getElementById('removePhotoBtn').addEventListener('click', function(e) {
        e.stopPropagation();
        if (confirm('Tem certeza que deseja remover a foto?')) {
            profileImage.src = '';
            profileImage.style.display = 'none';
            document.querySelector('.default-avatar').style.display = 'flex';
            updatePhotoButtons(false);
            updateProfilePhoto('');
        }
    });

    // Verificar estado inicial
    if (profileImage.src && profileImage.src !== window.location.href) {
        updatePhotoButtons(true);
    } else {
        updatePhotoButtons(false);
    }

    // Formulário
    document.getElementById('profileForm').addEventListener('submit', function(e) {
        e.preventDefault();

        // Coleta dados do formulário
        const formData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            routeType: document.getElementById('routeType').value,
            profileImage: document.getElementById('profileImage').src || ''
        };

        // Validação
        if (!formData.name || !formData.email || !formData.phone || !formData.routeType) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        try {
            // Salva no localStorage
            localStorage.setItem('profileData', JSON.stringify(formData));

            // Atualiza currentUser
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            if (currentUser) {
                currentUser.profile = formData;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
            }

            alert('Perfil atualizado com sucesso!');
            
            // Redireciona para view-profile
            window.location.href = 'view-profile.html';
        } catch (error) {
            console.error('Erro ao salvar perfil:', error);
            alert('Erro ao salvar as alterações. Por favor, tente novamente.');
        }
    });

    // Função para atualizar todos os locais que usam a foto
    function updateProfilePhoto(photoUrl) {
        // Atualiza localStorage
        const profileData = JSON.parse(localStorage.getItem('profileData') || '{}');
        profileData.profileImage = photoUrl;
        localStorage.setItem('profileData', JSON.stringify(profileData));

        // Atualiza currentUser
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        if (currentUser) {
            if (!currentUser.profile) currentUser.profile = {};
            currentUser.profile.profileImage = photoUrl;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }

        // Dispara evento para atualizar dashboard
        window.dispatchEvent(new Event('profileUpdate'));
    }

    // Função atualizada para adicionar foto
    function handleProfilePicture() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                
                reader.onload = function(event) {
                    const profilePic = document.querySelector('.profile-pic');
                    profilePic.src = event.target.result;
                    
                    // Salva a imagem no localStorage
                    localStorage.setItem('profilePicture', event.target.result);
                };
                
                reader.readAsDataURL(file);
            }
        };
        
        input.click();
    }

    // Carrega a foto salva quando a página é aberta
    document.addEventListener('DOMContentLoaded', function() {
        const savedPicture = localStorage.getItem('profilePicture');
        if (savedPicture) {
            const profilePic = document.querySelector('.profile-pic');
            profilePic.src = savedPicture;
        }
    });

    // Adiciona o evento de clique no elemento da foto
    document.querySelector('.profile-pic-container').addEventListener('click', handleProfilePicture);
}); 