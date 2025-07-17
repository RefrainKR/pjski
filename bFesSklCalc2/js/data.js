
export const CHARACTER_DATA = [
    { groupName: "Leo/Need", characters: ["이치카", "사키", "호나미", "시호"] },
    { groupName: "MORE MORE JUMP", characters: ["미노리", "하루카", "아이리", "시즈쿠"] },
    { groupName: "Vivid BAD SQUAD", characters: ["코하네", "안", "아키토", "토우야"] },
    { groupName: "원더랜즈X쇼타임", characters: ["츠카사", "에무", "네네", "루이"] },
    { groupName: "25시 나이트 코드에서.", characters: ["카나데", "마후유", "에나", "미즈키"] },
    { groupName: "VIRTUAL SINGER", characters: ["미쿠", "린", "렌", "루카", "MEIKO", "KAITO"] }
];

export const LOCAL_STORAGE_KEY = 'characterRanksData';
export const MESSAGE_DISPLAY_DURATION = 3000; // 메시지 자동 사라짐 시간 (ms)

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