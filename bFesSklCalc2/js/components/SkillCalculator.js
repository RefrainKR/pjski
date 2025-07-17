// js/components/SkillCalculator.js

import { SKILL_DATA } from '../data.js';

export class SkillCalculator { // SkillSimulator -> SkillCalculator 이름 변경
    constructor(containerId, messageDisplayCallback) {
        this.container = document.getElementById(containerId);
        this.skillLevelSelect = this.container.querySelector('#skill-level-select');
        this.skillTable = this.container.querySelector('#skill-comparison-table');
        this.messageDisplayCallback = messageDisplayCallback;

        // 랭크 범위 및 증가량 관련 DOM
        this.rankMinInput = this.container.querySelector('#rank-min');
        this.rankMaxInput = this.container.querySelector('#rank-max');
        this.rankIncrementInput = this.container.querySelector('#rank-increment');

        // 모드 토글 관련 DOM
        this.modeToggleButton = this.container.querySelector('#mode-toggle-btn');
        this.currentMode = 'auto'; // 'auto' 또는 'manual'
        this.manualXValues = []; // 수동 모드에서 입력된 대상값들을 저장할 배열

        this.bindEvents();
        this.renderSkillTable(); // 초기 렌더링
    }

    bindEvents() {
        this.skillLevelSelect.addEventListener('change', () => this.renderSkillTable());
        
        this.rankMinInput.addEventListener('change', () => this.handleRankRangeChange());
        this.rankMaxInput.addEventListener('change', () => this.handleRankRangeChange());
        this.rankIncrementInput.addEventListener('change', () => this.handleRankIncrementChange());

        this.modeToggleButton.addEventListener('click', () => this.toggleMode());
    }

    handleRankRangeChange() {
        let min = parseInt(this.rankMinInput.value);
        let max = parseInt(this.rankMaxInput.value);

        min = Math.max(10, Math.min(200, isNaN(min) ? 10 : min));
        max = Math.max(10, Math.min(200, isNaN(max) ? 100 : max));

        if (min > max) {
            [min, max] = [max, min];
            this.messageDisplayCallback('랭크 최소값이 최대값보다 높아 값이 자동으로 교환되었습니다.', 'info');
        }

        this.rankMinInput.value = min;
        this.rankMaxInput.value = max;
        
        this.renderSkillTable();
    }

    handleRankIncrementChange() {
        let increment = parseInt(this.rankIncrementInput.value);
        
        increment = Math.max(1, Math.min(10, isNaN(increment) ? 1 : increment));
        this.rankIncrementInput.value = increment;

        this.renderSkillTable();
    }

    toggleMode() {
        if (this.currentMode === 'auto') {
            this.currentMode = 'manual';
            this.modeToggleButton.textContent = '수동 모드';
            this.modeToggleButton.dataset.mode = 'manual';
            // 수동 모드로 전환 시, 현재 자동 모드의 X 값들을 manualXValues에 저장하여 초기값으로 사용
            // 단, 이미 manualXValues에 값이 있다면 유지
            if (this.manualXValues.length === 0) { // 비어있을 때만 초기화
                for (let i = 80; i <= 140; i += 5) {
                    this.manualXValues.push(i);
                }
            }
        } else {
            this.currentMode = 'auto';
            this.modeToggleButton.textContent = '자동 모드';
            this.modeToggleButton.dataset.mode = 'auto';
            // 자동 모드로 돌아갈 때는 manualXValues를 초기화하지 않음 (다시 수동모드 갈 때 값 유지)
        }
        this.renderSkillTable();
    }

    renderSkillTable() {
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

        const rankMin = parseInt(this.rankMinInput.value);
        const rankMax = parseInt(this.rankMaxInput.value);
        const rankIncrement = parseInt(this.rankIncrementInput.value);

        const yValues = [];
        for (let i = rankMin; i <= rankMax; i += rankIncrement) {
            yValues.push(i);
        }

        let xValues = [];
        if (this.currentMode === 'auto') {
            for (let i = 80; i <= 140; i += 5) {
                xValues.push(i);
            }
        } else { // manual mode
            // manualXValues의 길이를 사용하여 X축 헤더 갯수를 결정
            // (초기에는 자동모드와 동일한 13개)
            xValues = this.manualXValues; 
        }
        
        let tableHTML = '<thead><tr>';
        // 첫 번째 <th>를 대각선 이미지 포함하도록 수정
        tableHTML += `<th class="corner-header">
                            <div class="diagonal-box">
                                <span class="diag-rank">랭크</span>
                                <span class="diag-target">대상값</span>
                            </div>
                        </th>`;

        if (this.currentMode === 'auto') {
            xValues.forEach(xVal => {
                tableHTML += `<th>${xVal}%</th>`;
            });
        } else { // manual mode: input fields in header
            xValues.forEach((val, index) => {
                // 저장된 manualXValues 값을 초기값으로 사용
                const valToUse = val === null || isNaN(val) ? '' : val; // null이거나 NaN이면 빈 문자열
                tableHTML += `<th>
                                <div class="manual-input-wrapper">
                                    <input type="number" class="manual-x-input" data-col-index="${index}" value="${valToUse}" min="0" max="999">
                                    <span class="percent-sign">%</span>
                                </div>
                              </th>`;
            });
        }
        tableHTML += '</tr></thead><tbody>';

        // 테이블 본문 렌더링
        yValues.forEach(charRank => {
            let rowCells = '';
            xValues.forEach(otherSkillTargetValue => {
                // 수동 모드이면서 입력값이 유효하지 않은 경우 (null 또는 NaN) 빈 셀 처리
                if (this.currentMode === 'manual' && (otherSkillTargetValue === null || isNaN(otherSkillTargetValue))) {
                    rowCells += `<td class="empty-cell"></td>`;
                    return;
                }

                // 각후 스킬 계산
                let finalAfterSkill = Math.floor(afterBase + Math.floor(charRank / 2) * 2);
                finalAfterSkill = Math.min(finalAfterSkill, afterMax);

                // 각전 스킬 계산
                let finalBeforeSkill = Math.floor(beforeBase + (otherSkillTargetValue / 2));
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

                rowCells += `<td class="${cellClass}">${finalDisplayedValue}%</td>`;
            });
            tableHTML += `<tr><th>${charRank}</th>${rowCells}</tr>`;
        });
        
        tableHTML += '</tbody>';
        this.skillTable.innerHTML = tableHTML;

        if (this.currentMode === 'manual') {
            this.bindManualInputEvents(); // 수동 모드일 때만 입력 필드 이벤트 바인딩
        }
    }

    bindManualInputEvents() {
        const manualInputs = this.skillTable.querySelectorAll('thead th .manual-x-input');
        manualInputs.forEach((input, index) => {
            input.addEventListener('change', (e) => {
                let value = parseInt(e.target.value);
                // 유효성 검사 및 저장
                if (isNaN(value)) {
                    this.manualXValues[index] = null; // 숫자가 아니면 null 저장
                } else {
                    this.manualXValues[index] = value;
                }
                this.renderSkillTable(); // 전체 테이블 다시 렌더링
            });
            // 실시간 입력에 대한 처리는 change 이벤트로 충분하며, input 이벤트는 불필요할 수 있습니다.
            // input.addEventListener('input', (e) => { ... });
        });
    }
}