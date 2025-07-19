import { SkillComparisonTable } from './components/SkillComparisonTable.js';
import { CharacterSkillTable } from './components/CharacterSkillTable.js';
import { CharacterRankManager } from './components/CharacterRankManager.js';
import { BackupManager } from './components/BackupManager.js';
import { MESSAGE_DISPLAY_DURATION } from './data.js';
import { DraggableScroller } from './utils/DraggableScroller.js';
import { PopupManager } from './utils/PopupManager.js';

export class App {
    constructor() {
        this.messageDisplayElement = document.getElementById('message-display');
        
        this.characterRankManager = new CharacterRankManager(null, this.messageDisplay.bind(this));
        
        this.skillComparisonTable = new SkillComparisonTable({
            containerId: 'rank-skill-container',
            messageDisplayCallback: this.messageDisplay.bind(this),
            displayModeBtnId: 'btn-display-mode',
        });
        
        this.characterSkillTable = new CharacterSkillTable({
            containerId: 'character-skill-container',
            messageDisplayCallback: this.messageDisplay.bind(this),
            characterRankManager: this.characterRankManager,
            displayModeBtnId: 'btn-display-mode-char',
        });

        this.backupManager = new BackupManager(
            'backup-panel',
            this.messageDisplay.bind(this),
            this.characterRankManager.getCharacterRanks.bind(this.characterRankManager),
            this.characterRankManager.setCharacterRanks.bind(this.characterRankManager)
        );

        this.popupManager = new PopupManager();
        this.popupManager.onOpen('character-ranks-panel', () => {
            this.characterRankManager.renderCharacterRanks('character-ranks-content');
        });
        this.popupManager.onOpen('backup-panel', () => {
            this.backupManager.displayUserId();
        });

        // "자동 입력" 팝업이 열릴 때, 어떤 테이블이 열었는지에 따라 "적용" 버튼의 이벤트를 연결
        this.popupManager.onOpen('auto-input-panel', (trigger) => {
            const activeTable = trigger.id.includes('-char')
                ? this.characterSkillTable 
                : this.skillComparisonTable;
            
            activeTable.setupAutoInputPanel();
            activeTable.bindApplyAutoInputEvent();
        });

        this.initTabNavigation();
        this.initDraggableScrolling(); 

        this.bindCustomEvents();
    }

    messageDisplay(message, type) {
        if (this.messageDisplayElement) {
            this.messageDisplayElement.textContent = message;
            this.messageDisplayElement.className = `message ${type}`;
            setTimeout(() => {
                this.messageDisplayElement.className = 'message';
                this.messageDisplayElement.textContent = '';
            }, MESSAGE_DISPLAY_DURATION);
        }
    }

    initTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-buttons .tab-button');
        const tabContents = document.querySelectorAll('.tab-content-wrapper .tab-content');

        const activateTab = (tabButton) => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabButton.classList.add('active');
            tabContents.forEach(content => content.classList.remove('active'));

            const targetTabId = tabButton.dataset.tab;
            const targetTabContent = document.getElementById(targetTabId);
            if (targetTabContent) {
                targetTabContent.classList.add('active');
                if (targetTabId === 'character-skill-tab') {
                    this.characterSkillTable.refresh();
                }
            }
        }

        tabButtons.forEach(button => {
            button.addEventListener('click', () => activateTab(button));
        });

        const initialActiveTabButton = document.querySelector('.tab-buttons .tab-button.active');
        if (initialActiveTabButton) {
            activateTab(initialActiveTabButton);
        }
    }

    initDraggableScrolling() {
        const draggableElements = document.querySelectorAll('.navbar-actions, .table-config-group');
        draggableElements.forEach(el => new DraggableScroller(el));
    }

    bindCustomEvents() {
        document.body.addEventListener('characterRanksUpdated', () => {
            // 캐릭터 랭크 정보가 업데이트되었다는 신호를 받으면,
            
            // 현재 활성화된 탭을 확인합니다.
            const activeTab = document.querySelector('.tab-button.active');
            if (activeTab && activeTab.dataset.tab === 'character-skill-tab') {
                // 만약 '캐릭터별' 탭이 활성화된 상태라면,
                // characterSkillTable의 refresh 메서드를 호출하여 드롭다운을 즉시 갱신합니다.
                this.characterSkillTable.refresh();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});