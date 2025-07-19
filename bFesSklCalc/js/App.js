// js/App.js

import { MESSAGE_DISPLAY_DURATION } from './data.js';
import { SkillComparisonTable } from './components/SkillComparisonTable.js';
import { CharacterRankManager } from './components/CharacterRankManager.js';
import { BackupManager } from './components/BackupManager.js';
import { DraggableScroller } from './utils/DraggableScroller.js';
import { PopupManager } from './utils/PopupManager.js';

export class App {
    constructor() {
        this.messageDisplayElement = document.getElementById('message-display');
        if (!this.messageDisplayElement) {
            console.error("Message display element with ID 'message-display' not found.");
        }

        // SkillCalculator 인스턴스화
        // skill-calculator-container는 main 태그 안에 있으므로 바로 접근 가능
        this.skillComparisonTable = new SkillComparisonTable('skill-calculator-container', this.messageDisplay.bind(this));

        // CharacterRankManager 인스턴스화 (캐릭터 랭크 탭의 컨테이너를 전달)
        // 'character-ranks-content-tab'은 탭 안에 있으므로, 초기에는 null일 수 있음.
        // CharacterRankManager 내부에서 해당 요소를 찾도록 하고, 탭 활성화 시 렌더링을 트리거.
        this.characterRankManager = new CharacterRankManager('character-ranks-tab-content', this.messageDisplay.bind(this));

        // BackupManager 인스턴스화 (백업 섹션 컨테이너 전달 및 콜백 함수 제공)
        this.backupManager = new BackupManager(
            'backup-panel', // 백업 섹션의 ID
            this.messageDisplay.bind(this),
            this.characterRankManager.getCharacterRanks.bind(this.characterRankManager),
            this.characterRankManager.setCharacterRanks.bind(this.characterRankManager)
        );

        this.popupManager = new PopupManager();

        // --- 콜백 등록 로직 추가 ---
        // 1. '캐릭터 랭크' 패널이 열릴 때
        this.popupManager.onOpen('character-ranks-panel', () => {
            this.characterRankManager.renderCharacterRanks('character-ranks-content');
        });

        // 2. '백업' 패널이 열릴 때
        this.popupManager.onOpen('backup-panel', () => {
            this.backupManager.displayUserId();
        });

        // 3. '자동 입력' 패널이 열릴 때 (필요하다면)
        // 현재는 SkillComparisonTable에서 값을 채우므로 특별한 동작은 불필요.
        // 하지만 만약 필요하다면 아래와 같이 등록 가능
        // this.popupManager.onOpen('auto-input-panel', () => {
        //     console.log('자동 입력 패널 열림');
        // });

        this.initTabNavigation();
        this.initDraggableScrolling(); 
    }

    /**
     * 메시지를 화면에 표시하고 일정 시간 후 사라지게 합니다.
     * @param {string} message - 표시할 메시지 텍스트.
     * @param {'success'|'error'|'info'} type - 메시지 타입 (색상 결정).
     */
    messageDisplay(message, type) {
        if (this.messageDisplayElement) {
            this.messageDisplayElement.textContent = message;
            this.messageDisplayElement.className = `message ${type}`; // 기존 클래스 제거 후 새 클래스 추가

            // 일정 시간 후 메시지 숨기기
            setTimeout(() => {
                this.messageDisplayElement.className = 'message'; // 클래스 초기화 (숨김)
                this.messageDisplayElement.textContent = '';
            }, MESSAGE_DISPLAY_DURATION);
        } else {
            console.warn("Message display element not found. Message:", message, "Type:", type);
        }
    }

    initTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-buttons .tab-button');
        const tabContents = document.querySelectorAll('.tab-content-wrapper .tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // 모든 탭 버튼의 active 클래스 제거
                tabButtons.forEach(btn => btn.classList.remove('active'));
                // 클릭된 버튼에 active 클래스 추가
                button.classList.add('active');

                // 모든 탭 콘텐츠 숨기기
                tabContents.forEach(content => content.classList.remove('active'));

                const targetTabId = button.dataset.tab;
                const targetTabContent = document.getElementById(targetTabId);
                if (targetTabContent) {
                    targetTabContent.classList.add('active');
                    
                    // '캐릭터 랭크' 탭 관련 렌더링 로직을 제거 또는 주석 처리합니다.
                    /* 
                    if (targetTabId === 'character-tab') {
                        this.characterRankManager.renderCharacterRanks();
                    }
                    */
                }
            });
        });

        // 페이지 로드 시 기본 활성 탭 설정 (스킬 계산기 탭)
        const initialActiveTabButton = document.querySelector('.tab-buttons .tab-button.active');
        if (initialActiveTabButton) {
            const initialTargetTabId = initialActiveTabButton.dataset.tab;
            const initialTargetTabContent = document.getElementById(initialTargetTabId);
            if (initialTargetTabContent) {
                initialTargetTabContent.classList.add('active');
            }
        }
    }

    initDraggableScrolling() {
        const draggableNavbar = document.querySelector('.navbar-actions');
        const draggableSkillControls = document.querySelector('.table-config-group');
        
        if (draggableNavbar) {
            new DraggableScroller(draggableNavbar);
        }
        if (draggableSkillControls) {
            new DraggableScroller(draggableSkillControls);
        }
    }
}

// DOMContentLoaded 이벤트 리스너를 사용하여 DOM이 완전히 로드된 후 App 인스턴스 생성
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
