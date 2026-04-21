// Manejo del formulario de acortador de URLs
document.getElementById('urlForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Ocultar mensajes previos
    document.getElementById('successMessage').style.display = 'none';
    document.getElementById('errorMessage').style.display = 'none';
    
    // Obtener datos del formulario
    const formData = {
        original_url: document.getElementById('original_url').value,
        custom_name: document.getElementById('custom_name').value,
        description: document.getElementById('description').value
    };
    
    // Cambiar el botón a estado de carga
    const submitButton = document.querySelector('.btn-primary');
    const originalButtonText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    submitButton.disabled = true;
    
    try {
        // Enviar solicitud al backend
        const response = await fetch('/shorten', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Mostrar mensaje de éxito
            showSuccess(data);
        } else {
            // Mostrar mensaje de error
            showError(data.error || 'Ocurrió un error al procesar tu solicitud');
        }
    } catch (error) {
        showError('Error de conexión. Por favor, intenta nuevamente.');
        console.error('Error:', error);
    } finally {
        // Restaurar el botón
        submitButton.innerHTML = originalButtonText;
        submitButton.disabled = false;
    }
});

// Función para mostrar mensaje de éxito
function showSuccess(data) {
    const successMessage = document.getElementById('successMessage');
    const shortUrlInput = document.getElementById('shortUrl');
    const createdDate = document.getElementById('createdDate');
    const clickCount = document.getElementById('clickCount');
    
    // Establecer valores
    shortUrlInput.value = data.short_url;
    createdDate.textContent = new Date(data.created_at).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    clickCount.textContent = data.clicks || 0;
    
    // Mostrar mensaje
    successMessage.style.display = 'block';
    
    // Scroll suave al resultado
    successMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Función para mostrar mensaje de error
function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    errorText.textContent = message;
    errorMessage.style.display = 'flex';
    
    // Scroll suave al error
    errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

// Función para copiar al portapapeles
function copyToClipboard() {
    const shortUrlInput = document.getElementById('shortUrl');
    shortUrlInput.select();
    shortUrlInput.setSelectionRange(0, 99999); // Para móviles
    
    navigator.clipboard.writeText(shortUrlInput.value).then(() => {
        // Cambiar el texto del botón temporalmente
        const copyButton = document.querySelector('.btn-copy');
        const originalText = copyButton.innerHTML;
        copyButton.innerHTML = '<i class="fas fa-check"></i> ¡Copiado!';
        
        setTimeout(() => {
            copyButton.innerHTML = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Error al copiar:', err);
        // Fallback para navegadores antiguos
        document.execCommand('copy');
    });
}

// Validación en tiempo real del nombre personalizado
document.getElementById('custom_name').addEventListener('input', function(e) {
    const value = e.target.value;
    const pattern = /^[a-zA-Z0-9-_]*$/;
    
    if (!pattern.test(value)) {
        e.target.value = value.replace(/[^a-zA-Z0-9-_]/g, '');
    }
});

// Validación de URL
document.getElementById('original_url').addEventListener('blur', function(e) {
    const url = e.target.value;
    try {
        new URL(url);
        e.target.style.borderColor = 'var(--border-color)';
    } catch (err) {
        if (url) {
            e.target.style.borderColor = 'var(--error-color)';
        }
    }
});
