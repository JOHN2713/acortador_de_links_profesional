// Cargar estadísticas al iniciar
document.addEventListener('DOMContentLoaded', function() {
    loadStatistics();
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
