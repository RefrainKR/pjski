import { TabManager } from '/lib/utils/TabManager.js';
import { InputNumberElement } from '/lib/utils/InputNumberElement.js';
import { storageManager } from '/lib/utils/storageManager.js';

import { ComparisonByRankViewModel } from '/viewModel/skillComparison/tab/ComparisonByRankViewModel.js';
import { ComparisonBySkillLevelViewModel } from '/viewModel/skillComparison/tab/ComparisonBySkillLevelViewModel.js';

import {
    AUTO_INPUT_SETTINGS_KEY, DEFAULT_AUTO_INPUT_SETTINGS,
    MIN_AUTO_INPUT, MAX_AUTO_INPUT, MIN_AUTO_INPUT_INCREMENT, MAX_AUTO_INPUT_INCREMENT,
    MIN_X_VALUES_COUNT, MAX_X_VALUES_COUNT
} from '/data.js';

export class SkillComparisonViewModel {
    constructor(config) {
        this.container = document.getElementById(config.containerId);
        if (!this.container) return;

        this.messageDisplayCallback = config.messageDisplayCallback;
        
        this.comparisonByRankViewModel = new ComparisonByRankViewModel({
            messageDisplayCallback: config.messageDisplayCallback,
            rankPanelViewModel: config.rankPanelViewModel,
            ...config.rankTableConfig
        });
        
        this.comparisonBySkillLevelViewModel = new ComparisonBySkillLevelViewModel({
            messageDisplayCallback: config.messageDisplayCallback,
            rankPanelViewModel: config.rankPanelViewModel,
            ...config.characterTableConfig
        });

        this.tabManager = new TabManager(this.container, (activeTabId) => {
            if (activeTabId === 'skill-level-tab') {
                this.comparisonBySkillLevelViewModel.refresh();
            }
        });

        this._initAutoInputPanel();
        this.tabManager.activateDefaultTab();
    }

    _initAutoInputPanel() {
        const autoInputPanel = document.getElementById('auto-input-panel');
        if (!autoInputPanel) return;
        
        const applyBtn = autoInputPanel.querySelector('#applyAutoInputBtn');
        const startInput = autoInputPanel.querySelector('#auto-input-start');
        const endInput = autoInputPanel.querySelector('#auto-input-end');
        const incrementInput = autoInputPanel.querySelector('#auto-input-increment');

        const initialSettings = storageManager.load(AUTO_INPUT_SETTINGS_KEY, DEFAULT_AUTO_INPUT_SETTINGS);

        this.autoInputStartElement = new InputNumberElement(
            startInput, MIN_AUTO_INPUT, MAX_AUTO_INPUT,
            initialSettings.start, () => this.saveAutoInputSettings()
        );
        this.autoInputEndElement = new InputNumberElement(endInput, MIN_AUTO_INPUT, MAX_AUTO_INPUT,
            initialSettings.end, () => this.saveAutoInputSettings()
        );
        this.autoInputIncrementElement = new InputNumberElement(
            incrementInput, MIN_AUTO_INPUT_INCREMENT, MAX_AUTO_INPUT_INCREMENT,
            initialSettings.increment, () => this.saveAutoInputSettings()
        );

        applyBtn.addEventListener('click', () => {
            const activeTable = this.getActiveTableViewModel();
            if (!activeTable) return;

            let startVal = this.autoInputStartElement.getValue();
            let endVal = this.autoInputEndElement.getValue();
            let incrementVal = this.autoInputIncrementElement.getValue();
            
            if (startVal > endVal) [startVal, endVal] = [endVal, startVal];
            if (incrementVal <= 0) incrementVal = 1;

            let generatedXValues = [];
            for (let i = startVal; i <= endVal; i += incrementVal) { generatedXValues.push(i); }
            
            if (generatedXValues.length < MIN_X_VALUES_COUNT) {
                this.messageDisplayCallback('생성된 대상값이 최소 개수에 미치지 못하여 빈공간을 생성합니다.', 'info');
                while (generatedXValues.length < MIN_X_VALUES_COUNT) { generatedXValues.push(0); }
            } else if (generatedXValues.length > MAX_X_VALUES_COUNT) {
                this.messageDisplayCallback('생성된 대상값이 최대 개수를 초과하였습니다.', 'info');
                generatedXValues = generatedXValues.slice(0, MAX_X_VALUES_COUNT);
            }

            activeTable.updateXValuesAndRender(generatedXValues);
            
            document.body.dispatchEvent(new CustomEvent('closePopupRequest'));
        });
    }

    getActiveTableViewModel() {
        const activeTab = this.container.querySelector('.tab-button.active');
        if (activeTab && activeTab.dataset.tab === 'skill-level-tab') {
            return this.comparisonBySkillLevelViewModel;
        }
        return this.comparisonByRankViewModel;
    }
    
    handleRanksUpdated() {
        const activeTab = this.container.querySelector('.tab-button.active');
        if (activeTab && activeTab.dataset.tab === 'skill-level-tab') {
            this.comparisonBySkillLevelViewModel.refresh();
        }
    }
    
    saveAutoInputSettings() {
        const settings = {
            start: this.autoInputStartElement.getValue(),
            end: this.autoInputEndElement.getValue(),
            increment: this.autoInputIncrementElement.getValue()
        };
        storageManager.save(AUTO_INPUT_SETTINGS_KEY, settings);
    }
}