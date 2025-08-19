// Payment Form JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Obter dados do pagamento do script JSON
    const paymentDataElement = document.getElementById('payment-data');
    const paymentData = JSON.parse(paymentDataElement.textContent);
    
    console.log('Dados do pagamento carregados:', paymentData);
    
    // Debug: Verificar se os elementos foram encontrados
    console.log('Formulário encontrado:', document.getElementById('paymentForm'));
    console.log('Campo telefone encontrado:', document.getElementById('phone'));
    console.log('Botão encontrado:', document.getElementById('payButton'));
    
    // Sistema de Popups
    function showPopup(type, title, message, autoClose = false, duration = 3000) {
        console.log('🎭 showPopup chamado:', { type, title, message, autoClose, duration });
        
        const popup = document.getElementById('popup');
        const popupOverlay = document.getElementById('popupOverlay');
        const popupIcon = document.getElementById('popupIcon');
        const popupTitle = document.getElementById('popupTitle');
        const popupMessage = document.getElementById('popupMessage');
        const popupButton = document.getElementById('popupButton');
        
        console.log('🔍 Elementos encontrados:', {
            popup: !!popup,
            popupOverlay: !!popupOverlay,
            popupIcon: !!popupIcon,
            popupTitle: !!popupTitle,
            popupMessage: !!popupMessage,
            popupButton: !!popupButton
        });

        // Remover classes anteriores
        popup.className = 'popup';
        
        // Configurar baseado no tipo
        switch(type) {
            case 'success':
                popup.classList.add('success');
                popupIcon.textContent = '✅';
                break;
            case 'error':
                popup.classList.add('error');
                popupIcon.textContent = '❌';
                break;
            case 'info':
                popup.classList.add('info');
                popupIcon.textContent = 'ℹ️';
                break;
            case 'loading':
                popup.classList.add('info');
                popupIcon.textContent = '⏳';
                break;
        }

        popupTitle.textContent = title;
        popupMessage.textContent = message;
        
        console.log('📝 Conteúdo configurado:', { title, message });
        
        // Mostrar popup
        popupOverlay.classList.add('show');
        console.log('👁️ Popup overlay mostrado, classes:', popupOverlay.className);
        
        // Auto-close se configurado
        if (autoClose) {
            console.log('⏰ Auto-close configurado para', duration, 'ms');
            setTimeout(() => {
                hidePopup();
            }, duration);
        }
    }

    function hidePopup() {
        const popupOverlay = document.getElementById('popupOverlay');
        popupOverlay.classList.remove('show');
    }

    // Funções de conveniência
    function showSuccess(message, autoClose = true) {
        console.log('🔵 showSuccess chamado:', message);
        showPopup('success', 'Sucesso!', message, autoClose);
    }

    function showError(message, autoClose = true) {
        console.log('🔴 showError chamado:', message);
        showPopup('error', 'Erro!', message, autoClose);
    }

    function showInfo(message, autoClose = true) {
        console.log('ℹ️ showInfo chamado:', message);
        showPopup('info', 'Informação', message, autoClose);
    }

    function showLoading(message) {
        console.log('⏳ showLoading chamado:', message);
        showPopup('loading', 'Processando...', message, false);
    }

    function hideLoading() {
        console.log('⏳ hideLoading chamado');
        hidePopup();
    }

    // Event listeners para popup
    document.getElementById('popupClose').addEventListener('click', hidePopup);
    document.getElementById('popupButton').addEventListener('click', hidePopup);
    
    // Fechar popup ao clicar fora
    document.getElementById('popupOverlay').addEventListener('click', function(e) {
        if (e.target === this) {
            hidePopup();
        }
    });

    // Função para processar pagamento
    async function processPayment() {
        const phone = document.getElementById('phone').value;
        const payButton = document.getElementById('payButton');
        const loading = document.getElementById('loading');
        
        console.log('Telefone digitado:', phone);
        console.log('Comprimento do telefone:', phone.length);
        
        // Validate phone number
        if (!phone || phone.length !== 9) {
            showError('Por favor, insira um número de telefone válido (9 dígitos)', true);
            return;
        }
        
        // Show loading
        payButton.disabled = true;
        loading.style.display = 'inline-block';
        
        try {
            console.log('Enviando pagamento M-Pesa...');
            console.log('Payment ID:', paymentData.paymentId);
            console.log('Phone:', '+258' + phone);
            console.log('Amount:', paymentData.amount);
            console.log('Currency:', paymentData.currency);
            
            const response = await fetch('/api/v1/payments/process-mpesa', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    paymentId: paymentData.paymentId,
                    phone: '+258' + phone,
                    amount: paymentData.amount,
                    currency: paymentData.currency
                })
            });
            
            console.log('Response status:', response.status);
            const result = await response.json();
            console.log('Response data:', result);
            
            if (result.success) {
                showSuccess('✅ Pagamento iniciado com sucesso! Verifique seu telefone para confirmar.', true);
                
                // Aguardar 3 segundos antes de iniciar o polling
                setTimeout(() => {
                    pollPaymentStatus(paymentData.paymentId);
                }, 3000);
            } else {
                showError('❌ ' + (result.message || 'Erro ao processar pagamento. Tente novamente.'), true);
            }
        } catch (error) {
            console.error('Erro durante pagamento:', error);
            showError('Erro de conexão. Verifique sua internet e tente novamente.', true);
        } finally {
            // Hide loading
            payButton.disabled = false;
            loading.style.display = 'none';
        }
    }

    // Event listener para o botão de pagamento
    document.getElementById('payButton').addEventListener('click', processPayment);
    
    // Event listener para o formulário (prevenir submissão padrão)
    document.getElementById('paymentForm').addEventListener('submit', function(e) {
        e.preventDefault();
        processPayment();
    });

    // Função de polling para verificar status
    async function pollPaymentStatus(paymentId) {
        const maxAttempts = 30; // 5 minutes with 10 second intervals
        let attempts = 0;
        
        // Mostrar popup de processamento
        showLoading('Iniciando verificação do status do pagamento...');
        
        const pollInterval = setInterval(async () => {
            attempts++;
            
            try {
                const response = await fetch(`/api/v1/payments/${paymentId}/public-status`);
                const result = await response.json();
                
                if (result.status === 'completed') {
                    hideLoading();
                    showSuccess('🎉 Pagamento confirmado com sucesso! Redirecionando...', false);
                    clearInterval(pollInterval);
                    
                    // Redirect after 5 seconds
                    setTimeout(() => {
                        window.location.href = paymentData.returnUrl;
                    }, 5000);
                } else if (result.status === 'failed') {
                    hideLoading();
                    showError('❌ Pagamento falhou. Tente novamente.', false);
                    clearInterval(pollInterval);
                } else if (result.status === 'processing') {
                    // Atualizar popup de loading
                    showLoading(`Processando pagamento... (tentativa ${attempts}/${maxAttempts})`);
                } else if (attempts >= maxAttempts) {
                    hideLoading();
                    showError('⏰ Tempo limite excedido. Verifique o status do pagamento.', false);
                    clearInterval(pollInterval);
                }
            } catch (error) {
                console.error('Error polling payment status:', error);
                showLoading('Erro ao verificar status. Tentando novamente...');
            }
        }, 10000); // Poll every 10 seconds
    }
    
    // Format phone number input
    document.getElementById('phone').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 9) {
            value = value.substring(0, 9);
        }
        e.target.value = value;
    });

    console.log('Payment form JavaScript carregado com sucesso!');
});
