// Cargar estadísticas al iniciar
document.addEventListener('DOMContentLoaded', function() {
    loadStatistics();
    loadAnalyticsTable();
    
    // Auto-actualizar cada 10 segundos
    setInterval(() => {
        loadStatistics();
        loadAnalyticsTable();
    }, 10000);
    
    // Event listeners para búsqueda y filtros
    document.getElementById('analyticsSearch').addEventListener('input', filterAnalyticsTable);
    document.getElementById('analyticsFilter').addEventListener('change', filterAnalyticsTable);
    document.getElementById('deviceFilter').addEventListener('change', filterAnalyticsTable);
    document.getElementById('dateFilter').addEventListener('change', filterAnalyticsTable);
});

// Cargar todas las estadísticas
async function loadStatistics() {
    try {
        const response = await fetch('/api/urls');
        const data = await response.json();
        
        if (response.ok && data.urls) {
            const urls = data.urls;
            
            // Cargar todas las estadísticas en paralelo
            await Promise.all([
                displayMainStats(urls),
                displayTopUrls(urls),
                loadRecentActivity(urls)
            ]);
            
            displayMetrics(urls);
        }
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

// Estadísticas principales
function displayMainStats(urls) {
    const totalUrls = urls.length;
    const totalClicks = urls.reduce((sum, url) => sum + (url.clicks || 0), 0);
    const avgClicks = totalUrls > 0 ? Math.round(totalClicks / totalUrls) : 0;
    
    document.getElementById('totalUrls').textContent = totalUrls.toLocaleString();
    document.getElementById('totalClicks').textContent = totalClicks.toLocaleString();
    document.getElementById('avgClicks').textContent = avgClicks.toLocaleString();
}

// URLs más populares
function displayTopUrls(urls) {
    const topUrlsList = document.getElementById('topUrlsList');
    
    // Ordenar por clicks descendente
    const topUrls = [...urls]
        .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
        .slice(0, 10);
    
    if (topUrls.length === 0) {
        topUrlsList.innerHTML = `
            <div class="empty-stats">
                <i class="fas fa-chart-line"></i>
                <p>Aún no hay datos de URLs</p>
            </div>
        `;
        return;
    }
    
    const maxClicks = topUrls[0].clicks || 1;
    
    topUrlsList.innerHTML = topUrls.map((url, index) => {
        const percentage = ((url.clicks || 0) / maxClicks) * 100;
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
        
        return `
            <div class="top-url-item">
                <div class="top-url-rank">${medal || (index + 1)}</div>
                <div class="top-url-info">
                    <div class="top-url-code">
                        <i class="fas fa-link"></i>
                        <strong>${url.short_code}</strong>
                    </div>
                    <div class="top-url-original">${truncateUrl(url.original_url, 60)}</div>
                    <div class="top-url-bar">
                        <div class="bar-fill" style="width: ${percentage}%"></div>
                    </div>
                </div>
                <div class="top-url-clicks">
                    <span class="clicks-number">${url.clicks || 0}</span>
                    <small>clicks</small>
                </div>
            </div>
        `;
    }).join('');
}

// Actividad reciente
async function loadRecentActivity(urls) {
    const recentActivity = document.getElementById('recentActivity');
    
    // Obtener clicks recientes de las primeras 5 URLs más populares
    const topUrls = [...urls]
        .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
        .slice(0, 5);
    
    if (topUrls.length === 0) {
        recentActivity.innerHTML = `
            <div class="empty-stats">
                <i class="fas fa-history"></i>
                <p>Aún no hay actividad reciente</p>
            </div>
        `;
        return;
    }
    
    let allActivity = [];
    
    // Obtener clicks de cada URL
    for (const url of topUrls) {
        try {
            const response = await fetch(`/api/stats/${url.short_code}`);
            const data = await response.json();
            
            if (data.recent_clicks && data.recent_clicks.length > 0) {
                allActivity.push(...data.recent_clicks.map(click => ({
                    ...click,
                    short_code: url.short_code,
                    url_description: url.description
                })));
            }
        } catch (error) {
            console.error(`Error al cargar clicks de ${url.short_code}:`, error);
        }
    }
    
    // Ordenar por fecha más reciente
    allActivity.sort((a, b) => new Date(b.clicked_at) - new Date(a.clicked_at));
    
    // Mostrar últimos 20
    const recentClicks = allActivity.slice(0, 20);
    
    if (recentClicks.length === 0) {
        recentActivity.innerHTML = `
            <div class="empty-stats">
                <i class="fas fa-history"></i>
                <p>Aún no hay clicks registrados</p>
            </div>
        `;
        return;
    }
    
    recentActivity.innerHTML = recentClicks.map(click => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas fa-mouse-pointer"></i>
            </div>
            <div class="activity-content">
                <div class="activity-title">
                    <strong>${click.short_code}</strong>
                    ${click.url_description ? `<span class="activity-desc">${click.url_description}</span>` : ''}
                </div>
                <div class="activity-meta">
                    <span><i class="fas fa-clock"></i> ${formatTimeAgo(click.clicked_at)}</span>
                    ${click.ip_address ? `<span><i class="fas fa-globe"></i> ${click.ip_address}</span>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// Métricas de rendimiento
function displayMetrics(urls) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    // Obtener clicks por fecha (simulado ya que no tenemos fecha en clicks)
    const todayClicks = urls.filter(url => {
        const created = new Date(url.created_at);
        return created >= today;
    }).reduce((sum, url) => sum + (url.clicks || 0), 0);
    
    const weekClicks = urls.filter(url => {
        const created = new Date(url.created_at);
        return created >= weekAgo;
    }).reduce((sum, url) => sum + (url.clicks || 0), 0);
    
    // Última hora (estimado)
    const lastHourClicks = Math.round(todayClicks / 24);
    
    // Mejor día (el que tiene más URLs creadas)
    const urlsByDay = {};
    urls.forEach(url => {
        const day = new Date(url.created_at).toLocaleDateString('es-ES', { weekday: 'long' });
        urlsByDay[day] = (urlsByDay[day] || 0) + (url.clicks || 0);
    });
    
    const bestDay = Object.keys(urlsByDay).reduce((a, b) => 
        urlsByDay[a] > urlsByDay[b] ? a : b
    , Object.keys(urlsByDay)[0] || '-');
    
    const bestDayClicks = urlsByDay[bestDay] || 0;
    
    document.getElementById('weekClicks').textContent = weekClicks.toLocaleString();
    document.getElementById('todayClicks').textContent = todayClicks.toLocaleString();
    document.getElementById('bestDay').textContent = bestDay.charAt(0).toUpperCase() + bestDay.slice(1);
    document.getElementById('bestDayClicks').textContent = `${bestDayClicks} clicks`;
    document.getElementById('lastHourClicks').textContent = lastHourClicks.toLocaleString();
}

// Utilidades
function truncateUrl(url, maxLength) {
    return url.length > maxLength ? url.substring(0, maxLength) + '...' : url;
}

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Justo ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    
    return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// ============================================
// TABLA DE ANALYTICS DETALLADA
// ============================================

let allAnalytics = [];

// Cargar tabla de analytics
async function loadAnalyticsTable() {
    try {
        const response = await fetch('/api/analytics');
        const data = await response.json();
        
        if (response.ok && data.analytics) {
            allAnalytics = data.analytics;
            displayAnalyticsTable(allAnalytics);
            populateUrlFilter(allAnalytics);
        } else {
            showAnalyticsError();
        }
    } catch (error) {
        console.error('Error al cargar analytics:', error);
        showAnalyticsError();
    }
}

// Mostrar datos en la tabla
function displayAnalyticsTable(analytics) {
    const tbody = document.getElementById('analyticsTableBody');
    
    if (analytics.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 40px;">
                    <i class="fas fa-inbox" style="font-size: 48px; color: #64748b; margin-bottom: 10px;"></i>
                    <p style="color: #94a3b8; font-size: 16px;">No hay registros de clicks aún</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = analytics.map(record => {
        const date = new Date(record.clicked_at);
        const shortCode = record.urls?.short_code || 'Desconocido';
        const device = parseUserAgent(record.user_agent);
        
        return `
            <tr>
                <td>
                    <div class="analytics-url-badge">
                        <i class="fas fa-link"></i>
                        ${shortCode}
                    </div>
                </td>
                <td>
                    <div class="analytics-time">
                        <strong>${date.toLocaleDateString('es-ES', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                        })}</strong>
                        ${date.toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            second: '2-digit'
                        })}
                    </div>
                </td>
                <td>
                    <span class="analytics-ip">${record.ip_address || 'No disponible'}</span>
                </td>
                <td>
                    <div class="analytics-device">
                        <i class="${device.icon}"></i>
                        ${device.name}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Parsear User Agent para obtener info del dispositivo
function parseUserAgent(userAgent) {
    if (!userAgent) {
        return { name: 'Desconocido', icon: 'fas fa-question-circle' };
    }
    
    const ua = userAgent.toLowerCase();
    
    // Detectar SO
    let os = '';
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('mac')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
    
    // Detectar navegador
    let browser = '';
    if (ua.includes('edg')) browser = 'Edge';
    else if (ua.includes('chrome')) browser = 'Chrome';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('safari')) browser = 'Safari';
    else if (ua.includes('opera')) browser = 'Opera';
    
    // Detectar tipo de dispositivo
    let icon = 'fas fa-desktop';
    let deviceType = 'Desktop';
    
    if (ua.includes('mobile')) {
        icon = 'fas fa-mobile-alt';
        deviceType = 'Móvil';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
        icon = 'fas fa-tablet-alt';
        deviceType = 'Tablet';
    }
    
    const parts = [deviceType];
    if (os) parts.push(os);
    if (browser) parts.push(browser);
    
    return {
        name: parts.join(' • '),
        icon: icon
    };
}

// Filtrar tabla
function filterAnalyticsTable() {
    const searchTerm = document.getElementById('analyticsSearch').value.toLowerCase();
    const urlFilter = document.getElementById('analyticsFilter').value;
    const deviceFilter = document.getElementById('deviceFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;
    
    let filtered = allAnalytics;
    
    // Filtrar por URL
    if (urlFilter !== 'all') {
        filtered = filtered.filter(record => 
            record.urls?.short_code === urlFilter
        );
    }
    
    // Filtrar por dispositivo
    if (deviceFilter !== 'all') {
        filtered = filtered.filter(record => {
            const ua = (record.user_agent || '').toLowerCase();
            if (deviceFilter === 'mobile') {
                return ua.includes('mobile') && !ua.includes('tablet');
            } else if (deviceFilter === 'tablet') {
                return ua.includes('tablet') || ua.includes('ipad');
            } else if (deviceFilter === 'desktop') {
                return !ua.includes('mobile') && !ua.includes('tablet');
            }
            return true;
        });
    }
    
    // Filtrar por fecha
    if (dateFilter !== 'all') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        filtered = filtered.filter(record => {
            const clickDate = new Date(record.clicked_at);
            
            switch(dateFilter) {
                case 'today':
                    return clickDate >= today;
                case 'yesterday':
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);
                    return clickDate >= yesterday && clickDate < today;
                case 'week':
                    const weekAgo = new Date(today);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return clickDate >= weekAgo;
                case 'month':
                    const monthAgo = new Date(today);
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    return clickDate >= monthAgo;
                default:
                    return true;
            }
        });
    }
    
    // Filtrar por búsqueda
    if (searchTerm) {
        filtered = filtered.filter(record => {
            const shortCode = (record.urls?.short_code || '').toLowerCase();
            const ip = (record.ip_address || '').toLowerCase();
            const userAgent = (record.user_agent || '').toLowerCase();
            
            return shortCode.includes(searchTerm) || 
                   ip.includes(searchTerm) || 
                   userAgent.includes(searchTerm);
        });
    }
    
    displayAnalyticsTable(filtered);
}

// Poblar filtro de URLs
function populateUrlFilter(analytics) {
    const filter = document.getElementById('analyticsFilter');
    
    // Obtener URLs únicas
    const uniqueUrls = [...new Set(analytics.map(a => a.urls?.short_code).filter(Boolean))];
    
    // Limpiar y agregar opciones
    filter.innerHTML = '<option value="all">Todas las URLs</option>';
    uniqueUrls.forEach(shortCode => {
        filter.innerHTML += `<option value="${shortCode}">${shortCode}</option>`;
    });
}

// Mostrar error
function showAnalyticsError() {
    const tbody = document.getElementById('analyticsTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="4" style="text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #ef4444; margin-bottom: 10px;"></i>
                <p style="color: #94a3b8; font-size: 16px;">Error al cargar los registros</p>
            </td>
        </tr>
    `;
}

// Limpiar todos los filtros
function clearAllFilters() {
    document.getElementById('analyticsSearch').value = '';
    document.getElementById('analyticsFilter').value = 'all';
    document.getElementById('deviceFilter').value = 'all';
    document.getElementById('dateFilter').value = 'all';
    filterAnalyticsTable();
}
