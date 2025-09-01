// reports.js - TaskAgent Rapporter
class ReportsApp {
    constructor() {
        this.currentPeriod = 'week';
        this.reportData = {};
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        await this.loadReports();
    }
    
    setupEventListeners() {
        // Period filter change
        document.getElementById('periodFilter').addEventListener('change', (e) => {
            this.currentPeriod = e.target.value;
            this.toggleCustomDates();
        });
        
        // Set default dates for custom period
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        document.getElementById('startDate').value = weekAgo.toISOString().split('T')[0];
        document.getElementById('endDate').value = today.toISOString().split('T')[0];
    }
    
    toggleCustomDates() {
        const customDates = document.getElementById('customDates');
        const customDatesEnd = document.getElementById('customDatesEnd');
        
        if (this.currentPeriod === 'custom') {
            customDates.style.display = 'block';
            customDatesEnd.style.display = 'block';
        } else {
            customDates.style.display = 'none';
            customDatesEnd.style.display = 'none';
        }
    }
    
    async loadReports() {
        try {
            // Update loading states
            this.showLoading();
            
            // Load all report data in parallel
            const [
                timeReport,
                projectAnalytics,
                clientAnalytics,
                productivityData
            ] = await Promise.all([
                this.loadTimeReport(),
                this.loadProjectAnalytics(),
                this.loadClientAnalytics(),
                this.loadProductivityData()
            ]);
            
            // Store data
            this.reportData = {
                timeReport,
                projectAnalytics,
                clientAnalytics,
                productivityData
            };
            
            // Update UI
            this.updateSummaryStats();
            this.renderTimeReport();
            this.renderProjectAnalytics();
            this.renderClientAnalytics();
            this.renderProductivityData();
            
            // Update period label
            this.updatePeriodLabel();
            
        } catch (error) {
            console.error('Error loading reports:', error);
            this.showError('Fejl ved indlæsning af rapporter');
        }
    }
    
    async loadTimeReport() {
        const params = this.getDateParams();
        const response = await fetch(`/reports/time?${params}`);
        return response.json();
    }
    
    async loadProjectAnalytics() {
        const response = await fetch('/reports/projects');
        return response.json();
    }
    
    async loadClientAnalytics() {
        const response = await fetch('/reports/clients');
        return response.json();
    }
    
    async loadProductivityData() {
        const response = await fetch('/reports/productivity');
        return response.json();
    }
    
    getDateParams() {
        const params = new URLSearchParams();
        params.append('period', this.currentPeriod);
        
        if (this.currentPeriod === 'custom') {
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
        }
        
        return params.toString();
    }
    
    showLoading() {
        const loadingElements = [
            'timeReportContent',
            'projectAnalytics', 
            'clientAnalytics'
        ];
        
        loadingElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = '<div class="loading">Indlæser...</div>';
            }
        });
    }
    
    showError(message) {
        const errorElements = [
            'timeReportContent',
            'projectAnalytics',
            'clientAnalytics'
        ];
        
        errorElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = `<div class="no-data">❌ ${message}</div>`;
            }
        });
    }
    
    updateSummaryStats() {
        const { productivityData } = this.reportData;
        
        if (productivityData && productivityData.summary) {
            const { summary } = productivityData;
            
            document.getElementById('totalTasks').textContent = summary.total_tasks || 0;
            document.getElementById('totalTime').textContent = this.formatTime(summary.total_time || 0);
            document.getElementById('avgTime').textContent = this.formatTime(summary.avg_task_time || 0);
            document.getElementById('activeTasks').textContent = summary.active_tasks || 0;
        }
    }
    
    renderTimeReport() {
        const { timeReport } = this.reportData;
        const container = document.getElementById('timeReportContent');
        
        if (!timeReport || timeReport.length === 0) {
            container.innerHTML = '<div class="no-data">📭 Ingen tidsdata for valgte periode</div>';
            return;
        }
        
        // Group by date
        const groupedByDate = this.groupByDate(timeReport);
        
        let html = '<table class="data-table">';
        html += '<thead><tr><th>Dato</th><th>Opgave</th><th>Projekt</th><th>Kunde</th><th>Tid</th></tr></thead>';
        html += '<tbody>';
        
        Object.entries(groupedByDate).forEach(([date, tasks]) => {
            const dateTotal = tasks.reduce((sum, task) => sum + (task.time_spent || 0), 0);
            
            // Date header row
            html += `<tr style="background: #f8f9fa; font-weight: 600;">`;
            html += `<td>${this.formatDate(date)}</td>`;
            html += `<td colspan="3">${tasks.length} opgaver</td>`;
            html += `<td><span class="time-badge">${this.formatTime(dateTotal)}</span></td>`;
            html += `</tr>`;
            
            // Task rows
            tasks.forEach(task => {
                html += '<tr>';
                html += `<td></td>`;
                html += `<td>${task.title}</td>`;
                html += `<td>${task.project_name || '-'}</td>`;
                html += `<td>${task.client_name || '-'}</td>`;
                html += `<td>${this.formatTime(task.time_spent || 0)}</td>`;
                html += '</tr>';
            });
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
    }
    
    renderProjectAnalytics() {
        const { projectAnalytics } = this.reportData;
        const container = document.getElementById('projectAnalytics');
        
        if (!projectAnalytics || projectAnalytics.length === 0) {
            container.innerHTML = '<div class="no-data">📁 Ingen projekt data</div>';
            return;
        }
        
        let html = '<table class="data-table">';
        html += '<thead><tr><th>Projekt</th><th>Kunde</th><th>Opgaver</th><th>Total Tid</th><th>Gennemsnit</th></tr></thead>';
        html += '<tbody>';
        
        projectAnalytics.forEach(project => {
            const totalTime = project.total_time || 0;
            const avgTime = project.avg_time_per_task || 0;
            
            html += '<tr>';
            html += `<td><strong>${project.project_name}</strong></td>`;
            html += `<td>${project.client_name || '-'}</td>`;
            html += `<td>${project.task_count}</td>`;
            html += `<td><span class="time-badge ${this.getTimeBadgeClass(totalTime)}">${this.formatTime(totalTime)}</span></td>`;
            html += `<td>${this.formatTime(avgTime)}</td>`;
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
    }
    
    renderClientAnalytics() {
        const { clientAnalytics } = this.reportData;
        const container = document.getElementById('clientAnalytics');
        
        if (!clientAnalytics || clientAnalytics.length === 0) {
            container.innerHTML = '<div class="no-data">🏢 Ingen kunde data</div>';
            return;
        }
        
        let html = '<table class="data-table">';
        html += '<thead><tr><th>Kunde</th><th>Projekter</th><th>Opgaver</th><th>Total Tid</th><th>Gennemsnit</th></tr></thead>';
        html += '<tbody>';
        
        clientAnalytics.forEach(client => {
            const totalTime = client.total_time || 0;
            const avgTime = client.avg_time_per_task || 0;
            
            html += '<tr>';
            html += `<td><strong>${client.client_name}</strong></td>`;
            html += `<td>${client.project_count}</td>`;
            html += `<td>${client.task_count}</td>`;
            html += `<td><span class="time-badge ${this.getTimeBadgeClass(totalTime)}">${this.formatTime(totalTime)}</span></td>`;
            html += `<td>${this.formatTime(avgTime)}</td>`;
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
    }
    
    renderProductivityData() {
        const { productivityData } = this.reportData;
        const container = document.getElementById('productivityData');
        
        if (!productivityData || !productivityData.daily_trends) {
            container.innerHTML = '<div class="no-data">📈 Ingen produktivitetsdata</div>';
            return;
        }
        
        const { daily_trends } = productivityData;
        
        let html = '<h3>🗓️ Daglige tendenser (seneste 30 dage)</h3>';
        html += '<table class="data-table">';
        html += '<thead><tr><th>Dato</th><th>Opgaver</th><th>Tid brugt</th><th>Aktive projekter</th></tr></thead>';
        html += '<tbody>';
        
        daily_trends.slice(0, 10).forEach(day => {
            html += '<tr>';
            html += `<td>${this.formatDate(day.date)}</td>`;
            html += `<td>${day.tasks_worked}</td>`;
            html += `<td><span class="time-badge">${this.formatTime(day.time_spent || 0)}</span></td>`;
            html += `<td>${day.projects_active}</td>`;
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
    }
    
    // Utility functions
    groupByDate(tasks) {
        return tasks.reduce((groups, task) => {
            const date = task.date;
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(task);
            return groups;
        }, {});
    }
    
    formatTime(seconds) {
        if (!seconds) return '00:00:00';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        return [hours, minutes, secs]
            .map(n => n.toString().padStart(2, '0'))
            .join(':');
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('da-DK', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    getTimeBadgeClass(seconds) {
        if (seconds > 14400) return 'high'; // > 4 timer
        if (seconds > 7200) return 'medium'; // > 2 timer
        if (seconds > 0) return 'low'; // > 0 timer
        return '';
    }
    
    updatePeriodLabel() {
        const periodFilter = document.getElementById('periodFilter');
        const selectedOption = periodFilter.options[periodFilter.selectedIndex];
        document.getElementById('reportPeriod').textContent = selectedOption.text;
    }
    
    // Export functions
    exportData(format) {
        const { timeReport, projectAnalytics, clientAnalytics } = this.reportData;
        
        if (format === 'csv') {
            this.exportCSV({
                timeReport,
                projectAnalytics,
                clientAnalytics
            });
        } else if (format === 'json') {
            this.exportJSON(this.reportData);
        }
    }
    
    exportCSV(data) {
        let csv = '';
        
        // Time report
        csv += 'TIDSRAPPORT\\n';
        csv += 'Dato,Opgave,Projekt,Kunde,Tid (sekunder)\\n';
        data.timeReport.forEach(task => {
            csv += `"${task.date}","${task.title}","${task.project_name || ''}","${task.client_name || ''}",${task.time_spent || 0}\\n`;
        });
        
        csv += '\\nPROJEKT ANALYSE\\n';
        csv += 'Projekt,Kunde,Antal Opgaver,Total Tid (sekunder),Gennemsnit (sekunder)\\n';
        data.projectAnalytics.forEach(project => {
            csv += `"${project.project_name}","${project.client_name || ''}",${project.task_count},${project.total_time || 0},${project.avg_time_per_task || 0}\\n`;
        });
        
        csv += '\\nKUNDE ANALYSE\\n';
        csv += 'Kunde,Projekter,Opgaver,Total Tid (sekunder),Gennemsnit (sekunder)\\n';
        data.clientAnalytics.forEach(client => {
            csv += `"${client.client_name}",${client.project_count},${client.task_count},${client.total_time || 0},${client.avg_time_per_task || 0}\\n`;
        });
        
        this.downloadFile(csv, 'taskagent-rapport.csv', 'text/csv');
    }
    
    exportJSON(data) {
        const json = JSON.stringify(data, null, 2);
        this.downloadFile(json, 'taskagent-rapport.json', 'application/json');
    }
    
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
}

// Global functions for HTML onclick events
window.loadReports = () => app.loadReports();
window.exportData = (format) => app.exportData(format);

// Initialize the app
const app = new ReportsApp();
