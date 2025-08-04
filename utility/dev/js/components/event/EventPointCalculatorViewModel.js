import { InputNumberElement } from '/lib/utils/InputNumberElement.js';
import { eventPointLogic } from '/logic/EventPointLogic.js';
import { storageManager } from '/lib/utils/StorageManager.js';

import { EP_SETTINGS_KEY, DEFAULT_EP_SETTINGS } from '/data.js';


export class EventPointCalculatorViewModel {
    constructor(config) {
        this.container = document.getElementById(config.containerId);
        if (!this.container) return;
        
        this.messageDisplayCallback = config.messageDisplayCallback;
        this.inputElements = {};
        this.outputElements = {};

        this._bindElements();
        this._attachEventListeners();
        
        this.loadSettings();
        this._startRealtimeUpdates();
    }

    _bindElements() {
        const ids = {
            inputs: ['ep-start-date', 'ep-end-date', 'ep-start-time', 'ep-current-points', 'ep-current-energy', 'ep-extra-energy', 'ep-per-5-energy', 'ep-challenge-live', 'ep-mysekai-value', 'ep-mysekai-toggle'],
            outputs: ['ep-current-time', 'ep-time-left', 'ep-result-live', 'ep-result-challenge', 'ep-result-mysekai', 'ep-result-total', 'ep-remain-natural-energy', 'ep-remain-ad-energy', 'ep-remain-challenge', 'ep-remain-mysekai']
        };

        ids.inputs.forEach(id => {
            const el = this.container.querySelector(`#${id}`);
            const key = this._toCamelCase(id);
            this.inputElements[key] = el;
            if (el && el.type === 'number') {
                // InputNumberElement를 생성하고, 원래 키 이름 뒤에 'Element'를 붙여 저장
                this.inputElements[`${key}Element`] = new InputNumberElement(el, 0, 999999999, 0);
            }
        });
        ids.outputs.forEach(id => {
            this.outputElements[this._toCamelCase(id)] = this.container.querySelector(`#${id}`);
        });

        this.saveBtn = this.container.querySelector('#ep-save-btn');
        this.resetBtn = this.container.querySelector('#ep-reset-btn');
    }
    
    _toCamelCase(str) {
        return str.replace('ep-', '').replace(/-./g, match => match.charAt(1).toUpperCase());
    }

    _attachEventListeners() {
        Object.values(this.inputElements).forEach(element => {
            if (element instanceof HTMLElement) {
                element.addEventListener('input', () => this.recalculateAndRender());
                element.addEventListener('change', () => this.recalculateAndRender());
            }
        });
        
        this.inputElements.mysekaiToggle.addEventListener('change', (e) => {
            this.inputElements.mysekaiValue.disabled = !e.target.checked;
        });

        this.saveBtn.addEventListener('click', () => this.saveSettings());
        this.resetBtn.addEventListener('click', () => this.resetSettings());
    }

    _startRealtimeUpdates() {
        setInterval(() => {
            this.updateTimers();
            const now = new Date();
            if ((now.getMinutes() === 0 || now.getMinutes() === 30) && now.getSeconds() === 0) {
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
            mysekaiEpValue: this.inputElements.mysekaiValueElement.getValue(),
            mysekaiToggle: this.inputElements.mysekaiToggle.checked
        };
    }
    
    updateTimers() {
        const inputs = this._gatherInputs();
        const now = new Date();
        
        this.outputElements.currentTime.textContent = now.toLocaleString('ko-KR');

        if (!inputs.startDate || !inputs.endDate) {
            this.outputElements.timeLeft.textContent = '날짜를 입력하세요';
            return;
        }

        const eventEndDate = new Date(`${inputs.endDate}T${inputs.startTime === '15' ? '20:59:59' : '19:59:59'}`);
        const timeLeftMs = eventEndDate - now;

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
    }

    recalculateAndRender() {
        const inputs = this._gatherInputs();
        const now = new Date();
        const results = eventPointLogic.calculate(inputs, now);

        this.updateTimers();

        if (!results) return;

        const { remaining, predictions, finalEP } = results;
        if (!remaining || !predictions) return;

        // --- 핵심 수정: 표시 형식 변경 ---
        this.outputElements.remainNaturalEnergy.textContent = `${remaining.naturalEnergy.toLocaleString()} 불`; // '불' 단위 추가
        
        this.outputElements.remainAdEnergy.textContent = `${remaining.adEnergy.toLocaleString()} 불`; // '불' 단위 추가

        this.outputElements.remainChallenge.textContent = `${remaining.challengeCount.toLocaleString()} 회`;
        this.outputElements.remainMysekai.textContent = `${remaining.mysekaiCount.toLocaleString()} 회`;
        
        this.outputElements.resultLive.textContent = Math.floor(predictions.liveEP).toLocaleString();
        this.outputElements.resultChallenge.textContent = Math.floor(predictions.challengeEP).toLocaleString();
        this.outputElements.resultMysekai.textContent = Math.floor(predictions.mysekaiEP).toLocaleString();
        this.outputElements.resultTotal.textContent = Math.floor(finalEP).toLocaleString();
    }

    loadSettings() {
        const settings = storageManager.load(EP_SETTINGS_KEY, DEFAULT_EP_SETTINGS);
        
        const today = new Date().toISOString().slice(0, 10);
        this.inputElements.startDate.value = settings.startDate || today;
        this.inputElements.endDate.value = settings.endDate || today;
        
        this.inputElements.startTime.value = settings.startTime;
        this.inputElements.currentPointsElement.setValue(settings.currentPoints);
        this.inputElements.currentEnergyElement.setValue(settings.currentEnergy);
        this.inputElements.extraEnergyElement.setValue(settings.extraEnergy);
        this.inputElements.per5EnergyElement.setValue(settings.epPer5Energy);
        this.inputElements.challengeLiveElement.setValue(settings.challengeLive);
        this.inputElements.mysekaiValueElement.setValue(settings.mysekaiEpValue);
        this.inputElements.mysekaiToggle.checked = settings.mysekaiToggle;
        
        this.inputElements.mysekaiValue.disabled = !settings.mysekaiToggle;
        
        this.recalculateAndRender();
    }

    saveSettings() {
        const settings = this._gatherInputs();
        storageManager.save(EP_SETTINGS_KEY, settings);
        this.messageDisplayCallback('이벤트 계산기 설정이 저장되었습니다.', 'success');
    }
    
    resetSettings() {
        if (confirm('모든 입력값을 초기 설정으로 되돌리시겠습니까?')) {
            storageManager.remove(EP_SETTINGS_KEY);
            this.loadSettings();
            this.messageDisplayCallback('설정이 초기화되었습니다.', 'info');
        }
    }
}