import { BaseSkillTable } from './BaseSkillTable.js';
import { InputNumberElement } from '../utils/InputNumberElement.js';
import { SkillCalculator } from '../logic/SkillCalculator.js';

export class CharacterSkillTable extends BaseSkillTable {
    constructor(config) {
        super(config);
        this.characterRankManager = config.characterRankManager;

        this.characterSelect = this.container.querySelector('#character-select');
        this.rankInput = this.container.querySelector('#character-rank-input');

        // InputNumberElement의 콜백은 이제 랭크 업데이트만 담당합니다.
        this.rankInputElement = new InputNumberElement(this.rankInput, 1, 100, 1, (newRank) => {
            this.updateManagerRank(newRank);
        });
        
        this.bindSpecificEvents();
    }

    bindSpecificEvents() {
        this.characterSelect.addEventListener('change', () => this.handleCharacterSelectChange());
        // 사용자가 직접 랭크를 입력하고 포커스를 잃었을 때도 테이블을 다시 그리도록 이벤트를 추가합니다.
        this.rankInput.addEventListener('change', () => this.renderTable());
    }

    // 캐릭터 랭크를 업데이트하는 로직을 별도 메서드로 분리
    updateManagerRank(newRank) {
        const selectedCharName = this.characterSelect.value;
        if (selectedCharName !== 'direct') {
            this.characterRankManager.updateCharacterRank(selectedCharName, newRank);
        }
    }

    handleCharacterSelectChange() {
        const selectedOption = this.characterSelect.selectedOptions[0];
        if (!selectedOption) {
            this.renderTable();
            return;
        }
        
        const selectedValue = selectedOption.value;

        if (selectedValue === 'direct') {
            this.rankInput.disabled = false;
        } else {
            const rank = parseInt(selectedOption.dataset.rank);
            // 콜백 없이 값만 설정하고,
            this.rankInputElement.setValue(rank, false);
            // 랭크 매니저의 값도 동기화합니다.
            this.updateManagerRank(rank);
        }
        
        // 마지막에 한 번만 테이블을 다시 그립니다.
        this.renderTable();
    }

    refresh() {
        this.populateCharacterSelect();
        this.handleCharacterSelectChange();
    }

    populateCharacterSelect() {
        const activeCharacters = this.characterRankManager.getActiveCharacters();
        const currentSelectedValue = this.characterSelect.value;
        this.characterSelect.innerHTML = `<option value="direct">직접 입력</option>`;
        
        let stillExists = false;
        activeCharacters.forEach(char => {
            const option = document.createElement('option');
            option.value = char.name;
            option.textContent = char.name;
            option.dataset.rank = char.rank;
            this.characterSelect.appendChild(option);
            if(char.name === currentSelectedValue) {
                stillExists = true;
            }
        });

        if (stillExists) {
            this.characterSelect.value = currentSelectedValue;
        }
    }

    _populateTableBody() {
        const charRank = this.rankInputElement.getValue();
        const yValues = [1, 2, 3, 4]; // Y축: 스킬 레벨
        const xValues = this.manualXValues;
        
        const tbody = this.table.querySelector('tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        yValues.forEach(yValue => {
            const rowHTML = this._renderRow(yValue, xValues, charRank);
            tbody.insertAdjacentHTML('beforeend', rowHTML);
        });

        this._updateCellDisplay(this.displayModeToggle.currentStateName);
    }

    _renderRow(skillLevel, xValues, charRank) {
        let rowHTML = `<tr><th>${skillLevel}</th>`;
        try {
            const calculator = new SkillCalculator(skillLevel);
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
        } catch(e) { /* 스킬레벨 오류 등 */ }
        rowHTML += `</tr>`;
        return rowHTML;
    }
    
    getAxisLabels() {
        return { y: '스킬Lv', x: '대상값' };
    }
}