async function deleteUserData() {
  try {
    // Solicita a senha usando um prompt mais amigável
    const password = await promptUserPassword();
    
    if (!password) {
      throw new Error('Senha não fornecida');
    }

    const isPasswordValid = await validateUserPassword(password);
    
    if (!isPasswordValid) {
      throw new Error('Senha incorreta. Operação cancelada.');
    }

    await Promise.all([
      deletePersonalData(),
      deleteLoginCredentials(),
      deleteUserPreferences(),
      deleteUserHistory()
    ]);

    // Redireciona para a tela de login após apagar os dados
    window.location.href = 'login.html'; // Ajuste o caminho conforme sua aplicação
    
    return { success: true, message: 'Dados apagados com sucesso' };

  } catch (error) {
    return { 
      success: false, 
      message: error.message || 'Erro ao apagar dados'
    };
  }
}

// Função auxiliar para solicitar a senha
async function promptUserPassword(): Promise<string> {
  const password = await window.prompt('Digite sua senha para confirmar:') || '';
  return password;
}

async function validateUserPassword(password: string): Promise<boolean> {
  // Implement your password validation logic here
  // Example: return await auth.verifyPassword(currentUser.id, password);
  return password === 'senha123'; // Temporary - replace with real validation
}

async function deleteUserPreferences(): Promise<void> {
  // Implement your user preferences deletion logic here
  // Example: await db.userPreferences.deleteAll(userId);
}

async function deleteLoginCredentials(): Promise<void> {
  // Implement your login credentials deletion logic here
  // Example: await db.users.deleteCredentials(userId);
}

async function deleteUserHistory(): Promise<void> {
  // Implement your user history deletion logic here
  // Example: await db.userHistory.deleteAll(userId);
}

async function deletePersonalData(): Promise<void> {
  // Implement your personal data deletion logic here
  // Example: await db.personalData.deleteAll(userId);
}