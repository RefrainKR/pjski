
export const MESSAGE_DISPLAY_DURATION = 3000; // 메시지 자동 사라짐 시간 (ms)

// --- Rank Panel --- //
export const CHARACTER_RANKS_KEY = 'characterRanksData';

export const MIN_RANK = 1;
export const MAX_RANK = 100;
export const DEFAULT_RANK = 1;

// --- Skill Comparison --- //
export const SKILL_COMPARISON_SETTINGS_KEY  = 'skillComparisonSettings';
export const AUTO_INPUT_SETTINGS_KEY = 'autoInputSettings';

export const DEFAULT_SKILL_COMPARISON_SETTINGS = {
    byRank: {
        skillLevel: '1',
        rankMin: '1',
        rankMax: '100',
        rankIncrement: '1',
        targetXValues: []
    },
    bySkillLevel: {
        targetXValues: []
    }
};
export const DEFAULT_AUTO_INPUT_SETTINGS = {
    start: 80,
    end: 140,
    increment: 5
};

export const MIN_RANK_MIN = 1;
export const MAX_RANK_MIN = 80;

export const MIN_RANK_MAX = 60;
export const MAX_RANK_MAX = 100;

export const INCREMENT_MIN_RANK = 1;
export const INCREMENT_MAX_RANK = 10;
export const INCREMENT_DEFAULT_RANK = 1; // blank 시 이 값으로 되돌림

export const MIN_TARGET_VALUE = 0;
export const MAX_TARGET_VALUE = 140;

// 자동 입력 모달의 기본값 (이름 변경됨)
export const MIN_AUTO_INPUT = 0;
export const MAX_AUTO_INPUT = 140;
export const MIN_AUTO_INPUT_INCREMENT = 1;
export const MAX_AUTO_INPUT_INCREMENT = 20;

// 자동 입력 테이블 X축 생성 개수 제한 (새로 추가됨)
export const MIN_X_VALUES_COUNT = 5;
export const MAX_X_VALUES_COUNT = 20;

// blank 시 되돌릴 특정 값 (InputNumberElement의 fallbackValueOnBlank로 사용)
// null은 previousValue 또는 defaultValue로 되돌림을 의미
export const FALLBACK_RANK_INPUT_ON_BLANK = null; // rank-min, max, increment는 이전 값으로 되돌림

// --- Event Point ---\
export const EP_SETTINGS_KEY = 'eventPointSettings';
export const DEFAULT_EP_SETTINGS = {
    natureEnergy: {
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date().toISOString().slice(0, 10),
        startTime: '15',
        currentEp: 0,
        targetEp: 0,
        currentEnergy: 0,
        extraEnergy: 0,
        per5Ep: 0,
        challengeLiveEp: 0,
        challengeToggle: true,
        mysekaiEp: 0,
        mysekaiToggle: true
    }, 
    eventRun: {}
};