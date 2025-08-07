import { DraggableScroller } from '/lib/utils/DraggableScroller.js';
import { PopupManager } from '/lib/utils/PopupManager.js';
import { InputNumberElement } from '/lib/utils/InputNumberElement.js';
import { storageManager } from '/lib/utils/StorageManager.js';

import { BackupViewModel } from '/viewModel/backup/BackupViewModel.js';

import { SkillComparisonViewModel } from '/viewModel/skillComparison/SkillComparisonViewModel.js';

import { RankPanelViewModel } from '/viewModel/rankPanel/RankPanelViewModel.js';

import { EventPointCalculatorViewModel } from '/viewModel/eventPoint/EventPointCalculatorViewModel.js';

import { 
    MESSAGE_DISPLAY_DURATION, 
    SKILL_CALCULATOR_SETTINGS_KEY, 
    MIN_AUTO_INPUT, MAX_AUTO_INPUT, MIN_AUTO_INPUT_INCREMENT, MAX_AUTO_INPUT_INCREMENT,
    DEFAULT_AUTO_INPUT_START, DEFAULT_AUTO_INPUT_END, DEFAULT_AUTO_INPUT_INCREMENT, 
    MIN_X_VALUES_COUNT, MAX_X_VALUES_COUNT 
} from '/data.js';

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
                displayModeBtnId: 'btn-display-mode',
                numberFormatBtnId: 'btn-number-format',
                multiplierBtnId: 'btn-multiplier'
            },
            
            // ComparisonBySkillLevelViewModel이 사용할 정보
            characterTableConfig: {
                containerId: 'skill-level-tab',
                displayModeBtnId: 'btn-display-mode-char',
                numberFormatBtnId: 'btn-number-format-char',
                multiplierBtnId: 'btn-multiplier-char'
            }
        });

        this.eventPointCalculatorViewModel = new EventPointCalculatorViewModel({
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
        this.initAutoInputPanel();
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

    initAutoInputPanel() {
        const autoInputPanel = document.getElementById('auto-input-panel');
        const applyBtn = autoInputPanel.querySelector('#applyAutoInputBtn');
        const startInput = autoInputPanel.querySelector('#auto-input-start');
        const endInput = autoInputPanel.querySelector('#auto-input-end');
        const incrementInput = autoInputPanel.querySelector('#auto-input-increment');

        // 팝업 내부의 InputNumberElement들은 App.js가 직접 관리합니다.
        const startElement = new InputNumberElement(startInput, MIN_AUTO_INPUT, MAX_AUTO_INPUT, DEFAULT_AUTO_INPUT_START, null);
        const endElement = new InputNumberElement(endInput, MIN_AUTO_INPUT, MAX_AUTO_INPUT, DEFAULT_AUTO_INPUT_END, null);
        const incrementElement = new InputNumberElement(incrementInput, MIN_AUTO_INPUT_INCREMENT, MAX_AUTO_INPUT_INCREMENT, DEFAULT_AUTO_INPUT_INCREMENT, null);

        let activeTableViewModel = null; // 어떤 테이블 뷰모델에 적용할지 저장하는 변수

        this.popupManager.onOpen('auto-input-panel', (trigger) => {
            // 팝업을 연 버튼이 어떤 메인 툴 섹션에 속해 있는지 확인
            const parentToolSection = trigger.closest('.tool-section');
            
            // "스킬 비교기" 툴에서 열었을 경우
            if (parentToolSection && parentToolSection.id === 'tool-skill-comparison') {
                // SkillComparisonViewModel에게 현재 활성화된 하위 테이블 뷰모델이 누구인지 물어봄
                activeTableViewModel = this.skillComparisonViewModel.getActiveTableViewModel();
            } 
            // 나중에 다른 툴(예: 이벤트 점수기)에 자동 입력 기능이 추가되면,
            // else if (parentToolSection.id === 'tool-event-point-calculator') {
            //     activeTableViewModel = this.eventPointCalculatorViewModel; // (예시)
            // }
            else {
                activeTableViewModel = null;
            }

            // 활성화된 테이블이 있을 경우에만 팝업 필드 초기화
            if (activeTableViewModel) {
                const settings = storageManager.load(SKILL_CALCULATOR_SETTINGS_KEY, {});
                startElement.setValue(settings.autoInputStart || DEFAULT_AUTO_INPUT_START, false);
                endElement.setValue(settings.autoInputEnd || DEFAULT_AUTO_INPUT_END, false);
                incrementElement.setValue(settings.autoInputIncrement || DEFAULT_AUTO_INPUT_INCREMENT, false);
            }
        });

        applyBtn.addEventListener('click', () => {
            // "적용" 버튼 클릭 시, 팝업이 열릴 때 저장해 둔 activeTableViewModel을 사용
            if (!activeTableViewModel) return;

            let startVal = startElement.getValue();
            let endVal = endElement.getValue();
            let incrementVal = incrementElement.getValue();
            
            if (startVal > endVal) [startVal, endVal] = [endVal, startVal];
            if (incrementVal <= 0) incrementVal = 1;

            let generatedXValues = [];
            for (let i = startVal; i <= endVal; i += incrementVal) { generatedXValues.push(i); }
            
            if (generatedXValues.length < MIN_X_VALUES_COUNT) {
                this.messageDisplay('생성된 대상값이 최소 개수에 미치지 못하여 빈공간을 생성합니다.', 'info');
                while (generatedXValues.length < MIN_X_VALUES_COUNT) {
                    generatedXValues.push(0);
                }
            } else if (generatedXValues.length > MAX_X_VALUES_COUNT) {
                this.messageDisplay('생성된 대상값이 최대 개수를 초과하였습니다.', 'info');
                generatedXValues = generatedXValues.slice(0, MAX_X_VALUES_COUNT);
            }

            // 저장된 activeTableViewModel에 결과 전달
            activeTableViewModel.updateXValuesAndRender(generatedXValues);
            this.popupManager.close(autoInputPanel);
        });
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