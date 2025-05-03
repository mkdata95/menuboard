// 페이지 로드 시 실행할 코드
document.addEventListener('DOMContentLoaded', function() {
    // 알림 메시지 자동 닫기
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(function(alert) {
        setTimeout(function() {
            const closeButton = alert.querySelector('.btn-close');
            if (closeButton) {
                closeButton.click();
            }
        }, 5000); // 5초 후 알림 닫기
    });
    
    // BS5 툴팁 초기화
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(function(tooltip) {
        new bootstrap.Tooltip(tooltip);
    });
}); 