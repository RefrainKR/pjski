
import { InputNumberElement } from '/lib/utils/InputNumberElement.js';
import { ToggleButtonElement } from '/lib/utils/ToggleButtonElement.js';
import { storageManager } from '/lib/utils/storageManager.js';

import { stringUtils } from '/lib/utils/stringUtils.js';

import {
    MIN_TARGET_VALUE, MAX_TARGET_VALUE,
    SKILL_COMPARISON_SETTINGS_KEY, DEFAULT_SKILL_COMPARISON_SETTINGS,
    DEFAULT_AUTO_INPUT_SETTINGS
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

        this.tabId = config.tabId;

        this.loadTargetXValues();
    }

    _populateTableBody() {
        throw new Error("Subclasses must implement _populateTableBody()");
    }

    _renderRow(calculator, yValue, xValues, optionalRank = null) {
        const charRank = this.isRankBased() ? yValue : optionalRank;
        let rowHTML = `<tr><th>${yValue}</th>`;

        xValues.forEach(targetValue => {
            const parsedTargetValue = parseInt(targetValue);
            if (isNaN(parsedTargetValue) || parsedTargetValue === 0) {
                rowHTML += `<td class="empty-cell"></td>`;
                return;
            }

            const result = calculator.calculate(charRank, parsedTargetValue, { includeDecimal: true });
            const intData = result.integer;
            const decData = result.decimal;

            const formattedIntDiff = (intData.difference > 0 ? '+' : '') + intData.difference + '%';
            const formattedDecDiff = (decData.difference > 0 ? '+' : '') + decData.difference.toFixed(1) + '%';
            
            rowHTML += `<td class="skill-cell-${intData.winner}" 
                            data-int-highest="${intData.highest}%"
                            data-int-diff="${formattedIntDiff}"
                            data-dec-highest="${decData.highest.toFixed(1)}%"
                            data-dec-diff="${formattedDecDiff}">
                        </td>`;
        });
        rowHTML += `</tr>`;
        return rowHTML;
    }

    isRankBased() {
        return this.container.id === 'rank-skill-tab';
    }

    getAxisLabels() {
        throw new Error("Subclasses must implement getAxisLabels()");
    }

    bindTargetInputEvents() {
        const targetInputs = this.table.querySelectorAll('thead th .target-value-input');
        targetInputs.forEach((input, index) => {
            if (!input._inputNumberElementInstance) {
                const instance = new InputNumberElement(input, MIN_TARGET_VALUE, MAX_TARGET_VALUE, null, (value) => {
                    this.targetXValues[index] = value;
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
        this.targetXValues = newXValues;
        this.saveTargetXValues();
        this.renderTable();
    }

    renderTable() {
        this._renderTableStructure();
        this._populateTableBody();
    }

    _renderTableStructure() {
        const xValues = this.targetXValues;
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
            const type = this.displayMode === 'highest' ? 'highest' : 'diff';
            const multi = this.useMultiplier ? '-multi' : '';
            
            const keyName = `${format}-${type}${multi}`;
            
            cell.textContent = cell.dataset[stringUtils.kebabToCamelCase(keyName)];
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
        const settings = storageManager.load(SKILL_COMPARISON_SETTINGS_KEY, DEFAULT_SKILL_COMPARISON_SETTINGS);
        
        this.targetXValues = settings[this.tabId].targetXValues || [];
        
        if (this.targetXValues.length === 0) {
            for (let i = DEFAULT_AUTO_INPUT_SETTINGS.start; i <= DEFAULT_AUTO_INPUT_SETTINGS.end; i += DEFAULT_AUTO_INPUT_SETTINGS.increment) {
                this.targetXValues.push(i);
            }
        }
    }
    
    saveTargetXValues() {
        const settings = storageManager.load(SKILL_COMPARISON_SETTINGS_KEY, DEFAULT_SKILL_COMPARISON_SETTINGS);
        settings[this.tabId].targetXValues = this.targetXValues;
        storageManager.save(SKILL_COMPARISON_SETTINGS_KEY, settings);
    }
}