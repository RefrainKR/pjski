import { storageManager } from '/lib/utils/StorageManager.js';

import { CHARACTER_RANKS_KEY } from '/data.js';

export class BackupViewModel {
    /**
     * @param {string} containerId - 백업/복원 버튼이 있는 HTML 컨테이너의 ID (예: 'backup-section').
     * @param {Function} messageDisplayCallback - 메시지를 표시하기 위한 콜백 함수.
     * @param {Function} getCharacterRanksCallback - RankPanelViewModel로부터 현재 랭크 데이터를 가져오는 콜백.
     * @param {Function} setCharacterRanksCallback - RankPanelViewModel로 랭크 데이터를 설정하는 콜백.
     */
    constructor(containerId, messageDisplayCallback, getCharacterRanksCallback, setCharacterRanksCallback) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`BackupViewModel: Container with ID '${containerId}' not found.`);
            return;
        }
        this.messageDisplayCallback = messageDisplayCallback;
        this.getCharacterRanksCallback = getCharacterRanksCallback;
        this.setCharacterRanksCallback = setCharacterRanksCallback;

        this.exportDataBtn = this.container.querySelector('#exportDataBtn');
        this.importFile = this.container.querySelector('#importFile');
        this.clearDataBtn = this.container.querySelector('#clearDataBtn');
        this.userIdDisplay = this.container.querySelector('#user-id-display'); // 사용자 ID 표시 요소

        this.bindEvents();
    }

    bindEvents() {
        if (this.exportDataBtn) {
            this.exportDataBtn.addEventListener('click', this.exportData.bind(this));
        }
        if (this.importFile) {
            this.importFile.addEventListener('change', this.importData.bind(this));
        }
        if (this.clearDataBtn) {
            this.clearDataBtn.addEventListener('click', this.clearData.bind(this));
        }
    }

    exportData() {
        const data = this.getCharacterRanksCallback();
        if (!data) {
            this.messageDisplayCallback('내보낼 데이터가 없습니다.', 'info');
            return;
        }
        const jsonData = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `character_ranks_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.messageDisplayCallback('데이터가 성공적으로 내보내졌습니다.', 'success');
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) {
            this.messageDisplayCallback('파일을 선택해주세요.', 'info');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                // 가져온 데이터의 유효성 검사 (간단하게)
                if (typeof importedData === 'object' && Object.keys(importedData).length > 0) {
                    this.setCharacterRanksCallback(importedData); // RankPanelViewModel로 데이터 설정
                    this.messageDisplayCallback('데이터가 성공적으로 가져와졌습니다.', 'success');
                } else {
                    this.messageDisplayCallback('유효하지 않은 JSON 파일입니다.', 'error');
                }
            } catch (error) {
                this.messageDisplayCallback('JSON 파일을 파싱하는 데 실패했습니다: ' + error.message, 'error');
                console.error("Error parsing imported JSON:", error);
            }
        };
        reader.onerror = () => {
            this.messageDisplayCallback('파일을 읽는 데 실패했습니다.', 'error');
        };
        reader.readAsText(file);
    }

    clearData() {
        if (confirm('정말로 모든 캐릭터 랭크 데이터를 지우시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            storageManager.remove(CHARACTER_RANKS_KEY);
            this.setCharacterRanksCallback({});
            this.messageDisplayCallback('모든 데이터가 지워졌습니다.', 'success');
        }
    }
}
