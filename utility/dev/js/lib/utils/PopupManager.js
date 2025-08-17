
export class PopupManager {
    constructor() {
        this.popupTriggers = document.querySelectorAll('[data-popup-trigger]');
        this.popupPanels = document.querySelectorAll('[data-popup-id]');
        this.closeButtons = document.querySelectorAll('.popup-close-btn');
        this.activePanel = null;

        this.bindEvents();

		this.onOpenCallbacks = {};
    }

    bindEvents() {
        // 팝업 열기 버튼 이벤트
        this.popupTriggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                const panelId = trigger.dataset.popupTrigger;
                const panel = document.querySelector(`[data-popup-id="${panelId}"]`);
                if (panel) {
                    this.open(panel, trigger);
                }
            });
        });
        // 팝업 닫기 버튼 이벤트
        this.closeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const panel = button.closest('.popup-panel');
                if (panel) {
                    this.close(panel);
                }
            });
        });
        // 외부 클릭 시 팝업 닫기
        document.addEventListener('click', (e) => {
            if (this.activePanel && !this.activePanel.contains(e.target) && !e.target.closest('[data-popup-trigger]')) {
                this.close(this.activePanel);
            }
        });
        // 닫기 요청 이벤트 수신
        document.body.addEventListener('closePopupRequest', (e) => {
            if (this.activePanel) {
                this.close(this.activePanel);
            }
        });
    }

    open(panel, trigger) {
        // 다른 모든 패널 닫기
        this.popupPanels.forEach(p => this.close(p));
        
        // 위치 설정
        const positionType = panel.dataset.popupPosition;
        if (positionType === 'trigger') {
            this.positionPanelNearTrigger(panel, trigger);
        }
        
        panel.classList.add('active');
        this.activePanel = panel;

		// --- onOpen 콜백 실행 로직 추가 ---
        const panelId = panel.dataset.popupId;
        if (typeof this.onOpenCallbacks[panelId] === 'function') {
            this.onOpenCallbacks[panelId](trigger);
        }
    }

    onOpen(panelId, callback) {
        this.onOpenCallbacks[panelId] = callback;
    }

    close(panel) {
        panel.classList.remove('active');
        if (this.activePanel === panel) {
            this.activePanel = null;
        }
    }

    positionPanelNearTrigger(panel, trigger) {
        const buttonRect = trigger.getBoundingClientRect();
        panel.style.top = `${buttonRect.bottom + window.scrollY + 8}px`;
        panel.style.left = `${buttonRect.left}px`;
        panel.style.transform = 'none';
    }
}