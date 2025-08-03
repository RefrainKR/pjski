import { InputNumberElement } from '/lib/utils/InputNumberElement.js';
import { eventPointLogic } from '/logic/EventPointLogic.js';

export class EventPointCalculatorViewModel {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.inputElements = {};
        this.outputElements = {};
        this.numberInputs = {};

        this._bindElements();
        this._attachEventListeners();
        this._startRealtimeUpdates();
        
        const today = new Date().toISOString().slice(0, 10);
        this.inputElements.startDate.value = today;
        this.inputElements.endDate.value = today;

        this.recalculateAndRender(); // 초기 렌더링
    }

    _bindElements() {
        const ids = {
            inputs: ['ep-start-date', 'ep-end-date', 'ep-start-time', 'ep-current-points', 'ep-current-energy', 'ep-extra-energy', 'ep-per-5-energy', 'ep-challenge-live', 'ep-mysekai'],
            outputs: ['ep-current-time', 'ep-time-left', 'ep-result-live', 'ep-result-challenge', 'ep-result-mysekai', 'ep-result-total', 'ep-remain-natural-energy', 'ep-remain-ad-energy', 'ep-remain-challenge', 'ep-remain-mysekai']
        };

        ids.inputs.forEach(id => {
            const el = this.container.querySelector(`#${id}`);
            const key = this._toCamelCase(id);
            this.inputElements[key] = el;
            
            // --- 핵심 수정: InputNumberElement 인스턴스를 this.inputElements 자체에 저장 ---
            if (el.type === 'number') {
                // InputNumberElement를 생성하고, 원래 키 이름 뒤에 'Element'를 붙여 저장
                this.inputElements[`${key}Element`] = new InputNumberElement(el, 0, 999999999, 0);
            }
        });
        ids.outputs.forEach(id => this.outputElements[this._toCamelCase(id)] = this.container.querySelector(`#${id}`));
    }
    
    _gatherInputs() {
        // --- 핵심 수정: 수정된 구조에서 값을 가져오도록 변경 ---
        return {
            startDate: this.inputElements.startDate.value,
            endDate: this.inputElements.endDate.value,
            startTime: this.inputElements.startTime.value,
            currentPoints: this.inputElements.currentPointsElement.getValue(),
            currentEnergy: this.inputElements.currentEnergyElement.getValue(),
            extraEnergy: this.inputElements.extraEnergyElement.getValue(),
            epPer5Energy: this.inputElements.per5EnergyElement.getValue(),
            challengeLive: this.inputElements.challengeLiveElement.getValue(),
            mysekaiChoice: parseFloat(this.inputElements.mysekai.value)
        };
    }
    
    _toCamelCase(str) {
        return str.replace('ep-', '').replace(/-./g, match => match.charAt(1).toUpperCase());
    }

    _attachEventListeners() {
        // 모든 input 요소의 'input' 또는 'change' 이벤트가 발생하면,
        // 전체 계산을 다시 수행하고 렌더링합니다.
        Object.values(this.inputElements).forEach(element => {
            if (element instanceof HTMLElement) {
                element.addEventListener('input', () => this.recalculateAndRender());
                element.addEventListener('change', () => this.recalculateAndRender()); // 날짜 변경 등
            }
        });
    }

    _startRealtimeUpdates() {
        // 1초마다 오직 시간 표시만 업데이트합니다.
        setInterval(() => {
            const now = new Date();
            const inputs = this._gatherInputs();
            
            // 필수 정보가 없으면 타이머 업데이트도 중단
            if (!inputs.startDate || !inputs.endDate) {
                this.outputElements.currentTime.textContent = now.toLocaleString('ko-KR');
                this.outputElements.timeLeft.textContent = '날짜를 입력하세요';
                return;
            }

            const eventEndDate = new Date(`${inputs.endDate}T${inputs.startTime === '15' ? '20:59:59' : '19:59:59'}`);
            const timeLeftMs = eventEndDate - now;

            this.outputElements.currentTime.textContent = now.toLocaleString('ko-KR');

            if (timeLeftMs < 0) {
                this.outputElements.timeLeft.textContent = '이벤트 종료';
            } else {
                const totalSeconds = Math.floor(timeLeftMs / 1000);
                const days = Math.floor(totalSeconds / 86400);
                const hours = Math.floor((totalSeconds % 86400) / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const seconds = totalSeconds % 60;
                this.outputElements.timeLeft.textContent = `${days}일 ${hours}시간 ${minutes}분 ${seconds}초`;
            }
            
            // 매 시 0분 0초, 30분 0초에만 전체 재계산 (자연불 갱신)
            if (now.getMinutes() % 30 === 0 && now.getSeconds() === 0) {
                this.recalculateAndRender();
            }
            
        }, 1000);
    }
    
    _gatherInputs() {
    return {
        startDate: this.inputElements.startDate.value,
        endDate: this.inputElements.endDate.value,
        startTime: this.inputElements.startTime.value,
        currentPoints: this.inputElements.currentPointsElement.getValue(),
        currentEnergy: this.inputElements.currentEnergyElement.getValue(),
        extraEnergy: this.inputElements.extraEnergyElement.getValue(),
        epPer5Energy: this.inputElements.per5EnergyElement.getValue(),
        challengeLive: this.inputElements.challengeLiveElement.getValue(),
        mysekaiChoice: parseFloat(this.inputElements.mysekai.value)
    };
}

    recalculateAndRender() {
        const inputs = this._gatherInputs();
        const now = new Date(); // 항상 최신 시간으로 계산
        const results = eventPointLogic.calculate(inputs, now);

        if (!results) {
            // (선택) 필수 입력값이 없을 때 UI를 비우는 로직
            return;
        }

        // --- 여기서는 결과 "표시"만 담당 ---
        const { remaining, predictions, finalEP } = results;
        
        if (!remaining || !predictions) return;

        this.outputElements.remainNaturalEnergy.textContent = remaining.naturalEnergy.toLocaleString();
        this.outputElements.remainAdEnergy.textContent = remaining.adEnergy.toLocaleString();
        this.outputElements.remainChallenge.textContent = `${remaining.challengeCount.toLocaleString()} 회`;
        this.outputElements.remainMysekai.textContent = `${remaining.mysekaiCount.toLocaleString()} 회`;
        
        this.outputElements.resultLive.textContent = Math.floor(predictions.liveEP).toLocaleString();
        this.outputElements.resultChallenge.textContent = Math.floor(predictions.challengeEP).toLocaleString();
        this.outputElements.resultMysekai.textContent = Math.floor(predictions.mysekaiEP).toLocaleString();
        
        this.outputElements.resultTotal.textContent = Math.floor(finalEP).toLocaleString();
    }
}