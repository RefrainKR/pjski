// js/data.js

export const CHARACTER_DATA = [
    { groupName: "Leo/Need", characters: ["이치카", "사키", "호나미", "시호"] },
    { groupName: "MORE MORE JUMP", characters: ["미노리", "하루카", "아이리", "시즈쿠"] },
    { groupName: "Vivid BAD SQUAD", characters: ["코하네", "안", "아키토", "토우야"] },
    { groupName: "원더랜즈X쇼타임", characters: ["츠카사", "에무", "네네", "루이"] },
    { groupName: "25시 나이트 코드에서.", characters: ["카나데", "마후유", "에나", "미즈키"] },
    { groupName: "VIRTUAL SINGER", characters: ["미쿠", "린", "렌", "루카", "MEIKO", "KAITO"] }
];

export const LOCAL_STORAGE_KEY = 'characterRanksData';
export const SKILL_CALCULATOR_SETTINGS_KEY = 'skillCalculatorSettings';
export const MESSAGE_DISPLAY_DURATION = 3000; // 메시지 자동 사라짐 시간 (ms)

// --- Skill Calculator Input Constants ---
export const MIN_RANK_MIN = 1;
export const MAX_RANK_MIN = 90;
export const DEFAULT_RANK_MIN = 1; // blank 시 이 값으로 되돌림

export const MIN_RANK_MAX = 10;
export const MAX_RANK_MAX = 100;
export const DEFAULT_RANK_MAX = 100; // blank 시 이 값으로 되돌림

export const MIN_RANK_INCREMENT = 1;
export const MAX_RANK_INCREMENT = 10;
export const DEFAULT_RANK_INCREMENT = 1; // blank 시 이 값으로 되돌림

export const MIN_TARGET_VALUE = 10; // manual-x-input 및 자동 입력 시작값의 최소
export const MAX_TARGET_VALUE = 140; // manual-x-input 및 자동 입력 끝나는값의 최대

// 자동 입력 모달의 기본값 (이름 변경됨)
export const DEFAULT_AUTO_INPUT_START = 80;
export const DEFAULT_AUTO_INPUT_END = 140;
export const DEFAULT_AUTO_INPUT_INCREMENT = 5;

// 자동 입력 테이블 X축 생성 개수 제한 (새로 추가됨)
export const MIN_X_VALUES_COUNT = 10;
export const MAX_X_VALUES_COUNT = 30;

// blank 시 되돌릴 특정 값 (InputNumberElement의 fallbackValueOnBlank로 사용)
// null은 previousValue 또는 defaultValue로 되돌림을 의미
export const FALLBACK_RANK_INPUT_ON_BLANK = null; // rank-min, max, increment는 이전 값으로 되돌림

// 사용자 요청에 따라 변경됨: auto-input 필드들도 previousValue 로직을 따르도록 null로 설정
export const FALLBACK_AUTO_INPUT_START_ON_BLANK = null;
export const FALLBACK_AUTO_INPUT_END_ON_BLANK = null;
export const FALLBACK_AUTO_INPUT_INCREMENT_ON_BLANK = null;

export const FALLBACK_MANUAL_X_ON_BLANK = 0; // manual-x-input blank 시 0으로

export const SKILL_DATA = {
    "bloomFes": { // 카드 종류: bloomFes (camelCase)
        "after": { // 각후 스킬: after (camelCase)
            "base": { 1: 90, 2: 95, 3: 100, 4: 110 }, // base (camelCase)
            "max":  { 1: 140, 2: 145, 3: 150, 4: 160 } // max (camelCase)
        },
        "before": { // 각전 스킬: before (camelCase)
            "base": { 1: 60, 2: 65, 3: 70, 4: 80 },
            "max":  { 1: 120, 2: 130, 3: 140, 4: 150 }
        }
    },
};
