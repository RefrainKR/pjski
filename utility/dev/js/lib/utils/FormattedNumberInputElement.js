//import { InputNumberElement } from './InputNumberElement.js';
import { InputNumberElement } from '/lib/utils/InputNumberElement.js';

export class FormattedNumberInputElement extends InputNumberElement {
    constructor(inputElement, options) {
        // 부모에게 콜백 등 모든 옵션을 전달
        super(inputElement, options.min, options.max, options.defaultValue, options.changeCallback);
        
        // 이 클래스의 고유한 동작
        this.inputElement.type = 'text';
		inputElement.inputMode = 'numeric';

        this.inputElement.addEventListener('input', () => this._onInput());

        this._formatValue();
    }

    handleFocus() {
        this.previousValue = this.getValue();
        this.inputElement.value = String(this.previousValue || '');
        this.inputElement.select();
    }

    handleChange() {
        super.handleChange(); 
        this._formatValue();
    }

    setValue(value, triggerCallback = true) {
        super.setValue(value, triggerCallback);
        this._formatValue();
    }
    
    getValue() {
        const value = parseInt(String(this.inputElement.value).replace(/,/g, ''));
        return isNaN(value) ? this.defaultValue : value;
    }

    _onInput() {
        const originalValue = this.inputElement.value;
        const numericValue = originalValue.replace(/[^0-9]/g, '');
        if (originalValue !== numericValue) {
            this.inputElement.value = numericValue;
        }
    }

    _formatValue() {
        const value = this.getValue();
        if (value !== null && !isNaN(value)) {
            this.inputElement.value = value.toLocaleString();
        }
    }
}