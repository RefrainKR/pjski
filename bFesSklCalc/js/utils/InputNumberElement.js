/**
 * input type="number" 필드의 유효성 검사 및 사용자 인터랙션을 관리하는 클래스입니다.
 * (수정) Tab 키의 완벽한 동작을 보장하는 최종 버전입니다.
 */
export class InputNumberElement {
    constructor(inputElement, min, max, defaultValue, changeCallback, fallbackValueOnBlank = null) {
        if (!inputElement) {
            console.error("InputNumberElement: inputElement is not provided.");
            return;
        }
        this.inputElement = inputElement;
        this.min = min;
        this.max = max;
        this.defaultValue = defaultValue;
        this.changeCallback = changeCallback;
        this.fallbackValueOnBlank = fallbackValueOnBlank;

        this.previousValue = null;

        this.inputElement.min = String(this.min);
        this.inputElement.max = String(this.max);

        const initialParsedValue = parseInt(this.inputElement.value);
        if (isNaN(initialParsedValue)) {
            this.inputElement.value = '';
        } else {
            const validatedInitialValue = Math.max(this.min, Math.min(this.max, initialParsedValue));
            this.inputElement.value = String(validatedInitialValue);
        }
        
        this.bindEvents();
    }

    bindEvents() {
        this.inputElement.addEventListener('focus', this.handleFocus.bind(this));
        this.inputElement.addEventListener('blur', this.handleChange.bind(this)); 
        this.inputElement.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    handleFocus() {
        // 포커스를 얻는 순간의 유효한 값을 previousValue에 저장합니다.
        this.previousValue = this.getValue();
        // 필드를 비워 빠른 입력을 돕습니다.
        this.inputElement.value = '';
    }

    handleChange() {
        let value = parseInt(this.inputElement.value);
        let valueForCallback;
        let valueForDisplay;

        if (isNaN(value) || this.inputElement.value.trim() === '') {
            if (this.fallbackValueOnBlank !== null) {
                valueForCallback = this.fallbackValueOnBlank;
                valueForDisplay = String(this.fallbackValueOnBlank);
            } else {
                valueForCallback = (this.previousValue !== null && !isNaN(this.previousValue)) ? this.previousValue : this.defaultValue; 
                valueForDisplay = (valueForCallback !== null && !isNaN(valueForCallback)) ? String(valueForCallback) : '';
            }
        } else {
            valueForCallback = Math.max(this.min, Math.min(this.max, value));
            valueForDisplay = String(valueForCallback);
        }
        
        this.inputElement.value = valueForDisplay;

        if (typeof this.changeCallback === 'function') {
            this.changeCallback(valueForCallback, this.inputElement);
        }
    }

    handleKeyDown(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.inputElement.blur();
        }
    }

    getValue() {
        let value = parseInt(this.inputElement.value);
        if (isNaN(value)) {
            // 현재 값이 유효하지 않을 때는 previousValue를 반환하는 것이 더 안전할 수 있음
            // 하지만 defaultValue가 명확하므로 그대로 둡니다.
            return this.defaultValue; 
        }
        return Math.max(this.min, Math.min(this.max, value));
    }

    setValue(value, triggerCallback = true) {
        let valueForCallback;
        let valueForDisplay;

        if (value === null || value === '') {
            valueForCallback = this.defaultValue;
            valueForDisplay = '';
        } else {
            let parsedValue = parseInt(value);
            if (isNaN(parsedValue)) {
                valueForCallback = this.defaultValue;
                valueForDisplay = '';
            } else {
                valueForCallback = Math.max(this.min, Math.min(this.max, parsedValue));
                valueForDisplay = String(valueForCallback);
            }
        }
        
        this.inputElement.value = valueForDisplay;

        if (triggerCallback && typeof this.changeCallback === 'function') {
            this.changeCallback(valueForCallback, this.inputElement);
        }
    }
}