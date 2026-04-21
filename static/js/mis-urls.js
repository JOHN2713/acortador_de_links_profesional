// Variables globales
let allUrls = [];
let deleteUrlId = null;

// Cargar URLs al iniciar
document.addEventListener('DOMContentLoaded', function() {
    loadUrls();
    setupEventListeners();
    
    // Auto-actualizar cada 10 segundos para reflejar nuevos clicks
    setInterval(() => {
        loadUrls();
    }, 10000);
});

// Configurar event listeners
function setupEventListeners() {
    // Búsqueda en tiempo real
    document.getElementById('searchInput').addEventListener('input', filterUrls);
    
    // Ordenamiento
    document.getElementById('sortSelect').addEventListener('change', sortUrls);
}

// Cargar todas las URLs
async function loadUrls() {
    try {
        const response = await fetch('/api/urls');
        const data = await response.json();
        
        if (response.ok && data.urls) {
            allUrls = data.urls;
            displayUrls(allUrls);
            updateStats(allUrls);
        } else {
            showEmptyState();
        }
    } catch (error) {
        console.error('Error al cargar URLs:', error);
        showError('Error al cargar las URLs');
    } finally {
        document.getElementById('loadingSpinner').style.display = 'none';
    }
}

// Mostrar URLs en la tabla
function displayUrls(urls) {
    const urlsList = document.getElementById('urlsList');
    const urlsContainer = document.getElementById('urlsContainer');
    const emptyState = document.getElementById('emptyState');
    
    if (urls.length === 0) {
        showEmptyState();
        return;
    }
    
    urlsContainer.style.display = 'block';
    emptyState.style.display = 'none';
    
    urlsList.innerHTML = urls.map(url => `
        <div class="table-row" data-url-id="${url.id}">
            <div class="col-code">
                <div class="short-code">
                    <i class="fas fa-link"></i>
                    <span>${url.short_code}</span>
                </div>
                ${url.description ? `<small class="url-description">${url.description}</small>` : ''}
            </div>
            <div class="col-original">
                <a href="${url.original_url}" target="_blank" class="original-url" title="${url.original_url}">
                    ${truncateUrl(url.original_url, 50)}
                    <i class="fas fa-external-link-alt"></i>
                </a>
            </div>
            <div class="col-clicks">
                <span class="clicks-badge">${url.clicks || 0}</span>
            </div>
            <div class="col-date">
                <span class="date-text">${formatDate(url.created_at)}</span>
            </div>
            <div class="col-actions">
                <button class="btn-action btn-copy" onclick="copyUrl('${url.short_code}')" title="Copiar URL">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="btn-action btn-stats" onclick="viewStats('${url.short_code}')" title="Ver Estadísticas">
                    <i class="fas fa-chart-bar"></i>
                </button>
                <button class="btn-action btn-delete" onclick="deleteUrl('${url.id}', '${url.short_code}')" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Actualizar estadísticas
function updateStats(urls) {
    const totalUrls = urls.length;
    const totalClicks = urls.reduce((sum, url) => sum + (url.clicks || 0), 0);
    
    // URLs de hoy
    const today = new Date().toDateString();
    const todayUrls = urls.filter(url => new Date(url.created_at).toDateString() === today);
    
    // URL más popular
    const topUrl = urls.reduce((max, url) => 
        (url.clicks || 0) > (max.clicks || 0) ? url : max
    , urls[0] || {});
    
    document.getElementById('totalUrls').textContent = totalUrls;
    document.getElementById('totalClicks').textContent = totalClicks;
    document.getElementById('todayClicks').textContent = todayUrls.length;
    document.getElementById('topUrl').textContent = topUrl.short_code || '-';
}

// Filtrar URLs por búsqueda
function filterUrls() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    const filtered = allUrls.filter(url => 
        url.short_code.toLowerCase().includes(searchTerm) ||
        url.original_url.toLowerCase().includes(searchTerm) ||
        (url.description && url.description.toLowerCase().includes(searchTerm))
    );
    
    displayUrls(filtered);
}

// Ordenar URLs
function sortUrls() {
    const sortBy = document.getElementById('sortSelect').value;
    let sorted = [...allUrls];
    
    switch(sortBy) {
        case 'recent':
            sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
        case 'oldest':
            sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            break;
        case 'popular':
            sorted.sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
            break;
        case 'name':
            sorted.sort((a, b) => a.short_code.localeCompare(b.short_code));
            break;
    }
    
    displayUrls(sorted);
}

// Copiar URL al portapapeles
async function copyUrl(shortCode) {
    const baseUrl = window.location.origin;
    const fullUrl = `${baseUrl}/${shortCode}`;
    
    try {
        // Intentar con Clipboard API moderno
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(fullUrl);
            showToast('✓ URL copiada al portapapeles', 'success');
        } else {
            // Fallback para navegadores antiguos
            const textArea = document.createElement('textarea');
            textArea.value = fullUrl;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                showToast('✓ URL copiada al portapapeles', 'success');
            } catch (err) {
                console.error('Fallback: Error al copiar', err);
                showToast('Error al copiar URL. Cópiala manualmente: ' + fullUrl, 'error');
            }
            
            document.body.removeChild(textArea);
        }
    } catch (error) {
        console.error('Error al copiar:', error);
        // Mostrar la URL para copiar manualmente
        prompt('Copia esta URL manualmente:', fullUrl);
    }
}

// Ver estadísticas de una URL
function viewStats(shortCode) {
    window.location.href = `/estadisticas/${shortCode}`;
}

// Eliminar URL
function deleteUrl(id, shortCode) {
    deleteUrlId = id;
    document.getElementById('deleteModal').style.display = 'flex';
}

// Confirmar eliminación
async function confirmDelete() {
    if (!deleteUrlId) return;
    
    try {
        const response = await fetch(`/api/urls/${deleteUrlId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('✓ URL eliminada exitosamente', 'success');
            closeDeleteModal();
            loadUrls(); // Recargar lista
        } else {
            showToast('Error al eliminar URL', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al eliminar URL', 'error');
    }
}

// Cerrar modal de eliminación
function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    deleteUrlId = null;
}

// Mostrar estado vacío
function showEmptyState() {
    document.getElementById('urlsContainer').style.display = 'none';
    document.getElementById('emptyState').style.display = 'flex';
    document.getElementById('totalUrls').textContent = '0';
    document.getElementById('totalClicks').textContent = '0';
    document.getElementById('todayClicks').textContent = '0';
    document.getElementById('topUrl').textContent = '-';
}

// Mostrar toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Mostrar error
function showError(message) {
    const urlsList = document.getElementById('urlsList');
    urlsList.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
        </div>
    `;
}

// Utilidades
function truncateUrl(url, maxLength) {
    return url.length > maxLength ? url.substring(0, maxLength) + '...' : url;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'Hoy';
    } else if (diffDays === 1) {
        return 'Ayer';
    } else if (diffDays < 7) {
        return `Hace ${diffDays} días`;
    } else {
        return date.toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }
}
