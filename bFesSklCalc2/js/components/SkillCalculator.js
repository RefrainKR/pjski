// js/components/SkillCalculator.js

import { 
    SKILL_DATA, 
    SKILL_CALCULATOR_SETTINGS_KEY,
    MIN_RANK_MIN, MAX_RANK_MIN, DEFAULT_RANK_MIN,
    MIN_RANK_MAX, MAX_RANK_MAX, DEFAULT_RANK_MAX,
    MIN_RANK_INCREMENT, MAX_RANK_INCREMENT, DEFAULT_RANK_INCREMENT,
    MIN_TARGET_VALUE, MAX_TARGET_VALUE,
    DEFAULT_AUTO_CALC_START, DEFAULT_AUTO_CALC_END, DEFAULT_AUTO_CALC_INCREMENT
} from '../data.js';
import { InputNumberElement } from '../utils/InputNumberElement.js'; // InputNumberElement 임포트

export class SkillCalculator {
    constructor(containerId, messageDisplayCallback) {
        this.container = document.getElementById(containerId);
        this.skillLevelSelect = this.container.querySelector('#skill-level-select');
        this.skillTable = this.container.querySelector('#skill-comparison-table');
        this.messageDisplayCallback = messageDisplayCallback;

        this.rankMinInput = this.container.querySelector('#rank-min');
        this.rankMaxInput = this.container.querySelector('#rank-max');
        this.rankIncrementInput = this.container.querySelector('#rank-increment');

        // 자동 계산 모달을 위한 새로운 요소들
        this.autoCalcTriggerBtn = this.container.querySelector('#autoCalcTriggerBtn');
        this.autoCalcSection = document.getElementById('auto-calc-section'); // index.html에 있다고 가정
        this.autoCalcCloseBtn = this.autoCalcSection.querySelector('.close-btn');
        this.autoCalcStartInput = this.autoCalcSection.querySelector('#auto-calc-start');
        this.autoCalcEndInput = this.autoCalcSection.querySelector('#auto-calc-end');
        this.autoCalcIncrementInput = this.autoCalcSection.querySelector('#auto-calc-increment');
        this.applyAutoCalcBtn = this.autoCalcSection.querySelector('#applyAutoCalcBtn');
        
        // LocalStorage에서 설정 로드
        this.loadSettingsFromLocalStorage(); 
        
        // InputNumberElement 인스턴스 생성 (초기값 설정은 setValue로 나중에 트리거)
        // revertToZeroOnBlank는 false로 설정하여, blank일 경우 이전 값 또는 defaultValue로 되돌립니다.
        this.rankMinElement = new InputNumberElement(this.rankMinInput, MIN_RANK_MIN, MAX_RANK_MIN, DEFAULT_RANK_MIN, this.handleRankMinChange.bind(this), false);
        this.rankMaxElement = new InputNumberElement(this.rankMaxInput, MIN_RANK_MAX, MAX_RANK_MAX, DEFAULT_RANK_MAX, this.handleRankMaxChange.bind(this), false);
        this.rankIncrementElement = new InputNumberElement(this.rankIncrementInput, MIN_RANK_INCREMENT, MAX_RANK_INCREMENT, DEFAULT_RANK_INCREMENT, this.handleRankIncrementChange.bind(this), false);

        // 자동 계산 모달 입력 필드용 InputNumberElement 인스턴스
        // 이 필드들은 모달이 열릴 때마다 값이 로드되므로, 초기값은 data.js의 DEFAULT 값을 사용
        // manual-x-input과 동일하게 revertToZeroOnBlank를 true로 설정하여 blank일 경우 0으로 되돌립니다.
        this.autoCalcStartElement = new InputNumberElement(this.autoCalcStartInput, MIN_TARGET_VALUE, MAX_TARGET_VALUE, DEFAULT_AUTO_CALC_START, this.handleAutoCalcInputChange.bind(this), true);
        this.autoCalcEndElement = new InputNumberElement(this.autoCalcEndInput, MIN_TARGET_VALUE, MAX_TARGET_VALUE, DEFAULT_AUTO_CALC_END, this.handleAutoCalcInputChange.bind(this), true);
        this.autoCalcIncrementElement = new InputNumberElement(this.autoCalcIncrementInput, MIN_RANK_INCREMENT, MAX_RANK_INCREMENT, DEFAULT_AUTO_CALC_INCREMENT, this.handleAutoCalcInputChange.bind(this), true);

        this.bindEvents();

        // 모든 InputNumberElement 인스턴스가 생성된 후, 초기값을 설정하고 콜백을 트리거합니다.
        // 이렇게 하면 handleRankMinChange 등에서 다른 요소에 접근할 때 undefined 오류가 발생하지 않습니다.
        // setValue의 두 번째 인자를 true로 설정하여 changeCallback을 트리거합니다.
        this.rankMinElement.setValue(this.rankMinInput.value, true);
        this.rankMaxElement.setValue(this.rankMaxInput.value, true);
        this.rankIncrementElement.setValue(this.rankIncrementInput.value, true);
        // autoCalc input들은 모달 열 때 setValue가 호출되므로 여기서 별도로 호출하지 않습니다.

        // 초기 테이블 렌더링
        this._renderTableStructure(); // 테이블 구조를 한 번만 그림
        this._updateTableCells(); // 초기 셀 내용 업데이트
    }

    bindEvents() {
        this.skillLevelSelect.addEventListener('change', () => {
            this.saveSettingsToLocalStorage();
            this._updateTableCells(); // 셀 내용만 업데이트
        });
        
        // 자동 계산 트리거 버튼 이벤트
        this.autoCalcTriggerBtn.addEventListener('click', () => {
            this.openAutoCalcModal();
        });

        // 자동 계산 모달 내 '계산' 버튼 이벤트
        this.applyAutoCalcBtn.addEventListener('click', () => {
            this.applyAutoCalculatedValues();
        });

        // 자동 계산 모달 닫기 버튼 이벤트
        this.autoCalcCloseBtn.addEventListener('click', () => {
            this.closeAutoCalcModal();
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
            // setValue의 두 번째 인자를 false로 설정하여 중복 콜백 트리거를 방지합니다.
            this.rankMinElement.setValue(maxVal, false);
            this.rankMaxElement.setValue(minVal, false);
            // 스왑이 발생했으므로, 다시 테이블을 렌더링합니다.
            this.saveSettingsToLocalStorage(); // 변경 후 저장
            this._updateTableCells(); // 셀 내용만 업데이트
            return;
        }
        this.saveSettingsToLocalStorage(); // 변경 후 저장
        this._updateTableCells(); // 셀 내용만 업데이트
    }

    // rankIncrementInput의 change 콜백 (InputNumberElement로부터 유효성 검사된 값 받음)
    handleRankIncrementChange(validatedIncrementVal) {
        // InputNumberElement에서 이미 유효성 검사된 값이 넘어옴
        this.saveSettingsToLocalStorage(); // 변경 후 저장
        this._updateTableCells(); // 셀 내용만 업데이트
    }

    // 자동 계산 모달 내 입력 필드 변경 시 호출될 콜백 (현재는 특별한 동작 없음)
    handleAutoCalcInputChange(value, inputElement) {
        // 이 콜백은 현재는 단순히 LocalStorage에 저장하는 역할만 수행
        // 실제 계산은 '계산' 버튼 클릭 시 이루어짐
        this.saveSettingsToLocalStorage();
    }

    openAutoCalcModal() {
        this.autoCalcSection.classList.add('active');
        // 모달을 열 때 현재 저장된 자동 계산 설정 값을 입력 필드에 반영
        const settings = JSON.parse(localStorage.getItem(SKILL_CALCULATOR_SETTINGS_KEY) || '{}');
        
        // InputNumberElement의 setValue를 사용하여 초기화 (changeCallback 트리거 안함)
        // null 또는 undefined일 경우 defaultValue를 사용하도록 설정
        this.autoCalcStartElement.setValue(settings.autoCalcStart, false);
        this.autoCalcEndElement.setValue(settings.autoCalcEnd, false);
        this.autoCalcIncrementElement.setValue(settings.autoCalcIncrement, false);
    }

    closeAutoCalcModal() {
        this.autoCalcSection.classList.remove('active');
    }

    applyAutoCalculatedValues() {
        // InputNumberElement의 getValue를 사용하여 유효성 검사된 값 가져옴
        let startVal = this.autoCalcStartElement.getValue();
        let endVal = this.autoCalcEndElement.getValue();
        let incrementVal = this.autoCalcIncrementElement.getValue();

        // null 값에 대한 기본값 처리 (InputNumberElement의 defaultValue를 따름)
        startVal = startVal === null ? DEFAULT_AUTO_CALC_START : startVal;
        endVal = endVal === null ? DEFAULT_AUTO_CALC_END : endVal;
        incrementVal = incrementVal === null ? DEFAULT_AUTO_CALC_INCREMENT : incrementVal;


        // 유효성 검사 (시작값 <= 끝나는값, 증가값 > 0)
        if (startVal > endVal) {
            this.messageDisplayCallback('시작값이 끝나는값보다 클 수 없습니다. 값이 자동으로 조정됩니다.', 'info');
            [startVal, endVal] = [endVal, startVal]; // 스왑
            // 스왑 후 InputNumberElement에 다시 설정하여 필드도 업데이트
            this.autoCalcStartElement.setValue(startVal, false); // setValue에서 콜백 트리거 방지
            this.autoCalcEndElement.setValue(endVal, false); // setValue에서 콜백 트리거 방지
        }
        if (incrementVal <= 0) {
            this.messageDisplayCallback('증가값은 1 이상이어야 합니다. 1로 조정됩니다.', 'info');
            incrementVal = 1;
            this.autoCalcIncrementElement.setValue(incrementVal, false); // setValue에서 콜백 트리거 방지
        }

        // manualXValues를 새로 채움
        this.manualXValues = [];
        for (let i = startVal; i <= endVal; i += incrementVal) {
            this.manualXValues.push(i);
        }
        // manualXValues가 비어있을 경우 기본값 채우기 (최소한의 X축 보장)
        if (this.manualXValues.length === 0) {
            this.messageDisplayCallback('생성된 대상값이 없습니다. 기본값으로 설정됩니다.', 'info');
            for (let i = DEFAULT_AUTO_CALC_START; i <= DEFAULT_AUTO_CALC_END; i += DEFAULT_AUTO_CALC_INCREMENT) {
                this.manualXValues.push(i);
            }
        }

        this.currentMode = 'manual'; // 자동 계산 버튼을 눌렀으므로 항상 manual 모드로 간주
        this.saveSettingsToLocalStorage(); // 변경된 manualXValues 저장
        this._renderTableStructure(); // X축 헤더가 변경될 수 있으므로 구조를 다시 그림
        this._updateTableCells(); // 셀 내용 업데이트
        this.closeAutoCalcModal(); // 모달 닫기
    }

    /**
     * 테이블의 기본 구조 (<thead>, <tbody>, X축 헤더 input 필드)를 한 번만 렌더링합니다.
     * 이 메서드는 초기 로드 시 또는 X축 헤더의 구성이 변경될 때 (예: 자동 계산 적용 후) 호출됩니다.
     */
    _renderTableStructure() {
        let xValues = this.manualXValues; // X축 값은 항상 manualXValues를 사용

        let tableHTML = '<thead><tr>';
        tableHTML += `<th class="corner-header">
                                <div class="diagonal-box">
                                    <span class="diag-rank">랭크</span>
                                    <span class="diag-target">대상값</span>
                                </div>
                            </th>`;

        // X축 헤더는 항상 input 필드로 구성
        xValues.forEach((val, index) => {
            const valToUse = val === null || isNaN(val) ? '' : val; 
            tableHTML += `<th>
                            <div class="manual-input-wrapper">
                                <input type="number" class="manual-x-input" data-col-index="${index}" value="${valToUse}" 
                                    min="${MIN_TARGET_VALUE}" max="${MAX_TARGET_VALUE}">
                                <span class="percent-sign">%</span>
                            </div>
                        </th>`;
        });
        tableHTML += '</tr></thead><tbody></tbody>'; // tbody는 비워두고 _updateTableCells에서 채움
        
        this.skillTable.innerHTML = tableHTML;
        this.bindManualInputEvents(); // 새로 생성된 input 필드에 이벤트 리스너 바인딩
    }

    /**
     * 테이블의 셀 내용만 업데이트합니다.
     * 이 메서드는 데이터가 변경될 때 (예: 스킬 레벨, 랭크 범위, 대상값 변경) 호출됩니다.
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

        // InputNumberElement가 관리하는 필드의 현재 값을 가져와 계산에 사용
        const rankMinForCalculation = this.rankMinElement.getValue();
        const rankMaxForCalculation = this.rankMaxElement.getValue();
        const rankIncrementForCalculation = this.rankIncrementElement.getValue();

        // 계산 시 min > max인 경우를 대비한 보정
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
        tbody.innerHTML = ''; // 기존 tbody 내용 비우기

        yValues.forEach(charRank => {
            let rowHTML = `<tr><th>${charRank}</th>`;
            xValues.forEach(otherSkillTargetValue => {
                const parsedTargetValue = parseInt(otherSkillTargetValue);

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
            tbody.insertAdjacentHTML('beforeend', rowHTML); // 행 추가
        });
    }

    bindManualInputEvents() {
        const manualInputs = this.skillTable.querySelectorAll('thead th .manual-x-input');
        manualInputs.forEach((input, index) => {
            // InputNumberElement 인스턴스가 이미 해당 input에 바인딩되어 있는지 확인
            // (renderTableStructure가 호출될 때마다 새로운 인스턴스가 생성되는 것을 방지)
            if (!input._inputNumberElementInstance) { // 사용자 정의 속성으로 인스턴스 저장 여부 확인
                // 각 manual-x-input에 InputNumberElement 인스턴스 생성
                // defaultValue를 null로 설정하고, revertToZeroOnBlank를 true로 설정 (0으로 되돌림)
                const instance = new InputNumberElement(input, MIN_TARGET_VALUE, MAX_TARGET_VALUE, null, (value) => {
                    this.manualXValues[index] = value; // null 또는 유효한 숫자 저장
                    this._updateTableCells(); // 셀 내용만 업데이트
                    this.saveSettingsToLocalStorage(); // manualXValues 변경 후 저장
                }, true); // revertToZeroOnBlank = true
                input._inputNumberElementInstance = instance; // 인스턴스 저장

                // manual-x-input의 input 이벤트: 사용자가 타이핑하는 동안 manualXValues를 업데이트
                // InputNumberElement의 focus/change/keydown 이벤트와 별도로,
                // 사용자가 타이핑하는 동안 `manualXValues` 배열의 값을 실시간으로 업데이트하여
                // `_updateTableCells`가 호출될 때 최신 입력 상태를 참조할 수 있도록 합니다.
                // `_updateTableCells`는 `change` 이벤트에서만 호출되므로, 여기서는 포커스 손실이 없습니다.
                input.addEventListener('input', (e) => {
                    const rawValue = e.target.value;
                    // rawValue가 빈 문자열이면 null로, 아니면 숫자로 파싱하여 저장
                    this.manualXValues[index] = rawValue === '' ? null : parseInt(rawValue); 
                });
            }
        });
    }

    // LocalStorage에서 설정 로드
    loadSettingsFromLocalStorage() {
        const storedSettings = localStorage.getItem(SKILL_CALCULATOR_SETTINGS_KEY);
        if (storedSettings) {
            try {
                const settings = JSON.parse(storedSettings);
                // 각 입력 필드에 값 적용
                this.skillLevelSelect.value = settings.skillLevel || '1';
                
                // InputNumberElement가 값을 관리하므로, 초기 로드 시에는 단순히 input.value에 할당
                // InputNumberElement가 초기화될 때 이 값들을 읽고 유효성 검사를 수행합니다.
                // settings.rankMin이 undefined나 null일 경우 빈 문자열로 설정하여 blank 상태를 유지
                this.rankMinInput.value = settings.rankMin !== undefined && settings.rankMin !== null ? settings.rankMin : '';
                this.rankMaxInput.value = settings.rankMax !== undefined && settings.rankMax !== null ? settings.rankMax : '';
                this.rankIncrementInput.value = settings.rankIncrement !== undefined && settings.rankIncrement !== null ? settings.rankIncrement : '';
                
                // 자동 계산 모달 입력 필드 값 로드
                this.autoCalcStartInput.value = settings.autoCalcStart !== undefined && settings.autoCalcStart !== null ? settings.autoCalcStart : DEFAULT_AUTO_CALC_START;
                this.autoCalcEndInput.value = settings.autoCalcEnd !== undefined && settings.autoCalcEnd !== null ? settings.autoCalcEnd : DEFAULT_AUTO_CALC_END;
                this.autoCalcIncrementInput.value = settings.autoCalcIncrement !== undefined && settings.autoCalcIncrement !== null ? settings.autoCalcIncrement : DEFAULT_AUTO_CALC_INCREMENT;

                // currentMode는 이제 자동/수동 전환이 아닌 manualXValues의 상태를 나타냄
                this.currentMode = 'manual'; // 이제 항상 manual 모드 (X축이 수동 입력)
                this.manualXValues = settings.manualXValues || []; // manualXValues 로드

            } catch (e) {
                console.error("Error parsing skill calculator settings from LocalStorage:", e);
                localStorage.removeItem(SKILL_CALCULATOR_SETTINGS_KEY); // 오류 발생 시 데이터 삭제
                // 기본값으로 초기화 (constructor에서 이미 처리)
            }
        } else {
            // LocalStorage에 데이터가 없으면 HTML의 기본값 사용
            this.currentMode = 'manual'; // 이제 항상 manual 모드
            this.manualXValues = []; // 초기 manualXValues는 비어있음
            // 초기 manualXValues가 비어있으면 자동 계산 기본값으로 채워줌
            for (let i = DEFAULT_AUTO_CALC_START; i <= DEFAULT_AUTO_CALC_END; i += DEFAULT_AUTO_CALC_INCREMENT) {
                this.manualXValues.push(i);
            }
        }
    }

    // 현재 설정들을 LocalStorage에 저장
    saveSettingsToLocalStorage() {
        const settings = {
            skillLevel: this.skillLevelSelect.value,
            // InputNumberElement가 관리하는 필드의 값은 input.value에서 직접 가져옴
            // blank 상태도 그대로 저장될 수 있도록 함 (null 또는 빈 문자열)
            rankMin: this.rankMinInput.value,
            rankMax: this.rankMaxInput.value,
            rankIncrement: this.rankIncrementInput.value,
            // 자동 계산 모달 입력 필드 값 저장
            autoCalcStart: this.autoCalcStartInput.value,
            autoCalcEnd: this.autoCalcEndInput.value,
            autoCalcIncrement: this.autoCalcIncrementInput.value,
            currentMode: 'manual', // 이제 항상 'manual'로 저장
            manualXValues: this.manualXValues // manualXValues도 저장
        };
        localStorage.setItem(SKILL_CALCULATOR_SETTINGS_KEY, JSON.stringify(settings));
    }
}
