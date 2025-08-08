
import { InputNumberElement } from '/lib/utils/InputNumberElement.js';
import { ToggleButtonElement } from '/lib/utils/ToggleButtonElement.js';
import { storageManager } from '/lib/utils/StorageManager.js';

import { kebabToCamelCase } from '/lib/utils/StringUtils.js';

import {
    MIN_TARGET_VALUE, MAX_TARGET_VALUE,
    DEFAULT_AUTO_INPUT_START, DEFAULT_AUTO_INPUT_END, DEFAULT_AUTO_INPUT_INCREMENT,
    SKILL_CALCULATOR_SETTINGS_KEY
} from '/data.js';

/**
 * 스킬 테이블들의 공통 기능을 제공하는 추상 상위 클래스.
 */
export class BaseComparisonTabViewModel {
    constructor(config) {
        this.container = document.getElementById(config.containerId);
        this.messageDisplayCallback = config.messageDisplayCallback;
        
        this.table = this.container.querySelector('.skill-table');
        this.skillTableContainer = this.container.querySelector('.skill-table-container');
        this.displayModeLabel = this.container.querySelector('.display-mode-label');

        this.displayMode = 'highest';
        this.numberFormat = 'integer'; // 'integer' or 'decimal'

        this.displayModeToggle = new ToggleButtonElement(
            config.displayModeBtnId,
            [
                { name: 'highest', text: '높은 값', label: '값: 각전, 각후 중 높은 값' },
                { name: 'difference', text: '차이 값', label: '표시된 값: 각전 - 각후 값' }
            ],
            (modeName, state) => {
                this.displayMode = modeName;
                this.displayModeLabel.textContent = state.label;
                this._updateCellDisplay();
            }
        );

        this.numberFormatToggle = new ToggleButtonElement(
            config.numberFormatBtnId,
            [ { name: 'integer', text: '정수' }, { name: 'decimal', text: '소수점' } ],
            (modeName) => {
                this.numberFormat = modeName;
                this._updateCellDisplay();
            }
        );

        this.loadTargetXValues();
    }

    _populateTableBody() {
        throw new Error("Subclasses must implement _populateTableBody()");
    }

    _renderRow(calculator, yValue, xValues, optionalRank = null) {
        throw new Error("Subclasses must implement _renderRow()");
    }

    getAxisLabels() {
        throw new Error("Subclasses must implement getAxisLabels()");
    }

    bindTargetInputEvents() {
        const manualInputs = this.table.querySelectorAll('thead th .target-value-input');
        manualInputs.forEach((input, index) => {
            if (!input._inputNumberElementInstance) {
                const instance = new InputNumberElement(input, MIN_TARGET_VALUE, MAX_TARGET_VALUE, null, (value) => {
                    this.manualXValues[index] = value;
                    this._populateTableBody();
                    this.saveTargetXValues();
                }, null);
                input._inputNumberElementInstance = instance;
            }
        });
    }
    
    /**
     * App.js로부터 자동 생성된 x축 값 배열을 받아 테이블을 다시 그립니다.
     * @param {Array<number>} newXValues - 새로운 x축 값 배열.
     */
    updateXValuesAndRender(newXValues) {
        this.manualXValues = newXValues;
        this.saveTargetXValues();
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
        this.bindTargetInputEvents();
    }

    _updateCellDisplay() {
        if (!this.table || !this.table.querySelector('tbody')) return;
        const cells = this.table.querySelectorAll('tbody td:not(.empty-cell)');
        
        cells.forEach(cell => {
            const format = this.numberFormat.substring(0, 3);
            const type = this.displayMode;
            const multi = this.useMultiplier ? '-multi' : '';
            
            const keyName = `${format}-${type}${multi}`;
            
            cell.textContent = cell.dataset[kebabToCamelCase(keyName)];
        });
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

    loadTargetXValues() {
        const storedSettings = storageManager.load(SKILL_CALCULATOR_SETTINGS_KEY, {});
        this.manualXValues = storedSettings.manualXValues || [];
        if (this.manualXValues.length === 0) {
            for (let i = DEFAULT_AUTO_INPUT_START; i <= DEFAULT_AUTO_INPUT_END; i += DEFAULT_AUTO_INPUT_INCREMENT) {
                this.manualXValues.push(i);
            }
        }
    }
    
    saveTargetXValues() {
        const storedSettings = storageManager.load(SKILL_CALCULATOR_SETTINGS_KEY, {});
        storedSettings.manualXValues = this.manualXValues;
        storageManager.save(SKILL_CALCULATOR_SETTINGS_KEY, storedSettings);
    }
}