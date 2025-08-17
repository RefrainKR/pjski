import { DraggableScroller } from '/lib/utils/DraggableScroller.js';
import { PopupManager } from '/lib/utils/PopupManager.js';

import { BackupViewModel } from '/viewModel/backup/BackupViewModel.js';
import { SkillComparisonViewModel } from '/viewModel/skillComparison/SkillComparisonViewModel.js';

import { RankPanelViewModel } from '/viewModel/rankPanel/RankPanelViewModel.js';

import { EventPointViewModel } from '/viewModel/eventPoint/EventPointViewModel.js';

import { MESSAGE_DISPLAY_DURATION} from '/data.js';

export class App {
    constructor() {
        this.messageDisplayElement = document.getElementById('message-display');
        
        this.rankPanelViewModel = new RankPanelViewModel(null, this.messageDisplay.bind(this));

        this.skillComparisonViewModel = new SkillComparisonViewModel({
            // SkillComparisonViewModel 자체가 사용할 정보
            containerId: 'tool-skill-comparison',
            
            // 하위 ViewModel들이 공통으로 사용할 정보
            messageDisplayCallback: this.messageDisplay.bind(this),
            rankPanelViewModel: this.rankPanelViewModel,
            
            // ComparisonByRankViewModel이 사용할 정보
            rankTableConfig: {
                containerId: 'rank-skill-tab',
                tabId: 'byRank',
                displayModeBtnId: 'btn-display-mode',
                numberFormatBtnId: 'btn-number-format',
                multiplierBtnId: 'btn-multiplier'
            },
            
            // ComparisonBySkillLevelViewModel이 사용할 정보
            characterTableConfig: {
                containerId: 'skill-level-tab',
                tabId: 'bySkillLevel',
                displayModeBtnId: 'btn-display-mode-char',
                numberFormatBtnId: 'btn-number-format-char',
                multiplierBtnId: 'btn-multiplier-char'
            }
        });
        this.skillComparisonViewModel.init();

        this.eventPointViewModel  = new EventPointViewModel ({
            containerId: 'tool-event-point-calculator',
            messageDisplayCallback: this.messageDisplay.bind(this)
        });

        this.backupViewModel = new BackupViewModel(
            'backup-panel',
            this.messageDisplay.bind(this),
            this.rankPanelViewModel.getCharacterRanks.bind(this.rankPanelViewModel),
            this.rankPanelViewModel.setCharacterRanks.bind(this.rankPanelViewModel)
        );

        this.popupManager = new PopupManager();
        this.popupManager.onOpen('character-ranks-panel', () => {
            this.rankPanelViewModel.renderCharacterRanks('character-ranks-content');
        });

        // --- 모든 초기화 메서드 호출 ---
        this.initMainMenu();
        this.initDraggableScrolling(); 
        this.bindCustomEvents();
    }
    
    initMainMenu() {
        const navButtons = document.querySelectorAll('.main-nav .nav-button');
        const toolSections = document.querySelectorAll('.tool-section');
        
        const activateTool = (button) => {
            navButtons.forEach(btn => {
                if (btn.dataset.action === 'toggle-tool') {
                    btn.classList.remove('active');
                }
            });
            toolSections.forEach(sec => sec.classList.remove('active'));
            
            button.classList.add('active');
            const targetSection = document.getElementById(button.dataset.target);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        };

        navButtons.forEach(button => {
            if (button.dataset.action === 'toggle-tool') {
                button.addEventListener('click', () => activateTool(button));
            }
        });
        
        const initialActiveButton = document.querySelector('.main-nav .nav-button[data-action="toggle-tool"].active');
        if (initialActiveButton) {
            activateTool(initialActiveButton);
        }
    }

    initDraggableScrolling() {
        const draggableElements = document.querySelectorAll('.draggable-on-mobile');
        draggableElements.forEach(el => new DraggableScroller(el));
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

    bindCustomEvents() {
        document.body.addEventListener('characterRanksUpdated', () => {
            this.skillComparisonViewModel.handleRanksUpdated();
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});