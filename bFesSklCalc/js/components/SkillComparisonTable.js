import { SKILL_CALCULATOR_SETTINGS_KEY, MIN_RANK_MIN, MAX_RANK_MIN, DEFAULT_RANK_MIN, MIN_RANK_MAX, MAX_RANK_MAX, DEFAULT_RANK_MAX, MIN_RANK_INCREMENT, MAX_RANK_INCREMENT, DEFAULT_RANK_INCREMENT, FALLBACK_RANK_INPUT_ON_BLANK } from '../data.js';
import { BaseSkillTable } from './BaseSkillTable.js';
import { InputNumberElement } from '../utils/InputNumberElement.js';
import { SkillCalculator } from '../logic/SkillCalculator.js';

export class SkillComparisonTable extends BaseSkillTable {
    constructor(config) {
        super(config);

        this.skillLevelSelect = this.container.querySelector('#skill-level-select');
        this.rankMinInput = this.container.querySelector('#rank-min');
        this.rankMaxInput = this.container.querySelector('#rank-max');
        this.rankIncrementInput = this.container.querySelector('#rank-increment');

        this.rankMinElement = new InputNumberElement(this.rankMinInput, MIN_RANK_MIN, MAX_RANK_MIN, DEFAULT_RANK_MIN, this.handleInputChange.bind(this), FALLBACK_RANK_INPUT_ON_BLANK);
        this.rankMaxElement = new InputNumberElement(this.rankMaxInput, MIN_RANK_MAX, MAX_RANK_MAX, DEFAULT_RANK_MAX, this.handleInputChange.bind(this), FALLBACK_RANK_INPUT_ON_BLANK);
        this.rankIncrementElement = new InputNumberElement(this.rankIncrementInput, MIN_RANK_INCREMENT, MAX_RANK_INCREMENT, DEFAULT_RANK_INCREMENT, this.handleInputChange.bind(this), FALLBACK_RANK_INPUT_ON_BLANK);

        this.loadSettings();
        this.bindSpecificEvents();

        this.rankMinElement.setValue(this.rankMinInput.value, true);
        this.rankMaxElement.setValue(this.rankMaxInput.value, true);
        this.rankIncrementElement.setValue(this.rankIncrementInput.value, true);
        
        this.renderTable();
        this._initColumnVisibilityObserver();
    }

    bindSpecificEvents() {
        this.skillLevelSelect.addEventListener('change', () => this.handleInputChange());
    }

    handleInputChange() {
        let minVal = this.rankMinElement.getValue();
        let maxVal = this.rankMaxElement.getValue();
        if (minVal > maxVal) {
            [minVal, maxVal] = [maxVal, minVal];
            this.rankMinElement.setValue(minVal, false);
            this.rankMaxElement.setValue(maxVal, false);
        }
        this.saveSettings();
        this.renderTable();
    }
    
    _populateTableBody() {
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

            const tbody = this.table.querySelector('tbody');
            if (!tbody) return;
            
            tbody.innerHTML = '';

            yValues.forEach(yValue => {
                const rowHTML = this._renderRow(calculator, yValue, xValues);
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
            
            rowHTML += `<td class="${cellClass}" data-highest-value="${result.highest}%" data-difference-value="${formattedDifference}"></td>`;
        });
        rowHTML += `</tr>`;
        return rowHTML;
    }
    
    getAxisLabels() {
        return { y: '랭크', x: '대상값' };
    }
    
    loadSettings() {
        const storedSettings = JSON.parse(localStorage.getItem(SKILL_CALCULATOR_SETTINGS_KEY) || '{}');
        this.skillLevelSelect.value = storedSettings.skillLevel || '1';
        this.rankMinInput.value = storedSettings.rankMin ?? '';
        this.rankMaxInput.value = storedSettings.rankMax ?? '';
        this.rankIncrementInput.value = storedSettings.rankIncrement ?? '';
    }

    saveSettings() {
        const storedSettings = JSON.parse(localStorage.getItem(SKILL_CALCULATOR_SETTINGS_KEY) || '{}');
        const newSettings = {
            ...storedSettings,
            skillLevel: this.skillLevelSelect.value,
            rankMin: this.rankMinInput.value,
            rankMax: this.rankMaxInput.value,
            rankIncrement: this.rankIncrementInput.value
        };
        localStorage.setItem(SKILL_CALCULATOR_SETTINGS_KEY, JSON.stringify(newSettings));
    }
}