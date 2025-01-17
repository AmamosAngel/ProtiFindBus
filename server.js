const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configuração do transportador de e-mail
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'grupoifindbus@gmail.com', // seu email
        pass: 'sistematicossosofrem' // você precisará gerar uma senha de aplicativo no Gmail
    }
});

// Rota para processar o feedback
app.post('/send-feedback', async (req, res) => {
    try {
        const { name, email, message } = req.body;

        // Configuração do e-mail
        const mailOptions = {
            from: email,
            to: 'grupoifindbus@gmail.com',
            subject: `Feedback do App - ${name}`,
            text: `
Nome: ${name}
Email: ${email}

Mensagem:
${message}
            `,
            html: `
                <h3>Novo Feedback do App</h3>
                <p><strong>Nome:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Mensagem:</strong></p>
                <p>${message}</p>
            `
        };

        // Enviar o e-mail
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Feedback enviado com sucesso!' });

    } catch (error) {
        console.error('Erro ao enviar feedback:', error);
        res.status(500).json({ message: 'Erro ao enviar feedback. Tente novamente.' });
    }
});

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
}); 