// js/utils/InputNumberElement.js

/**
 * input type="number" 필드의 유효성 검사 및 사용자 인터랙션을 관리하는 클래스입니다.
 * - 포커스 시 필드 내용을 비웁니다 (이전 유효한 값 저장).
 * - 포커스를 잃거나 Enter 키를 눌렀을 때 유효성 검사를 수행합니다.
 * - 유효하지 않거나 blank인 경우:
 * - `revertToZeroOnBlank`가 true이면 필드를 '0'으로 설정하고 콜백에 0을 전달합니다.
 * - 그렇지 않으면 필드를 이전 유효한 값 (`previousValue`) 또는 `defaultValue`로 되돌리고 콜백에 해당 값을 전달합니다.
 * - 유효한 숫자는 min/max 범위 내로 제한하여 필드에 표시합니다.
 */
export class InputNumberElement {
    /**
     * @param {HTMLInputElement} inputElement - 관리할 input 요소.
     * @param {number} min - 허용되는 최소값.
     * @param {number} max - 허용되는 최대값.
     * @param {number | null} defaultValue - 숫자가 아니거나 범위를 벗어날 경우 콜백에 전달될 기본값.
     * null인 경우, `revertToZeroOnBlank`가 false라면 이전 값으로 되돌립니다.
     * @param {Function} changeCallback - 값이 변경되어 유효성 검사를 통과했을 때 호출될 콜백 함수.
     * (인자로 유효성 검사된 값(number 또는 null)과 inputElement를 전달)
     * @param {boolean} [revertToZeroOnBlank=false] - 포커스를 잃을 때 blank/유효하지 않은 값이라면 0으로 되돌릴지 여부.
     * false이면 `defaultValue` 또는 `previousValue`를 따릅니다.
     */
    constructor(inputElement, min, max, defaultValue, changeCallback, revertToZeroOnBlank = false) {
        this.inputElement = inputElement;
        this.min = min;
        this.max = max;
        this.defaultValue = defaultValue;
        this.changeCallback = changeCallback;
        this.revertToZeroOnBlank = revertToZeroOnBlank;

        this.previousValue = null; // 포커스 직전의 유효한 값을 저장

        // HTML input 요소의 min/max 속성 설정
        this.inputElement.min = String(this.min);
        this.inputElement.max = String(this.max);

        // 초기값 설정 (필드에 표시될 값만 처리).
        // 콜백은 SkillCalculator에서 모든 InputNumberElement가 초기화된 후 명시적으로 트리거합니다.
        const initialParsedValue = parseInt(this.inputElement.value);
        if (isNaN(initialParsedValue)) {
            this.inputElement.value = ''; // 초기 로드 시에도 blank로 표시
        } else {
            this.inputElement.value = Math.max(this.min, Math.min(this.max, initialParsedValue));
        }
        
        this.bindEvents();
    }

    bindEvents() {
        this.inputElement.addEventListener('focus', this.handleFocus.bind(this));
        this.inputElement.addEventListener('change', this.handleChange.bind(this));
        this.inputElement.addEventListener('keydown', this.handleKeyDown.bind(this));
        // input 이벤트는 InputNumberElement가 직접 처리할 필요 없음.
        // SkillCalculator에서 manualXValues를 업데이트하는 용도로만 사용.
    }

    handleFocus() {
        // 포커스 시 현재 필드의 유효한 값을 previousValue에 저장
        // getValue()는 현재 필드에 표시된 값을 기반으로 유효성 검사된 값을 반환
        this.previousValue = this.getValue(); 
        this.inputElement.value = ''; // 필드를 비움
    }

    handleChange() {
        console.log("handleChange 호출됨. inputElement.value (원본):", this.inputElement.value); // 로그 추가
        let value = parseInt(this.inputElement.value);
        console.log("파싱된 값:", value, "isNaN(value):", isNaN(value)); // 로그 추가

        let valueForCallback; // 콜백에 전달될 최종 값 (숫자 또는 null)
        let valueForDisplay; // input 필드에 표시될 최종 값 (문자열 또는 숫자)

        // 유효성 검사 및 범위 제한
        if (isNaN(value)) {
            console.log("isNaN(value) 블록 진입 (빈 값 또는 유효하지 않은 입력)"); // 로그 추가
            // 숫자가 아니거나 빈 값인 경우
            if (this.revertToZeroOnBlank) {
                valueForCallback = 0;
                valueForDisplay = '0';
            } else {
                // defaultValue가 null이면 콜백에 null 전달, 아니면 defaultValue 전달
                valueForCallback = this.defaultValue; 
                // 필드에는 previousValue 또는 defaultValue를 표시 (빈 값 허용 안 함)
                // previousValue가 유효한 숫자라면 그것을 사용, 아니면 defaultValue가 유효한 숫자라면 그것을 사용,
                // 둘 다 아니라면 빈 문자열 (blank)을 표시
                valueForDisplay = (this.previousValue !== null && !isNaN(this.previousValue)) ? this.previousValue : (this.defaultValue !== null ? this.defaultValue : '');
            }
        } else {
            console.log("else 블록 진입 (유효한 숫자 입력)"); // 로그 추가
            // 숫자인 경우 범위 제한 적용
            valueForCallback = Math.max(this.min, Math.min(this.max, value));
            valueForDisplay = valueForCallback; // 필드에는 제한된 값 표시
        }
        
        this.inputElement.value = valueForDisplay;
        this.changeCallback(valueForCallback, this.inputElement);
    }

    handleKeyDown(event) {
        if (event.key === 'Enter') {
            event.preventDefault(); // 기본 Enter 동작(폼 제출 등) 방지
            this.inputElement.blur(); // 필드에서 포커스 잃게 함 (change 이벤트 트리거)
        }
    }

    /**
     * 현재 InputElement의 유효성 검사된 값을 반환합니다.
     * 필드가 blank이거나 유효하지 않으면 defaultValue를 반환합니다.
     * @returns {number | null}
     */
    getValue() {
        let value = parseInt(this.inputElement.value);
        if (isNaN(value)) {
            return this.defaultValue; // 필드가 blank이면 defaultValue 반환
        }
        return Math.max(this.min, Math.min(this.max, value));
    }

    /**
     * 외부에서 값을 설정하고 필드를 업데이트합니다.
     * 이 메서드는 주로 LocalStorage에서 값을 로드할 때 사용됩니다.
     * @param {number | null | string} value - 설정할 값. null 또는 빈 문자열은 blank로 처리.
     * @param {boolean} [triggerCallback=true] - 값 설정 후 changeCallback을 트리거할지 여부.
     */
    setValue(value, triggerCallback = true) {
        let valueForCallback; // 콜백에 전달될 최종 값
        let valueForDisplay; // input 필드에 표시될 최종 값

        if (value === null || value === '') {
            valueForCallback = this.defaultValue;
            valueForDisplay = ''; // 필드는 blank로 표시
        } else {
            let parsedValue = parseInt(value);
            if (isNaN(parsedValue)) {
                valueForCallback = this.defaultValue;
                valueForDisplay = ''; // 필드는 blank로 표시
            } else {
                valueForCallback = Math.max(this.min, Math.min(this.max, parsedValue));
                valueForDisplay = valueForCallback; // 필드에는 제한된 값 표시
            }
        }
        
        this.inputElement.value = valueForDisplay;
        if (triggerCallback) {
            this.changeCallback(valueForCallback, this.inputElement);
        }
    }
}
