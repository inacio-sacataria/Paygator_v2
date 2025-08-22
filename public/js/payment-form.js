// Payment Form JavaScript
console.log('🔧 Payment form JavaScript loaded successfully!');
console.log('📁 Current script location:', window.location.href);
console.log('🔍 Looking for payment data element...');

// Flag para indicar que o script foi carregado
window.paymentFormLoaded = true;

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

    function detectProvider(phoneDigits) {
        if (!phoneDigits || phoneDigits.length < 2) return null;
        const prefix = phoneDigits.substring(0, 2);
        if (prefix === '84' || prefix === '85') return 'mpesa';
        if (prefix === '86' || prefix === '87') return 'emola';
        return null;
    }

    function updateProviderUI(provider) {
        const mpesaCard = document.getElementById('card-mpesa');
        const emolaCard = document.getElementById('card-emola');
        const payButton = document.getElementById('payButton');
        const payLabel = document.getElementById('payLabel');
        mpesaCard && mpesaCard.classList.remove('active');
        emolaCard && emolaCard.classList.remove('active');
        if (provider === 'mpesa') {
            mpesaCard && mpesaCard.classList.add('active');
            if (payLabel) payLabel.textContent = 'Pagar com M-Pesa';
        } else if (provider === 'emola') {
            emolaCard && emolaCard.classList.add('active');
            if (payLabel) payLabel.textContent = 'Pagar com e-Mola';
        } else {
            if (payLabel) payLabel.textContent = 'Pagar';
        }
    }

    // Função para processar pagamento
    async function processPayment() {
        const phone = document.getElementById('phone').value;
        const payButton = document.getElementById('payButton');
        const loading = document.getElementById('loading');
        const payLabel = document.getElementById('payLabel');
        
        console.log('Telefone digitado:', phone);
        console.log('Comprimento do telefone:', phone.length);
        
        // Validate phone number
        if (!phone || phone.length !== 9) {
            showError('Por favor, insira um número de telefone válido (9 dígitos)', true);
            return;
        }
        const provider = detectProvider(phone);
        if (!provider) {
            showError('Prefixo inválido. Use 84/85 (M-Pesa) ou 86/87 (e-Mola).', true);
            return;
        }
        updateProviderUI(provider);
        
        // Show loading
        if (payButton) {
            payButton.disabled = true;
            payButton.style.opacity = '0.8';
        }
        if (loading) {
            loading.style.display = 'inline-block';
        } else {
            // Fallback visual se o elemento de loading não existir
            showLoading('Processando pagamento...');
        }
        if (payLabel) payLabel.textContent = 'Processando...';
        
        try {
            console.log('Enviando pagamento via', provider.toUpperCase(), '...');
            console.log('Payment ID:', paymentData.paymentId);
            console.log('Phone:', '+258' + phone);
            console.log('Amount:', paymentData.amount);
            console.log('Currency:', paymentData.currency);
            const endpoint = provider === 'mpesa' ? '/api/v1/payments/process-mpesa' : '/api/v1/payments/process-emola';
            const response = await fetch(endpoint, {
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
                // Não abrimos popup agora; aguardamos o polling terminar para mostrar sucesso
                
                // Aguardar 2 segundos antes de iniciar o polling
                setTimeout(() => {
                    pollPaymentStatus(paymentData.paymentId);
                }, 2000);
            } else {
                showError('❌ ' + (result.message || 'Erro ao processar pagamento. Tente novamente.'), true);
            }
        } catch (error) {
            console.error('Erro durante pagamento:', error);
            showError('Erro de conexão. Verifique sua internet e tente novamente.', true);
        } finally {
            // Hide loading
            if (payButton) {
                payButton.disabled = false;
                payButton.style.opacity = '1';
            }
            if (loading) {
                loading.style.display = 'none';
            } else {
                hideLoading();
            }
            if (payLabel) payLabel.textContent = 'Pagar';
        }
    }

    // Event listener para o botão de pagamento (se existir)
    const payBtnEl = document.getElementById('payButton');
    if (payBtnEl) {
        payBtnEl.addEventListener('click', processPayment);
    }
    
    // Event listener para o formulário (prevenir submissão padrão)
    document.getElementById('paymentForm').addEventListener('submit', function(e) {
        e.preventDefault();
        processPayment();
    });

    // Função de polling para verificar status
    async function pollPaymentStatus(paymentId) {
        const maxAttempts = 60; // 10 minutes with 5 second intervals
        let attempts = 0;
        
        // Atualizar botão como aguardando confirmação
        const payButton = document.getElementById('payButton');
        const payLabel = document.getElementById('payLabel');
        const loading = document.getElementById('loading');
        if (payButton) payButton.disabled = true;
        if (payLabel) payLabel.textContent = 'Aguardando confirmação...';
        if (loading) loading.style.display = 'inline-block';
        
        const pollInterval = setInterval(async () => {
            attempts++;
            
            try {
                const response = await fetch(`/api/v1/payments/${paymentId}/public-status`);
                const result = await response.json();
                
                console.log('Payment status check:', result.status, 'attempt:', attempts);
                
                if (result.status === 'completed') {
                    // Sucesso: mostrar somente uma confirmação final
                    showSuccess('🎉 Pagamento aprovado com sucesso! Redirecionando...', false);
                    clearInterval(pollInterval);
                    
                    // Redirect after 3 seconds
                    setTimeout(() => {
                        window.location.href = paymentData.returnUrl;
                    }, 3000);
                } else if (result.status === 'failed') {
                    if (loading) loading.style.display = 'none';
                    showError('❌ Pagamento falhou. Tente novamente.', false);
                    clearInterval(pollInterval);
                } else if (result.status === 'processing') {
                    // Atualizar label do botão com tempo decorrido
                    const timeElapsed = Math.floor((attempts * 5) / 60);
                    if (payLabel) payLabel.textContent = `Aguardando... (${timeElapsed}m)`;
                } else if (attempts >= maxAttempts) {
                    if (loading) loading.style.display = 'none';
                    showError('⏰ Tempo limite excedido. Verifique o status do pagamento.', false);
                    clearInterval(pollInterval);
                }
            } catch (error) {
                console.error('Error polling payment status:', error);
                if (payLabel) payLabel.textContent = 'Verificando status...';
            }
        }, 5000); // Poll every 5 seconds for faster response
    }
    
    // Format phone number input + auto-detect provider
    document.getElementById('phone').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 9) {
            value = value.substring(0, 9);
        }
        e.target.value = value;
        const provider = detectProvider(value);
        updateProviderUI(provider);
    });

    console.log('Payment form JavaScript carregado com sucesso!');
});
