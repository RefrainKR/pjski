import { 
    SKILL_CALCULATOR_SETTINGS_KEY,
    MIN_RANK_MIN, MAX_RANK_MIN, DEFAULT_RANK_MIN,
    MIN_RANK_MAX, MAX_RANK_MAX, DEFAULT_RANK_MAX,
    MIN_RANK_INCREMENT, MAX_RANK_INCREMENT, DEFAULT_RANK_INCREMENT,
    MIN_TARGET_VALUE, MAX_TARGET_VALUE,
    DEFAULT_AUTO_INPUT_START, DEFAULT_AUTO_INPUT_END, DEFAULT_AUTO_INPUT_INCREMENT, 
    FALLBACK_RANK_INPUT_ON_BLANK,
    FALLBACK_AUTO_INPUT_START_ON_BLANK, FALLBACK_AUTO_INPUT_END_ON_BLANK, FALLBACK_AUTO_INPUT_INCREMENT_ON_BLANK, 
    FALLBACK_MANUAL_X_ON_BLANK,
    MIN_X_VALUES_COUNT, MAX_X_VALUES_COUNT 
} from '../data.js';
import { InputNumberElement } from '../utils/InputNumberElement.js'; 
import { SkillCalculator } from '../logic/SkillCalculator.js';
import { ToggleButtonElement } from '../utils/ToggleButtonElement.js';

/**
 * 스킬 비교 테이블의 UI 렌더링과 사용자 상호작용을 모두 담당하는 클래스입니다.
 */
export class SkillComparisonTable {
    constructor(containerId, messageDisplayCallback) {
        // --- DOM 요소 선택 ---
        this.container = document.getElementById(containerId);
        this.messageDisplayCallback = messageDisplayCallback;
        this.skillLevelSelect = this.container.querySelector('#skill-level-select');
        this.skillTable = this.container.querySelector('#skill-comparison-table');
        this.skillTableContainer = this.container.querySelector('.skill-table-container');
        this.rankMinInput = this.container.querySelector('#rank-min');
        this.rankMaxInput = this.container.querySelector('#rank-max');
        this.rankIncrementInput = this.container.querySelector('#rank-increment');
        
        // 자동 입력 패널과 그 내부의 요소들 선택
        this.autoInputPanel = document.getElementById('auto-input-panel');
        this.applyAutoInputBtn = this.autoInputPanel.querySelector('#applyAutoInputBtn');
        this.autoInputStartInput = this.autoInputPanel.querySelector('#auto-input-start');
        this.autoInputEndInput = this.autoInputPanel.querySelector('#auto-input-end');
        this.autoInputIncrementInput = this.autoInputPanel.querySelector('#auto-input-increment');
        
        // 표시 모드 설명 레이블 선택
        this.displayModeLabel = document.getElementById('display-mode-label');

        // --- 컴포넌트 인스턴스 생성 ---
        const displayModes = [
            { name: 'highest', text: '높은 값', label: '표시된 값: 각전 / 각후 중 높은 값' },
            { name: 'difference', text: '차이 값', label: '표시된 값: 각전 / 각후 스킬 값의 차이' }
        ];

        this.displayModeToggle = new ToggleButtonElement(
            'btn-display-mode',
            displayModes,
            (modeName, state) => {
                this.displayModeLabel.textContent = state.label;
                this._updateCellDisplay(modeName);
            }
        );
        
        this.loadSettingsFromLocalStorage(); 
        
        // InputNumberElement 인스턴스 생성
        this.rankMinElement = new InputNumberElement(this.rankMinInput, MIN_RANK_MIN, MAX_RANK_MIN, DEFAULT_RANK_MIN, this.handleRankChange.bind(this), FALLBACK_RANK_INPUT_ON_BLANK);
        this.rankMaxElement = new InputNumberElement(this.rankMaxInput, MIN_RANK_MAX, MAX_RANK_MAX, DEFAULT_RANK_MAX, this.handleRankChange.bind(this), FALLBACK_RANK_INPUT_ON_BLANK);
        this.rankIncrementElement = new InputNumberElement(this.rankIncrementInput, MIN_RANK_INCREMENT, MAX_RANK_INCREMENT, DEFAULT_RANK_INCREMENT, this.handleRankChange.bind(this), FALLBACK_RANK_INPUT_ON_BLANK);

        this.autoInputStartElement = new InputNumberElement(this.autoInputStartInput, MIN_TARGET_VALUE, MAX_TARGET_VALUE, DEFAULT_AUTO_INPUT_START, this.handleAutoInputInputChange.bind(this), FALLBACK_AUTO_INPUT_START_ON_BLANK);
        this.autoInputEndElement = new InputNumberElement(this.autoInputEndInput, MIN_TARGET_VALUE, MAX_TARGET_VALUE, DEFAULT_AUTO_INPUT_END, this.handleAutoInputInputChange.bind(this), FALLBACK_AUTO_INPUT_END_ON_BLANK);
        this.autoInputIncrementElement = new InputNumberElement(this.autoInputIncrementInput, MIN_RANK_INCREMENT, MAX_RANK_INCREMENT, DEFAULT_AUTO_INPUT_INCREMENT, this.handleAutoInputInputChange.bind(this), FALLBACK_AUTO_INPUT_INCREMENT_ON_BLANK);

        this.bindEvents();

        // --- 초기화 및 렌더링 ---
        this.rankMinElement.setValue(this.rankMinInput.value, true);
        this.rankMaxElement.setValue(this.rankMaxInput.value, true);
        this.rankIncrementElement.setValue(this.rankIncrementInput.value, true);

        this._renderTableStructure();
        this._calculateAndRenderAllCells();
        this._initColumnVisibilityObserver();
    }

    bindEvents() {
        // 스킬 레벨 변경 시 테이블 재계산
        this.skillLevelSelect.addEventListener('change', () => {
            this.saveSettingsToLocalStorage();
            this._calculateAndRenderAllCells();
        });

        // 자동 입력 패널의 '적용' 버튼 클릭 시 값 적용
        this.applyAutoInputBtn.addEventListener('click', () => this.applyAutoInputValues());
    }

    handleRankChange() {
        let minVal = this.rankMinElement.getValue();
        let maxVal = this.rankMaxElement.getValue();

        if (minVal > maxVal) { 
            this.messageDisplayCallback('랭크 최소값이 최대값보다 높아 값이 자동으로 교환되었습니다.', 'info');
            this.rankMinElement.setValue(maxVal, false);
            this.rankMaxElement.setValue(minVal, false);
        }
        this.saveSettingsToLocalStorage();
        this._calculateAndRenderAllCells();
    }

    handleAutoInputInputChange() {
        this.saveSettingsToLocalStorage();
    }

    applyAutoInputValues() {
        let startVal = this.autoInputStartElement.getValue(); 
        let endVal = this.autoInputEndElement.getValue();     
        let incrementVal = this.autoInputIncrementElement.getValue(); 

        startVal = startVal === null ? DEFAULT_AUTO_INPUT_START : startVal; 
        endVal = endVal === null ? DEFAULT_AUTO_INPUT_END : endVal;         
        incrementVal = incrementVal === null ? DEFAULT_AUTO_INPUT_INCREMENT : incrementVal; 

        if (startVal > endVal) {
            this.messageDisplayCallback('시작값이 끝나는값보다 클 수 없습니다. 값이 자동으로 조정됩니다.', 'info');
            [startVal, endVal] = [endVal, startVal];
            this.autoInputStartElement.setValue(startVal, false);
            this.autoInputEndElement.setValue(endVal, false);
        }
        if (incrementVal <= 0) {
            this.messageDisplayCallback('증가값은 1 이상이어야 합니다. 1로 조정됩니다.', 'info');
            incrementVal = 1;
            this.autoInputIncrementElement.setValue(incrementVal, false);
        }

        let generatedXValues = [];
        for (let i = startVal; i <= endVal; i += incrementVal) {
            generatedXValues.push(i);
        }

        if (generatedXValues.length < MIN_X_VALUES_COUNT) {
            this.messageDisplayCallback(`생성된 대상값이 최소 ${MIN_X_VALUES_COUNT}개에 미치지 못하여 0으로 채워집니다.`, 'info');
            while (generatedXValues.length < MIN_X_VALUES_COUNT) {
                generatedXValues.push(0);
            }
        } else if (generatedXValues.length > MAX_X_VALUES_COUNT) {
            this.messageDisplayCallback(`생성된 대상값이 최대 ${MAX_X_VALUES_COUNT}개를 초과하여 잘라냅니다.`, 'info');
            generatedXValues = generatedXValues.slice(0, MAX_X_VALUES_COUNT);
        }

        this.manualXValues = generatedXValues;

        this.saveSettingsToLocalStorage();
        this._renderTableStructure();
        this._calculateAndRenderAllCells();
    }
    
    _calculateAndRenderAllCells() {
        try {
            const skillLevel = parseInt(this.skillLevelSelect.value);
            const calculator = new SkillCalculator(skillLevel);
            
            const rankMin = this.rankMinElement.getValue();
            const rankMax = this.rankMaxElement.getValue();
            const rankIncrement = this.rankIncrementElement.getValue();
            
            const yValues = [];
            for (let i = rankMin; i <= rankMax; i += rankIncrement) {
                yValues.push(i);
            }
            const xValues = this.manualXValues;

            const tbody = this.skillTable.querySelector('tbody');
            tbody.innerHTML = '';

            yValues.forEach(charRank => {
                const rowHTML = this._renderRow(calculator, charRank, xValues);
                tbody.insertAdjacentHTML('beforeend', rowHTML);
            });

            this._updateCellDisplay(this.displayModeToggle.currentStateName);
        } catch (error) {
            this.messageDisplayCallback(error.message, 'error');
        }
    }

    _renderRow(calculator, charRank, xValues) {
        let rowHTML = `<tr><th>${charRank}</th>`;

        xValues.forEach(targetValue => {
            const parsedTargetValue = parseInt(targetValue);
            if (isNaN(parsedTargetValue) || parsedTargetValue === 0) {
                rowHTML += `<td class="empty-cell"></td>`;
                return;
            }

            const result = calculator.calculate(charRank, parsedTargetValue);
            const formattedDifference = (result.difference > 0 ? '+' : '') + result.difference + '%';
            
            let cellClass = '';
            if (result.winner === 'after') cellClass = 'skill-cell-blue';
            else if (result.winner === 'before') cellClass = 'skill-cell-yellow';
            else cellClass = 'skill-cell-gray';
            
            rowHTML += `<td class="${cellClass}" 
                            data-highest-value="${result.highest}%"
                            data-difference-value="${formattedDifference}"
                            data-winner="${result.winner}">
                        </td>`;
        });
        rowHTML += `</tr>`;
        return rowHTML;
    }

    _updateCellDisplay(mode) {
        const cells = this.skillTable.querySelectorAll('tbody td:not(.empty-cell)');
        cells.forEach(cell => {
            if (mode === 'highest') {
                cell.textContent = cell.dataset.highestValue;
            } else { // mode === 'difference'
                cell.textContent = cell.dataset.differenceValue;
            }
        });
    }

    _renderTableStructure() {
        let xValues = this.manualXValues;

        let tableHTML = '<thead><tr>';
        tableHTML += `<th class="corner-header">
                        <div class="diagonal-box">
                            <span class="diag-rank">랭크</span>
                            <span class="diag-target">대상값</span>
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
        tableHTML += '</tr></thead><tbody></tbody>';
        
        this.skillTable.innerHTML = tableHTML;
        this.bindManualInputEvents();
    }

    bindManualInputEvents() {
        const manualInputs = this.skillTable.querySelectorAll('thead th .target-value-input');
        manualInputs.forEach((input, index) => {
            if (!input._inputNumberElementInstance) {
                const instance = new InputNumberElement(input, MIN_TARGET_VALUE, MAX_TARGET_VALUE, null, (value) => {
                    this.manualXValues[index] = value;
                    this._calculateAndRenderAllCells();
                    this.saveSettingsToLocalStorage();
                }, FALLBACK_MANUAL_X_ON_BLANK);
                input._inputNumberElementInstance = instance;

                input.addEventListener('input', (e) => {
                    const rawValue = e.target.value;
                    this.manualXValues[index] = rawValue === '' ? null : parseInt(rawValue); 
                });
            }
        });
    }

    loadSettingsFromLocalStorage() {
        const storedSettings = localStorage.getItem(SKILL_CALCULATOR_SETTINGS_KEY);
        if (storedSettings) {
            try {
                const settings = JSON.parse(storedSettings);
                this.skillLevelSelect.value = settings.skillLevel || '1';
                this.rankMinInput.value = settings.rankMin !== undefined && settings.rankMin !== null ? settings.rankMin : '';
                this.rankMaxInput.value = settings.rankMax !== undefined && settings.rankMax !== null ? settings.rankMax : '';
                this.rankIncrementInput.value = settings.rankIncrement !== undefined && settings.rankIncrement !== null ? settings.rankIncrement : '';
                
                this.autoInputStartInput.value = settings.autoInputStart !== undefined && settings.autoInputStart !== null ? settings.autoInputStart : DEFAULT_AUTO_INPUT_START;
                this.autoInputEndInput.value = settings.autoInputEnd !== undefined && settings.autoInputEnd !== null ? settings.autoInputEnd : DEFAULT_AUTO_INPUT_END;
                this.autoInputIncrementInput.value = settings.autoInputIncrement !== undefined && settings.autoInputIncrement !== null ? settings.autoInputIncrement : DEFAULT_AUTO_INPUT_INCREMENT;

                this.manualXValues = settings.manualXValues || [];

            } catch (e) {
                console.error("Error parsing skill calculator settings from LocalStorage:", e);
                localStorage.removeItem(SKILL_CALCULATOR_SETTINGS_KEY);
                this.manualXValues = [];
            }
        } else {
            this.manualXValues = [];
        }
        
        if (this.manualXValues.length === 0) {
            for (let i = DEFAULT_AUTO_INPUT_START; i <= DEFAULT_AUTO_INPUT_END; i += DEFAULT_AUTO_INPUT_INCREMENT) {
                this.manualXValues.push(i);
            }
        }
    }

    saveSettingsToLocalStorage() {
        const settings = {
            skillLevel: this.skillLevelSelect.value,
            rankMin: this.rankMinInput.value,
            rankMax: this.rankMaxInput.value,
            rankIncrement: this.rankIncrementInput.value,
            autoInputStart: this.autoInputStartInput.value,
            autoInputEnd: this.autoInputEndInput.value,
            autoInputIncrement: this.autoInputIncrementInput.value,
            manualXValues: this.manualXValues
        };
        localStorage.setItem(SKILL_CALCULATOR_SETTINGS_KEY, JSON.stringify(settings));
    }

    _initColumnVisibilityObserver() {
        if (!('ResizeObserver' in window)) return;
        const observer = new ResizeObserver(() => this._updateColumnVisibility());
        observer.observe(this.skillTableContainer);
    }

    _updateColumnVisibility() {
        if (!this.skillTable || !this.skillTableContainer) return;
        const xHeaders = this.skillTable.querySelectorAll('thead th:not(:first-child)');
        if (xHeaders.length === 0) return;

        xHeaders.forEach((th, index) => {
            const colIndex = index + 2;
            th.style.display = 'table-cell';
            const cells = this.skillTable.querySelectorAll(`tbody td:nth-child(${colIndex})`);
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
                const cells = this.skillTable.querySelectorAll(`tbody td:nth-child(${colIndex})`);
                cells.forEach(cell => cell.style.display = 'none');
            }
        });
    }
}