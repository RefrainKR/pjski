// js/components/BackupManager.js

import { LOCAL_STORAGE_KEY } from '../data.js';

export class BackupManager {
    /**
     * @param {string} containerId - 백업/복원 버튼이 있는 HTML 컨테이너의 ID (예: 'backup-section').
     * @param {Function} messageDisplayCallback - 메시지를 표시하기 위한 콜백 함수.
     * @param {Function} getCharacterRanksCallback - CharacterRankManager로부터 현재 랭크 데이터를 가져오는 콜백.
     * @param {Function} setCharacterRanksCallback - CharacterRankManager로 랭크 데이터를 설정하는 콜백.
     */
    constructor(containerId, messageDisplayCallback, getCharacterRanksCallback, setCharacterRanksCallback) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`BackupManager: Container with ID '${containerId}' not found.`);
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
        this.displayUserId(); // 초기 사용자 ID 표시
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

    displayUserId() {
        // Firestore userId가 구현될 경우 여기에 표시 로직 추가
        // 현재는 LocalStorage 기반이므로 임시 메시지 또는 비워둠
        if (this.userIdDisplay) {
            this.userIdDisplay.textContent = '현재 사용자 ID: (로컬 저장소)';
            // 실제 Firestore 연동 시:
            // const auth = getAuth();
            // if (auth.currentUser) {
            //    this.userIdDisplay.textContent = `현재 사용자 ID: ${auth.currentUser.uid}`;
            // } else {
            //    this.userIdDisplay.textContent = '로그인되지 않음';
            // }
        }
    }

    exportData() {
        const data = this.getCharacterRanksCallback(); // CharacterRankManager로부터 데이터 가져오기
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
                    this.setCharacterRanksCallback(importedData); // CharacterRankManager로 데이터 설정
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
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            this.setCharacterRanksCallback({}); // CharacterRankManager의 데이터를 빈 객체로 초기화
            this.messageDisplayCallback('모든 데이터가 지워졌습니다.', 'success');
        }
    }
}
