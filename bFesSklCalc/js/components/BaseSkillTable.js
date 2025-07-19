import {
    MIN_TARGET_VALUE, MAX_TARGET_VALUE, FALLBACK_MANUAL_X_ON_BLANK,
    DEFAULT_AUTO_INPUT_START, DEFAULT_AUTO_INPUT_END, DEFAULT_AUTO_INPUT_INCREMENT,
    SKILL_CALCULATOR_SETTINGS_KEY, MIN_X_VALUES_COUNT, MAX_X_VALUES_COUNT,
    FALLBACK_AUTO_INPUT_START_ON_BLANK, FALLBACK_AUTO_INPUT_END_ON_BLANK,
    FALLBACK_AUTO_INPUT_INCREMENT_ON_BLANK
} from '../data.js';
import { InputNumberElement } from '../utils/InputNumberElement.js';
import { ToggleButtonElement } from '../utils/ToggleButtonElement.js';

/**
 * 스킬 테이블들의 공통 기능을 제공하는 추상 상위 클래스.
 */
export class BaseSkillTable {
    constructor(config) {
        this.container = document.getElementById(config.containerId);
        this.messageDisplayCallback = config.messageDisplayCallback;
        
        this.table = this.container.querySelector('.skill-table');
        this.skillTableContainer = this.container.querySelector('.skill-table-container');
        this.displayModeLabel = this.container.querySelector('.display-mode-label');

        // 공용 자동 입력 패널과 그 내부 요소들을 참조
        const autoInputPanel = document.getElementById('auto-input-panel');
        this.applyAutoInputBtn = autoInputPanel.querySelector('#applyAutoInputBtn');
        this.autoInputStartInput = autoInputPanel.querySelector('#auto-input-start');
        this.autoInputEndInput = autoInputPanel.querySelector('#auto-input-end');
        this.autoInputIncrementInput = autoInputPanel.querySelector('#auto-input-increment');
        
        this.displayModeToggle = new ToggleButtonElement(
            config.displayModeBtnId,
            [
                { name: 'highest', text: '높은 값', label: '표시된 값: 각전 / 각후 중 높은 값' },
                { name: 'difference', text: '차이 값', label: '표시된 값: 각전 / 각후 스킬 값의 차이' }
            ],
            (modeName, state) => {
                this.displayModeLabel.textContent = state.label;
                this._updateCellDisplay(modeName);
            }
        );
        
        // InputNumberElement 생성 시 콜백으로 null을 전달해도 에러가 나지 않도록 InputNumberElement 자체를 수정해야 합니다.
        this.autoInputStartElement = new InputNumberElement(this.autoInputStartInput, MIN_TARGET_VALUE, MAX_TARGET_VALUE, DEFAULT_AUTO_INPUT_START, null, FALLBACK_AUTO_INPUT_START_ON_BLANK);
        this.autoInputEndElement = new InputNumberElement(this.autoInputEndInput, MIN_TARGET_VALUE, MAX_TARGET_VALUE, DEFAULT_AUTO_INPUT_END, null, FALLBACK_AUTO_INPUT_END_ON_BLANK);
        this.autoInputIncrementElement = new InputNumberElement(this.autoInputIncrementInput, 1, 50, DEFAULT_AUTO_INPUT_INCREMENT, null, FALLBACK_AUTO_INPUT_INCREMENT_ON_BLANK);

        this.loadManualXValues();
    }
    
    /**
     * App.js가 호출하여 '적용' 버튼에 이 테이블의 applyAutoInputValues 메서드를 연결합니다.
     */
    bindApplyAutoInputEvent() {
        // 기존 핸들러를 제거하고 새로 추가하여 중복 방지
        const newBtn = this.applyAutoInputBtn.cloneNode(true);
        this.applyAutoInputBtn.parentNode.replaceChild(newBtn, this.applyAutoInputBtn);
        this.applyAutoInputBtn = newBtn;
        
        this.applyAutoInputBtn.addEventListener('click', () => {
            this.applyAutoInputValues();
            // 팝업 닫기는 App.js의 PopupManager에서 처리하는 것이 더 적합
        });
    }

    applyAutoInputValues() {
        const settings = JSON.parse(localStorage.getItem(SKILL_CALCULATOR_SETTINGS_KEY) || '{}');
        this.autoInputStartElement.setValue(settings.autoInputStart || DEFAULT_AUTO_INPUT_START, false);
        this.autoInputEndElement.setValue(settings.autoInputEnd || DEFAULT_AUTO_INPUT_END, false);
        this.autoInputIncrementElement.setValue(settings.autoInputIncrement || DEFAULT_AUTO_INPUT_INCREMENT, false);

        let startVal = this.autoInputStartElement.getValue();
        let endVal = this.autoInputEndElement.getValue();
        let incrementVal = this.autoInputIncrementElement.getValue();
        
        if (startVal > endVal) {
            [startVal, endVal] = [endVal, startVal];
            this.autoInputStartElement.setValue(startVal, false);
            this.autoInputEndElement.setValue(endVal, false);
        }
        if (incrementVal <= 0) incrementVal = 1;
        
        let generatedXValues = [];
        for (let i = startVal; i <= endVal; i += incrementVal) { generatedXValues.push(i); }
        
        if (generatedXValues.length < MIN_X_VALUES_COUNT) {
            while (generatedXValues.length < MIN_X_VALUES_COUNT) { generatedXValues.push(0); }
        } else if (generatedXValues.length > MAX_X_VALUES_COUNT) {
            generatedXValues = generatedXValues.slice(0, MAX_X_VALUES_COUNT);
        }

        this.manualXValues = generatedXValues;
        this.saveManualXValues();
        this.renderTable();
    }

    renderTable() {
        this._renderTableStructure();
        this._populateTableBody();
    }

    _renderTableStructure() {
        const xValues = this.manualXValues;
        const axisLabels = this.getAxisLabels();

        let tableHTML = `<thead><tr><th class="corner-header">
                    <div class="diagonal-box">
                        <span class="diag-y">${axisLabels.y}</span>
                        <span class="diag-x">${axisLabels.x}</span>
                    </div>
                </th>`;

        xValues.forEach((val, index) => {
            const valToUse = val === null || isNaN(val) ? '' : val;
            tableHTML += `<th>
                            <div class="target-value-wrapper"> 
                                <input type="number" class="target-value-input" data-col-index="${index}" value="${valToUse}" 
                                    min="${MIN_TARGET_VALUE}" max="${MAX_TARGET_VALUE}">
                                <span class="percent-sign">%</span>
                            </div>
                        </th>`;
        });
        tableHTML += `</tr></thead><tbody></tbody>`;
        this.table.innerHTML = tableHTML;
        this.bindManualInputEvents();
    }

    bindManualInputEvents() {
        const manualInputs = this.table.querySelectorAll('thead th .target-value-input');
        manualInputs.forEach((input, index) => {
            if (!input._inputNumberElementInstance) {
                const instance = new InputNumberElement(input, MIN_TARGET_VALUE, MAX_TARGET_VALUE, null, (value) => {
                    this.manualXValues[index] = value;
                    this._populateTableBody();
                    this.saveManualXValues();
                }, null);
                input._inputNumberElementInstance = instance;
            }
        });
    }

    _updateCellDisplay(mode) {
        const cells = this.table.querySelectorAll('tbody td:not(.empty-cell)');
        cells.forEach(cell => {
            cell.textContent = (mode === 'highest') ? cell.dataset.highestValue : cell.dataset.differenceValue;
        });
    }

    loadManualXValues() {
        const storedSettings = JSON.parse(localStorage.getItem(SKILL_CALCULATOR_SETTINGS_KEY) || '{}');
        this.manualXValues = storedSettings.manualXValues || [];
        if (this.manualXValues.length === 0) {
            for (let i = DEFAULT_AUTO_INPUT_START; i <= DEFAULT_AUTO_INPUT_END; i += DEFAULT_AUTO_INPUT_INCREMENT) {
                this.manualXValues.push(i);
            }
        }
    }
    
    saveManualXValues() {
        const storedSettings = JSON.parse(localStorage.getItem(SKILL_CALCULATOR_SETTINGS_KEY) || '{}');
        storedSettings.manualXValues = this.manualXValues;
        localStorage.setItem(SKILL_CALCULATOR_SETTINGS_KEY, JSON.stringify(storedSettings));
    }
    
    _initColumnVisibilityObserver() {
        if (!('ResizeObserver' in window)) return;
        const observer = new ResizeObserver(() => this._updateColumnVisibility());
        observer.observe(this.skillTableContainer);
    }
    
    _updateColumnVisibility() {
        if (!this.table || !this.skillTableContainer) return;
        const xHeaders = this.table.querySelectorAll('thead th:not(:first-child)');
        if (xHeaders.length === 0) return;

        xHeaders.forEach((th, index) => {
            const colIndex = index + 2;
            th.style.display = 'table-cell';
            const cells = this.table.querySelectorAll(`tbody td:nth-child(${colIndex})`);
            cells.forEach(cell => cell.style.display = 'table-cell');
        });

        const containerRect = this.skillTableContainer.getBoundingClientRect();
        xHeaders.forEach((th, index) => {
            const colIndex = index + 2;
            const columnRect = th.getBoundingClientRect();
            const hiddenWidth = columnRect.right - containerRect.right;
            const threshold = columnRect.width * 0.30;
            if (hiddenWidth > 0 && hiddenWidth > threshold) {
                th.style.display = 'none';
                const cells = this.table.querySelectorAll(`tbody td:nth-child(${colIndex})`);
                cells.forEach(cell => cell.style.display = 'none');
            }
        });
    }

    _populateTableBody() {
        throw new Error("Subclasses must implement _populateTableBody()");
    }

    getAxisLabels() {
        throw new Error("Subclasses must implement getAxisLabels()");
    }
}