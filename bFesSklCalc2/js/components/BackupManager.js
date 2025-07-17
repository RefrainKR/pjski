// js/components/BackupManager.js

import { LOCAL_STORAGE_KEY } from '../data.js';

export class BackupManager {
    constructor(containerId, messageDisplayCallback, characterRankManagerInstance) {
        this.container = document.getElementById(containerId);
        this.closeButton = this.container.querySelector('.close-btn');
        this.downloadBtn = this.container.querySelector('#downloadBtn');
        this.uploadFile = this.container.querySelector('#uploadFile');
        this.messageDisplayCallback = messageDisplayCallback;
        this.characterRankManager = characterRankManagerInstance; // CharacterRankManager 인스턴스 주입

        this.bindEvents();
    }

    bindEvents() {
        this.downloadBtn.addEventListener('click', this.handleDownload.bind(this));
        this.uploadFile.addEventListener('change', this.handleUpload.bind(this));
        // closeButton 이벤트는 UIManager에서 처리하므로 여기서는 제거
    }

    handleDownload() {
        const dataStr = localStorage.getItem(LOCAL_STORAGE_KEY); // 직접 LocalStorage에서 데이터 가져오기
        if (!dataStr) {
            this.messageDisplayCallback('다운로드할 데이터가 없습니다.', 'error');
            return;
        }

        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'character_ranks_data.json'; // 파일명 일관성 유지
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.messageDisplayCallback('랭크 데이터가 다운로드되었습니다.', 'success');
    }

    handleUpload(event) {
        const file = event.target.files[0];
        if (!file) {
            this.messageDisplayCallback('파일을 선택해주세요.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const loadedRanks = JSON.parse(e.target.result);
                // CharacterRankManager의 메서드를 사용하여 데이터 로드 및 UI 갱신
                this.characterRankManager.characterRanks = {}; // 초기화
                this.characterRankManager.loadRanksFromLocalStorage(); // 기존 데이터 로드 (CHARACTER_DATA 기준)

                let updateCount = 0;
                // 불러온 데이터를 기존 CHARACTER_DATA 구조에 맞게 병합
                Object.keys(loadedRanks).forEach(groupName => {
                    if (this.characterRankManager.characterRanks[groupName]) {
                        Object.keys(loadedRanks[groupName]).forEach(characterId => {
                            const uploadedCharData = loadedRanks[groupName][characterId];
                            if (uploadedCharData) {
                                const rank = parseInt(uploadedCharData.rank);
                                const active = uploadedCharData.active;
                                if (!isNaN(rank) && rank >= 1 && rank <= 100 && typeof active === 'boolean') {
                                    this.characterRankManager.characterRanks[groupName][characterId] = { rank: rank, active: active };
                                    updateCount++;
                                }
                            }
                        });
                    }
                });

                this.characterRankManager.saveRanksToLocalStorage();
                this.characterRankManager.renderUI(); // CharacterRankManager의 UI 갱신
                this.messageDisplayCallback(`${updateCount}개의 캐릭터 랭크가 업데이트되었습니다.`, 'success');

            } catch (error) {
                this.messageDisplayCallback('유효하지 않은 JSON 파일이거나 데이터 형식 오류입니다.', 'error');
                console.error('Error parsing JSON or data format issue:', error);
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // 파일 입력 필드 초기화
    }
}