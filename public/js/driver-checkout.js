window.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('driverCheckoutForm');
  const phoneInput = document.getElementById('phone');
  const amountInput = document.getElementById('amount');
  const providerSelect = document.getElementById('provider');
  const submitButton = document.getElementById('submitButton');
  const statusBox = document.getElementById('statusBox');
  const providerCards = Array.from(document.querySelectorAll('.provider'));

  function setStatus(type, message) {
    statusBox.className = `status ${type}`;
    statusBox.textContent = message;
  }

  function clearStatus() {
    statusBox.className = 'status';
    statusBox.textContent = '';
  }

  function normalizeLocalPhone(value) {
    return String(value || '').replace(/\D/g, '').slice(0, 9);
  }

  function detectProvider(phone) {
    const local = normalizeLocalPhone(phone);
    if (local.startsWith('84') || local.startsWith('85')) return 'mpesa';
    if (local.startsWith('86') || local.startsWith('87')) return 'emola';
    return null;
  }

  function updateProviderUI(provider) {
    providerSelect.value = provider || providerSelect.value;
    providerCards.forEach((card) => {
      const active = card.dataset.provider === providerSelect.value;
      card.classList.toggle('active', active);
    });
  }

  async function pollStatus(paymentId) {
    let attempts = 0;
    const maxAttempts = 24;

    const timer = setInterval(async () => {
      attempts += 1;
      try {
        const response = await fetch(`/api/v1/driver-checkout/public/${paymentId}/status`);
        const result = await response.json();

        if (!result.success) {
          return;
        }

        const data = result.data || {};
        if (data.commitStatus === 'completed' || data.status === 'completed') {
          clearInterval(timer);
          submitButton.disabled = false;
          submitButton.textContent = 'Recarregar carteira';
          setStatus('success', `Pagamento concluido. Driver creditado com sucesso. Payment ID: ${paymentId}`);
          return;
        }

        if (data.status === 'failed' || data.commitStatus === 'failed') {
          clearInterval(timer);
          submitButton.disabled = false;
          submitButton.textContent = 'Recarregar carteira';
          setStatus('error', data.commitError || 'O pagamento falhou ou o commit nao foi concluido.');
          return;
        }

        setStatus('info', `Pagamento recebido. A confirmar credito na carteira... (${attempts}/${maxAttempts})`);
      } catch (_error) {
        setStatus('info', 'A verificar estado do pagamento...');
      }

      if (attempts >= maxAttempts) {
        clearInterval(timer);
        submitButton.disabled = false;
        submitButton.textContent = 'Recarregar carteira';
        setStatus('info', `Pagamento criado com sucesso. Consulte depois o estado com o paymentId ${paymentId}.`);
      }
    }, 5000);
  }

  phoneInput.addEventListener('input', function (event) {
    const local = normalizeLocalPhone(event.target.value);
    event.target.value = local;
    const provider = detectProvider(local);
    if (provider) {
      updateProviderUI(provider);
    }
  });

  providerCards.forEach((card) => {
    card.addEventListener('click', function () {
      updateProviderUI(card.dataset.provider);
    });
  });

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    clearStatus();

    const phone = normalizeLocalPhone(phoneInput.value);
    const amount = Number(amountInput.value);
    const provider = providerSelect.value;

    if (!/^(84|85|86|87)\d{7}$/.test(phone)) {
      setStatus('error', 'Telefone invalido. Use 84, 85, 86 ou 87 com 9 digitos.');
      return;
    }

    if (!amount || amount <= 0) {
      setStatus('error', 'Informe um valor valido.');
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'A processar...';
    setStatus('info', 'A criar checkout e a processar o pagamento...');

    try {
      const response = await fetch('/api/v1/driver-checkout/public/topup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          amount,
          provider,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        submitButton.disabled = false;
        submitButton.textContent = 'Recarregar carteira';
        setStatus('error', result.message || 'Nao foi possivel iniciar o checkout.');
        return;
      }

      const paymentId = result.data && result.data.paymentId;
      const status = result.data && result.data.status;
      const commitStatus = result.data && result.data.commitStatus;

      if (status === 'completed' || commitStatus === 'completed') {
        submitButton.disabled = false;
        submitButton.textContent = 'Recarregar carteira';
        setStatus('success', `Saldo creditado com sucesso. Payment ID: ${paymentId}`);
        return;
      }

      setStatus('info', `Pagamento iniciado com sucesso. Payment ID: ${paymentId}. A verificar o estado...`);
      if (paymentId) {
        pollStatus(paymentId);
      } else {
        submitButton.disabled = false;
        submitButton.textContent = 'Recarregar carteira';
      }
    } catch (_error) {
      submitButton.disabled = false;
      submitButton.textContent = 'Recarregar carteira';
      setStatus('error', 'Erro de conexao ao iniciar o checkout.');
    }
  });

  updateProviderUI(providerSelect.value);
});
