// js/App.js

import { SkillCalculator } from './components/SkillCalculator.js';
import { CharacterRankManager } from './components/CharacterRankManager.js';
import { BackupManager } from './components/BackupManager.js';
import { MESSAGE_DISPLAY_DURATION } from './data.js';
// DraggableScroller 유틸리티를 import 합니다.
import { DraggableScroller } from './utils/DraggableScroller.js';

export class App {
    constructor() {
        this.messageDisplayElement = document.getElementById('message-display');
        if (!this.messageDisplayElement) {
            console.error("Message display element with ID 'message-display' not found.");
        }

        // SkillCalculator 인스턴스화
        // skill-calculator-container는 main 태그 안에 있으므로 바로 접근 가능
        this.skillCalculator = new SkillCalculator('skill-calculator-container', this.messageDisplay.bind(this));

        // CharacterRankManager 인스턴스화 (캐릭터 랭크 탭의 컨테이너를 전달)
        // 'character-ranks-content-tab'은 탭 안에 있으므로, 초기에는 null일 수 있음.
        // CharacterRankManager 내부에서 해당 요소를 찾도록 하고, 탭 활성화 시 렌더링을 트리거.
        this.characterRankManager = new CharacterRankManager('character-ranks-content-tab', this.messageDisplay.bind(this));

        // BackupManager 인스턴스화 (백업 섹션 컨테이너 전달 및 콜백 함수 제공)
        // 'backup-section'은 헤더 드롭다운 섹션에 있으므로 바로 접근 가능
        this.backupManager = new BackupManager(
            'backup-section', // 백업 섹션의 ID
            this.messageDisplay.bind(this),
            this.characterRankManager.getCharacterRanks.bind(this.characterRankManager),
            this.characterRankManager.setCharacterRanks.bind(this.characterRankManager)
        );

        this.initTabNavigation();
        this.initDropdownSections();
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

                // 클릭된 버튼에 해당하는 탭 콘텐츠 보여주기
                const targetTabId = button.dataset.tab;
                const targetTabContent = document.getElementById(targetTabId);
                if (targetTabContent) {
                    targetTabContent.classList.add('active');
                    // '캐릭터 랭크' 탭이 활성화될 때만 CharacterRankManager 렌더링
                    if (targetTabId === 'character-tab') {
                        this.characterRankManager.renderCharacterRanks();
                    }
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

    initDropdownSections() {
        // 헤더의 버튼들
        const rankManagementBtn = document.getElementById('rankManagementBtn');
        const backupBtn = document.getElementById('backupBtn');
        // 스킬 계산기 탭 내의 '자동 입력' 버튼은 SkillCalculator 클래스에서 직접 관리하므로 여기서 참조하지 않음.
        // SkillCalculator는 autoInputTriggerBtn에 대한 이벤트 리스너를 자체적으로 바인딩합니다.

        // 드롭다운 섹션들
        const characterRanksDropdownSection = document.getElementById('character-ranks-section'); // 헤더 드롭다운
        const backupDropdownSection = document.getElementById('backup-section'); // 헤더 드롭다운
        const autoInputDropdownSection = document.getElementById('auto-input-section'); // 헤더 드롭다운

        // 모든 드롭다운 섹션을 닫는 헬퍼 함수
        const closeAllDropdowns = () => {
            [characterRanksDropdownSection, backupDropdownSection, autoInputDropdownSection].forEach(section => {
                if (section) section.classList.remove('active');
            });
        };

        // '캐릭터 랭크 관리' 버튼 (헤더)
        if (rankManagementBtn) {
            rankManagementBtn.addEventListener('click', () => {
                closeAllDropdowns();
                if (characterRanksDropdownSection) {
                    characterRanksDropdownSection.classList.add('active');
                    // 드롭다운 열 때 캐릭터 랭크를 렌더링 (탭의 렌더링과 별개)
                    this.characterRankManager.renderCharacterRanks('character-ranks-content'); // 드롭다운용 컨테이너 ID 전달
                }
            });
        }

        // '백업' 버튼 (헤더)
        if (backupBtn) {
            backupBtn.addEventListener('click', () => {
                closeAllDropdowns();
                if (backupDropdownSection) {
                    backupDropdownSection.classList.add('active');
                    this.backupManager.displayUserId(); // 백업 모달 열 때 사용자 ID 업데이트
                }
            });
        }

        // 모든 드롭다운 섹션의 닫기 버튼
        document.querySelectorAll('.dropdown-section .close-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const targetId = event.target.dataset.target;
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    targetSection.classList.remove('active');
                }
            });
        });
    }

    initDraggableScrolling() {
        const draggableNavbar = document.querySelector('.navbar-actions');
        const draggableSkillControls = document.querySelector('.skill-controls-top');
        
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
