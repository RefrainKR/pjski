import { InputNumberElement } from '/lib/utils/InputNumberElement.js';

import { SkillComparisonModel } from '/model/SkillComparisonModel.js';

import { BaseComparisonTabViewModel } from '/viewModel/skillComparison/tab/BaseComparisonTabViewModel.js';

import { MIN_RANK, MAX_RANK, DEFAULT_RANK } from '/data.js';

export class ComparisonBySkillLevelViewModel extends BaseComparisonTabViewModel {
    constructor(config) {
        super(config);
        
        this.rankPanelViewModel = config.rankPanelViewModel;

        this.characterSelect = this.container.querySelector('#character-select');
        this.rankInput = this.container.querySelector('#character-rank-input');

        this.rankInputElement = new InputNumberElement(
            this.rankInput, MIN_RANK, MAX_RANK, DEFAULT_RANK,
            (newRank) => { this.updateManagerRank(newRank); }
        );
        
        this.bindSpecificEvents();
        // this._initColumnVisibilityObserver();
    }

    bindSpecificEvents() {
        this.characterSelect.addEventListener('change', () => this.handleCharacterSelectChange());
        this.rankInput.addEventListener('change', () => this.renderTable());
    }

    updateManagerRank(newRank) {
        const selectedCharName = this.characterSelect.value;

        if (selectedCharName !== 'direct') {
            this.rankPanelViewModel.updateCharacterRank(selectedCharName, newRank);
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
            this.rankInputElement.setValue(rank, false);
        }
        this.renderTable();
    }

    refresh() {
        this.populateCharacterSelect();
        this.handleCharacterSelectChange();
    }

    populateCharacterSelect() {
        const activeCharacters = this.rankPanelViewModel.getActiveCharacters();
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
        
        const tbody = this.table.querySelector('tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        yValues.forEach(yValue => {
            // yValue는 skillLevel이므로, calculator를 매번 새로 생성
            const calculator = new SkillComparisonModel(yValue);
            
            const rowHTML = this._renderRow(calculator, yValue, this.targetXValues, charRank);
            tbody.insertAdjacentHTML('beforeend', rowHTML);
        });

        this._updateCellDisplay();
    }

    getAxisLabels() {
        return { y: '스킬Lv', x: '대상값' };
    }
}