import { InputNumberElement } from '/lib/utils/InputNumberElement.js';
import { storageManager } from '/lib/utils/StorageManager.js';
import { kebabToCamelCase } from '/lib/utils/StringUtils.js';

import { eventPointModel } from '/model/eventPointModel.js';

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
            inputs: [
                'ep-start-date', 'ep-end-date', 'ep-start-time', 
                'ep-current-ep', 'ep-target-ep', 
                'ep-current-energy', 'ep-extra-energy', 
                'ep-per-5-energy', 
                'ep-challenge-live-value', 'ep-challenge-live-toggle', 
                'ep-mysekai-value', 'ep-mysekai-toggle'
            ],
            outputs: [
                'ep-current-time', 'ep-time-left', 
                'ep-result-achievable', 'ep-result-total', 'ep-result-remaining', 'ep-result-needed-energy',
                'ep-remain-natural-energy', 'ep-remain-ad-energy', 
                'ep-remain-challenge', 'ep-remain-mysekai'
            ]
        };

        ids.inputs.forEach(id => {
            const el = this.container.querySelector(`#${id}`);
            if (el) {
                const key = kebabToCamelCase(id.replace('ep-', ''));
                this.inputElements[key] = el;
                if (el.type === 'number') {
                    this.inputElements[`${key}Element`] = new InputNumberElement(el, 0, 9999999999, 0);
                }
            }
        });
        ids.outputs.forEach(id => {
            const key = kebabToCamelCase(id.replace('ep-', ''));
            this.outputElements[key] = this.container.querySelector(`#${id}`);
        });

        this.resetBtn = this.container.querySelector('#ep-reset-btn');
    }

    _attachEventListeners() {
        Object.values(this.inputElements).forEach(element => {
            if (element instanceof HTMLElement) {
                element.addEventListener('input', () => this.recalculateAndRender());

                element.addEventListener('change', () => {
                    this.recalculateAndRender();
                    this._saveCurrentSettings();
                });
            }
        });

        this.inputElements.challengeLiveToggle.addEventListener('change', (e) => {
            this.inputElements.challengeLiveValue.disabled = !e.target.checked;
        });
        this.inputElements.mysekaiToggle.addEventListener('change', (e) => {
            this.inputElements.mysekaiValue.disabled = !e.target.checked;
        });

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
            currentEP: this.inputElements.currentEpElement.getValue(),
            targetEP: this.inputElements.targetEpElement.getValue(),
            currentEnergy: this.inputElements.currentEnergyElement.getValue(),
            extraEnergy: this.inputElements.extraEnergyElement.getValue(),
            epPer5Energy: this.inputElements.per5EnergyElement.getValue(),
            challengeLive: this.inputElements.challengeLiveValueElement.getValue(),
            challengeToggle: this.inputElements.challengeLiveToggle.checked,
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
        const results = eventPointModel.calculate(inputs, now);

        this.updateTimers();

        if (!results) return;

        const { remaining, predictions, finalEP } = results;
        if (!remaining || !predictions) return;

        this.outputElements.remainNaturalEnergy.textContent = `${remaining.naturalEnergy.toLocaleString()} 불`;
        this.outputElements.remainAdEnergy.textContent = `${remaining.adEnergy} 불`; // 횟수 * 10으로 표시
        this.outputElements.remainChallenge.textContent = `${remaining.challengeCount.toLocaleString()} 회`;
        this.outputElements.remainMysekai.textContent = `${remaining.mysekaiCount.toLocaleString()} 회`;
        
        this.outputElements.resultAchievable.textContent = Math.floor(predictions.achievableEP).toLocaleString();
        this.outputElements.resultTotal.textContent = Math.floor(finalEP).toLocaleString();
        this.outputElements.resultRemaining.textContent = Math.floor(predictions.remainingEP).toLocaleString();
        this.outputElements.resultNeededEnergy.textContent = `${predictions.neededEnergy.toLocaleString()} 불`;
    }

    loadSettings() {
        const settings = storageManager.load(EP_SETTINGS_KEY, DEFAULT_EP_SETTINGS);
        
        this.inputElements.startDate.value = settings.startDate;
        this.inputElements.endDate.value = settings.endDate;
        this.inputElements.startTime.value = settings.startTime;

        this.inputElements.currentEpElement.setValue(settings.currentEP);
        this.inputElements.targetEpElement.setValue(settings.targetEP);
        this.inputElements.currentEnergyElement.setValue(settings.currentEnergy);
        this.inputElements.extraEnergyElement.setValue(settings.extraEnergy);
        this.inputElements.per5EnergyElement.setValue(settings.epPer5Energy);
        this.inputElements.challengeLiveValueElement.setValue(settings.challengeLive);

        this.inputElements.challengeLiveToggle.checked = settings.challengeToggle;
        this.inputElements.challengeLiveValue.disabled = !settings.challengeToggle;
        this.inputElements.mysekaiValueElement.setValue(settings.mysekaiEpValue);
        this.inputElements.mysekaiToggle.checked = settings.mysekaiToggle;
        this.inputElements.mysekaiValue.disabled = !settings.mysekaiToggle;
        
        this.recalculateAndRender();
    }

    _saveCurrentSettings() {
        const settings = this._gatherInputs();
        storageManager.save(EP_SETTINGS_KEY, settings);
        this.messageDisplayCallback('설정이 자동 저장되었습니다.', 'info');
    }
    
    resetSettings() {
        if (confirm('모든 입력값을 초기 설정으로 되돌리시겠습니까?')) {
            storageManager.remove(EP_SETTINGS_KEY);
            this.loadSettings();
            this.messageDisplayCallback('설정이 초기화되었습니다.', 'info');
        }
    }
}