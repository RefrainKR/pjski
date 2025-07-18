// js/components/SkillCalculator.js

import { 
    SKILL_DATA, 
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

export class SkillCalculator {
    constructor(containerId, messageDisplayCallback) {
        this.container = document.getElementById(containerId);
        this.skillLevelSelect = this.container.querySelector('#skill-level-select');
        this.skillTable = this.container.querySelector('#skill-comparison-table');
        this.messageDisplayCallback = messageDisplayCallback;

        this.rankMinInput = this.container.querySelector('#rank-min');
        this.rankMaxInput = this.container.querySelector('#rank-max');
        this.rankIncrementInput = this.container.querySelector('#rank-increment');

        // 자동 입력 모달을 위한 새로운 요소들 (이름 변경 반영)
        this.autoInputTriggerBtn = this.container.querySelector('#autoInputTriggerBtn'); 
        this.autoInputSection = document.getElementById('auto-input-section'); 
        this.autoInputCloseBtn = this.autoInputSection.querySelector('.close-btn'); 
        this.autoInputStartInput = this.autoInputSection.querySelector('#auto-input-start'); 
        this.autoInputEndInput = this.autoInputSection.querySelector('#auto-input-end'); 
        this.autoInputIncrementInput = this.autoInputSection.querySelector('#auto-input-increment'); 
        this.applyAutoInputBtn = this.autoInputSection.querySelector('#applyAutoInputBtn'); 
        
        // LocalStorage에서 설정 로드
        this.loadSettingsFromLocalStorage(); 
        
        // InputNumberElement 인스턴스 생성 (초기값 설정은 setValue로 나중에 트리거)
        // rank-min, rank-max, rank-increment는 blank일 경우 이전 값으로 되돌립니다. (fallbackValueOnBlank: null)
        this.rankMinElement = new InputNumberElement(this.rankMinInput, MIN_RANK_MIN, MAX_RANK_MIN, DEFAULT_RANK_MIN, this.handleRankMinChange.bind(this), FALLBACK_RANK_INPUT_ON_BLANK);
        this.rankMaxElement = new InputNumberElement(this.rankMaxInput, MIN_RANK_MAX, MAX_RANK_MAX, DEFAULT_RANK_MAX, this.handleRankMaxChange.bind(this), FALLBACK_RANK_INPUT_ON_BLANK);
        this.rankIncrementElement = new InputNumberElement(this.rankIncrementInput, MIN_RANK_INCREMENT, MAX_RANK_INCREMENT, DEFAULT_RANK_INCREMENT, this.handleRankIncrementChange.bind(this), FALLBACK_RANK_INPUT_ON_BLANK);

        // 자동 입력 모달 입력 필드용 InputNumberElement 인스턴스 (이름 변경 반영)
        // 이 필드들은 모달이 열릴 때마다 값이 로드되므로, 초기값은 data.js의 DEFAULT 값을 사용
        // blank일 경우 data.js에 정의된 특정 값으로 되돌립니다. (이제는 null)
        this.autoInputStartElement = new InputNumberElement(this.autoInputStartInput, MIN_TARGET_VALUE, MAX_TARGET_VALUE, DEFAULT_AUTO_INPUT_START, this.handleAutoInputInputChange.bind(this), FALLBACK_AUTO_INPUT_START_ON_BLANK);
        this.autoInputEndElement = new InputNumberElement(this.autoInputEndInput, MIN_TARGET_VALUE, MAX_TARGET_VALUE, DEFAULT_AUTO_INPUT_END, this.handleAutoInputInputChange.bind(this), FALLBACK_AUTO_INPUT_END_ON_BLANK);
        this.autoInputIncrementElement = new InputNumberElement(this.autoInputIncrementInput, MIN_RANK_INCREMENT, MAX_RANK_INCREMENT, DEFAULT_AUTO_INPUT_INCREMENT, this.handleAutoInputInputChange.bind(this), FALLBACK_AUTO_INPUT_INCREMENT_ON_BLANK);

        this.bindEvents();

        // 모든 InputNumberElement 인스턴스가 생성된 후, 초기값을 설정하고 콜백을 트리거합니다.
        // 이렇게 하면 handleRankMinChange 등에서 다른 요소에 접근할 때 undefined 오류가 발생하지 않습니다.
        // setValue의 두 번째 인자를 true로 설정하여 changeCallback을 트리거합니다.
        this.rankMinElement.setValue(this.rankMinInput.value, true);
        this.rankMaxElement.setValue(this.rankMaxInput.value, true);
        this.rankIncrementElement.setValue(this.rankIncrementInput.value, true);
        // autoInput input들은 모달 열 때 setValue가 호출되므로 여기서 별도로 호출하지 않습니다.

        // 초기 테이블 렌더링
        this._renderTableStructure(); // 테이블 구조를 한 번만 그림
        this._updateTableCells(); // 초기 셀 내용 업데이트
    }

    bindEvents() {
        this.skillLevelSelect.addEventListener('change', () => {
            this.saveSettingsToLocalStorage();
            this._updateTableCells(); // 셀 내용만 업데이트
        });
        
        // 자동 입력 트리거 버튼 이벤트 (이름 변경)
        this.autoInputTriggerBtn.addEventListener('click', () => {
            this.openAutoInputModal();
        });

        // 자동 입력 모달 내 '계산' 버튼 이벤트 (이름 변경)
        this.applyAutoInputBtn.addEventListener('click', () => {
            this.applyAutoInputValues();
        });

        // 자동 입력 모달 닫기 버튼 이벤트 (이름 변경)
        this.autoInputCloseBtn.addEventListener('click', () => {
            this.closeAutoInputModal();
        });
    }

    // rankMinInput의 change 콜백 (InputNumberElement로부터 유효성 검사된 값 받음)
    handleRankMinChange(validatedMinVal) {
        let minVal = validatedMinVal;
        // rankMaxInput의 현재 유효성 검사된 값을 가져옴 (InputNumberElement의 getValue 사용)
        let maxVal = this.rankMaxElement.getValue();

        if (minVal !== null && maxVal !== null && minVal > maxVal) { 
            this.messageDisplayCallback('랭크 최소값이 최대값보다 높아 값이 자동으로 교환되었습니다.', 'info');
            // 값 스왑 후 InputNumberElement를 통해 다시 설정
            // setValue의 두 번째 인자를 false로 설정하여 중복 콜백 트리거를 방지합니다.
            this.rankMinElement.setValue(maxVal, false); // min에 max 값을 설정
            this.rankMaxElement.setValue(minVal, false); // max에 min 값을 설정
            // 스왑이 발생했으므로, 다시 테이블을 렌더링합니다.
            this.saveSettingsToLocalStorage(); // 변경 후 저장
            this._updateTableCells(); // 셀 내용만 업데이트
            return; // 중복 렌더링 방지
        }
        this.saveSettingsToLocalStorage(); // 변경 후 저장
        this._updateTableCells(); // 셀 내용만 업데이트
    }

    // rankMaxInput의 change 콜백 (InputNumberElement로부터 유효성 검사된 값 받음)
    handleRankMaxChange(validatedMaxVal) {
        let maxVal = validatedMaxVal;
        // rankMinInput의 현재 유효성 검사된 값을 가져옴
        let minVal = this.rankMinElement.getValue();

        if (minVal !== null && maxVal !== null && minVal > maxVal) { 
            this.messageDisplayCallback('랭크 최소값이 최대값보다 높아 값이 자동으로 교환되었습니다.', 'info');
            // Set the second argument of setValue to false to prevent duplicate callback triggers.
            this.rankMinElement.setValue(maxVal, false);
            this.rankMaxElement.setValue(minVal, false);
            // Since a swap occurred, re-render the table.
            this.saveSettingsToLocalStorage(); // Save after change
            this._updateTableCells(); // Update cell content only
            return;
        }
        this.saveSettingsToLocalStorage(); // Save after change
        this._updateTableCells(); // Update cell content only
    }

    // rankIncrementInput의 change 콜백 (InputNumberElement로부터 유효성 검사된 값 받음)
    handleRankIncrementChange(validatedIncrementVal) {
        // Validated value is already passed from InputNumberElement
        this.saveSettingsToLocalStorage(); // Save after change
        this._updateTableCells(); // Update cell content only
    }

    // 자동 입력 모달 내 입력 필드 변경 시 호출될 콜백 (이름 변경)
    handleAutoInputInputChange(value, inputElement) {
        // This callback currently only saves to LocalStorage
        // Actual calculation happens when the 'Calculate' button is clicked
        this.saveSettingsToLocalStorage();
    }

    // 자동 입력 모달 열기 (이름 변경)
    openAutoInputModal() {
        this.autoInputSection.classList.add('active');
        // 모달을 열 때 현재 저장된 자동 입력 설정 값을 입력 필드에 반영
        const settings = JSON.parse(localStorage.getItem(SKILL_CALCULATOR_SETTINGS_KEY) || '{}');
        
        // InputNumberElement의 setValue를 사용하여 초기화 (changeCallback 트리거 안함)
        // null 또는 undefined일 경우 defaultValue를 사용하도록 설정
        this.autoInputStartElement.setValue(settings.autoInputStart, false); 
        this.autoInputEndElement.setValue(settings.autoInputEnd, false);     
        this.autoInputIncrementElement.setValue(settings.autoInputIncrement, false); 
    }

    // 자동 입력 모달 닫기 (이름 변경)
    closeAutoInputModal() {
        this.autoInputSection.classList.remove('active');
    }

    // 자동 입력 값 적용 (이름 변경)
    applyAutoInputValues() {
        // Get validated values using InputNumberElement's getValue
        let startVal = this.autoInputStartElement.getValue(); 
        let endVal = this.autoInputEndElement.getValue();     
        let incrementVal = this.autoInputIncrementElement.getValue(); 

        // Handle null values (following InputNumberElement's defaultValue)
        startVal = startVal === null ? DEFAULT_AUTO_INPUT_START : startVal; 
        endVal = endVal === null ? DEFAULT_AUTO_INPUT_END : endVal;         
        incrementVal = incrementVal === null ? DEFAULT_AUTO_INPUT_INCREMENT : incrementVal; 


        // Validation (start value <= end value, increment value > 0)
        if (startVal > endVal) {
            this.messageDisplayCallback('시작값이 끝나는값보다 클 수 없습니다. 값이 자동으로 조정됩니다.', 'info');
            [startVal, endVal] = [endVal, startVal]; // Swap
            // Update fields after swap via InputNumberElement
            this.autoInputStartElement.setValue(startVal, false); // Prevent callback trigger from setValue 
            this.autoInputEndElement.setValue(endVal, false);     // Prevent callback trigger from setValue 
        }
        if (incrementVal <= 0) {
            this.messageDisplayCallback('증가값은 1 이상이어야 합니다. 1로 조정됩니다.', 'info');
            incrementVal = 1;
            this.autoInputIncrementElement.setValue(incrementVal, false); // Prevent callback trigger from setValue 
        }

        // Populate manualXValues
        let generatedXValues = [];
        for (let i = startVal; i <= endVal; i += incrementVal) {
            generatedXValues.push(i);
        }

        // X축 값 개수 제한 로직 적용
        if (generatedXValues.length < MIN_X_VALUES_COUNT) {
            // 최소 개수에 미치지 못하면 0으로 채워서 빈 칸으로 만듦
            this.messageDisplayCallback(`생성된 대상값이 최소 ${MIN_X_VALUES_COUNT}개에 미치지 못하여 0으로 채워집니다.`, 'info');
            while (generatedXValues.length < MIN_X_VALUES_COUNT) {
                generatedXValues.push(0); // 0으로 채워 계산값이 나오지 않게 함
            }
        } else if (generatedXValues.length > MAX_X_VALUES_COUNT) {
            // 최대 개수를 초과하면 잘라냄
            this.messageDisplayCallback(`생성된 대상값이 최대 ${MAX_X_VALUES_COUNT}개를 초과하여 잘라냅니다.`, 'info');
            generatedXValues = generatedXValues.slice(0, MAX_X_VALUES_COUNT);
        }

        this.manualXValues = generatedXValues;

        this.currentMode = 'manual'; // Always consider it manual mode after auto-calculation
        this.saveSettingsToLocalStorage(); // Save changed manualXValues
        this._renderTableStructure(); // Re-draw structure as X-axis header might change
        this._updateTableCells(); // Update cell content
        this.closeAutoInputModal(); // Close modal 
    }

    /**
     * Renders the basic structure of the table (<thead>, <tbody>, X-axis header input fields) once.
     * This method is called on initial load or when the X-axis header configuration changes (e.g., after applying auto-calculation).
     */
    _renderTableStructure() {
        let xValues = this.manualXValues; // X-axis values always use manualXValues

        let tableHTML = '<thead><tr>';
        tableHTML += `<th class="corner-header">
                                <div class="diagonal-box">
                                    <span class="diag-rank">랭크</span>
                                    <span class="diag-target">대상값</span>
                                </div>
                            </th>`;

        // X-axis header always consists of input fields
        xValues.forEach((val, index) => {
            const valToUse = val === null || isNaN(val) ? '' : val; 
            tableHTML += `<th>
                            <div class="manual-input-wrapper">
                                <!-- 클래스 이름을 'target-value-input'으로 변경 -->
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

    /**
     * Updates only the cell content of the table.
     * This method is called when data changes (e.g., skill level, rank range, target value changes).
     */
    _updateTableCells() {
        const skillLevel = parseInt(this.skillLevelSelect.value);
        const selectedCardType = 'bloomFes'; 

        if (!SKILL_DATA[selectedCardType]) {
            this.messageDisplayCallback('스킬 데이터가 존재하지 않습니다.', 'error');
            return;
        }

        if (isNaN(skillLevel) || skillLevel < 1 || skillLevel > 4) {
            this.messageDisplayCallback('스킬 레벨은 1에서 4 사이여야 합니다.', 'error');
            return;
        }

        const currentSkillData = SKILL_DATA[selectedCardType];

        const afterBase = currentSkillData.after.base[skillLevel];
        const afterMax = currentSkillData.after.max[skillLevel];
        const beforeBase = currentSkillData.before.base[skillLevel];
        const beforeMax = currentSkillData.before.max[skillLevel];

        // Get current values from fields managed by InputNumberElement for calculation
        const rankMinForCalculation = this.rankMinElement.getValue();
        const rankMaxForCalculation = this.rankMaxElement.getValue();
        const rankIncrementForCalculation = this.rankIncrementElement.getValue();

        // Correction in case min > max during calculation
        let finalRankMin = rankMinForCalculation;
        let finalRankMax = rankMaxForCalculation;
        if (finalRankMin > finalRankMax) {
             const temp = finalRankMin;
             finalRankMin = finalRankMax;
             finalRankMax = temp;
        }


        const yValues = [];
        for (let i = finalRankMin; i <= finalRankMax; i += rankIncrementForCalculation) {
            yValues.push(i);
        }

        let xValues = this.manualXValues; 

        const tbody = this.skillTable.querySelector('tbody');
        tbody.innerHTML = ''; // Clear existing tbody content

        yValues.forEach(charRank => {
            let rowHTML = `<tr><th>${charRank}</th>`;
            xValues.forEach(otherSkillTargetValue => {
                const parsedTargetValue = parseInt(otherSkillTargetValue);

                // manual-x-input 값이 0이거나 유효하지 않은 경우 빈 셀로 처리
                if (isNaN(parsedTargetValue) || parsedTargetValue === 0) { 
                    rowHTML += `<td class="empty-cell"></td>`;
                    return;
                }

                let finalAfterSkill = Math.floor(afterBase + Math.floor(charRank / 2)); 
                finalAfterSkill = Math.min(finalAfterSkill, afterMax);

                let finalBeforeSkill = Math.floor(beforeBase + (parsedTargetValue / 2));
                finalBeforeSkill = Math.min(finalBeforeSkill, beforeMax);
                
                let cellClass = '';
                let displayedValue = '';

                if (finalAfterSkill > finalBeforeSkill) {
                    cellClass = 'skill-cell-blue';
                    displayedValue = finalAfterSkill;
                } else if (finalBeforeSkill > finalAfterSkill) {
                    cellClass = 'skill-cell-yellow';
                    displayedValue = finalBeforeSkill;
                } else {
                    cellClass = 'skill-cell-gray';
                    displayedValue = finalAfterSkill;
                }
                
                const finalDisplayedValue = displayedValue;

                rowHTML += `<td class="${cellClass}">${finalDisplayedValue}%</td>`;
            });
            rowHTML += `</tr>`;
            tbody.insertAdjacentHTML('beforeend', rowHTML); // Add row
        });
    }

    bindManualInputEvents() {
        const manualInputs = this.skillTable.querySelectorAll('thead th .target-value-input');
        manualInputs.forEach((input, index) => {
            // Check if InputNumberElement instance is already bound to this input
            // (prevents creating new instances every time renderTableStructure is called)
            if (!input._inputNumberElementInstance) { // Check using a custom property
                // Create InputNumberElement instance for each manual-x-input
                // If blank, revert to FALLBACK_MANUAL_X_ON_BLANK (0)
                const instance = new InputNumberElement(input, MIN_TARGET_VALUE, MAX_TARGET_VALUE, null, (value) => {
                    this.manualXValues[index] = value; // Save null or valid number
                    this._updateTableCells(); // Update cell content only
                    this.saveSettingsToLocalStorage(); // Save manualXValues after change
                }, FALLBACK_MANUAL_X_ON_BLANK); // Pass fallbackValueOnBlank parameter
                input._inputNumberElementInstance = instance; // Store instance

                // manual-x-input's input event: update manualXValues while user is typing
                // InputNumberElement's focus/blur/keydown events are separate,
                // this updates `manualXValues` array in real-time while the user types,
                // so `_updateTableCells` can refer to the latest input state.
                // `_updateTableCells` is called only on `change` event, so no focus loss here.
                input.addEventListener('input', (e) => {
                    const rawValue = e.target.value;
                    // If rawValue is empty string, save as null, otherwise parse as number
                    this.manualXValues[index] = rawValue === '' ? null : parseInt(rawValue); 
                });
            }
        });
    }

    // Load settings from LocalStorage
    loadSettingsFromLocalStorage() {
        const storedSettings = localStorage.getItem(SKILL_CALCULATOR_SETTINGS_KEY);
        if (storedSettings) {
            try {
                const settings = JSON.parse(storedSettings);
                // Apply values to each input field
                this.skillLevelSelect.value = settings.skillLevel || '1';
                
                // Since InputNumberElement manages values, simply assign to input.value on initial load
                // InputNumberElement will read these values and perform validation during initialization.
                // If settings.rankMin is undefined or null, set to empty string to maintain blank state
                this.rankMinInput.value = settings.rankMin !== undefined && settings.rankMin !== null ? settings.rankMin : '';
                this.rankMaxInput.value = settings.rankMax !== undefined && settings.rankMax !== null ? settings.rankMax : '';
                this.rankIncrementInput.value = settings.rankIncrement !== undefined && settings.rankIncrement !== null ? settings.rankIncrement : '';
                
                // Load auto input modal input field values (이름 변경 반영)
                this.autoInputStartInput.value = settings.autoInputStart !== undefined && settings.autoInputStart !== null ? settings.autoInputStart : DEFAULT_AUTO_INPUT_START;
                this.autoInputEndInput.value = settings.autoInputEnd !== undefined && settings.autoInputEnd !== null ? settings.autoInputEnd : DEFAULT_AUTO_INPUT_END;
                this.autoInputIncrementInput.value = settings.autoInputIncrement !== undefined && settings.autoInputIncrement !== null ? settings.autoInputIncrement : DEFAULT_AUTO_INPUT_INCREMENT;

                // currentMode now indicates the state of manualXValues, not auto/manual toggle
                this.currentMode = 'manual'; // Always manual mode (X-axis is manual input)
                this.manualXValues = settings.manualXValues || []; // Load manualXValues

            } catch (e) {
                console.error("Error parsing skill calculator settings from LocalStorage:", e);
                localStorage.removeItem(SKILL_CALCULATOR_SETTINGS_KEY); // Delete data on error
                // Initialize with default values (already handled in constructor)
            }
        } else {
            // If no data in LocalStorage, use HTML default values
            this.currentMode = 'manual'; // Always manual mode
            this.manualXValues = []; // Initial manualXValues is empty
            // If initial manualXValues is empty, populate with auto input default values
            for (let i = DEFAULT_AUTO_INPUT_START; i <= DEFAULT_AUTO_INPUT_END; i += DEFAULT_AUTO_INPUT_INCREMENT) {
                this.manualXValues.push(i);
            }
        }
    }

    // Save current settings to LocalStorage
    saveSettingsToLocalStorage() {
        const settings = {
            skillLevel: this.skillLevelSelect.value,
            // Get values from input.value directly, as InputNumberElement manages them
            // Allow blank state to be saved as is (null or empty string)
            rankMin: this.rankMinInput.value,
            rankMax: this.rankMaxInput.value,
            rankIncrement: this.rankIncrementInput.value,
            // Save auto input modal input field values (이름 변경 반영)
            autoInputStart: this.autoInputStartInput.value,
            autoInputEnd: this.autoInputEndInput.value,
            autoInputIncrement: this.autoInputIncrementInput.value,
            currentMode: 'manual', // Always save as 'manual'
            manualXValues: this.manualXValues // Save manualXValues
        };
        localStorage.setItem(SKILL_CALCULATOR_SETTINGS_KEY, JSON.stringify(settings));
    }
}
