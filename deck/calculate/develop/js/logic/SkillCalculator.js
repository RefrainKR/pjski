import { SKILL_DATA } from '../data.js';

export class SkillCalculator {
    constructor(skillLevel) {
        const cardType = 'bloomFes';
        if (!SKILL_DATA[cardType] || !SKILL_DATA[cardType].after.base[skillLevel]) {
            throw new Error(`잘못된 스킬 레벨 또는 카드 데이터입니다.`);
        }
        
        const data = SKILL_DATA[cardType];
        this.afterBase = data.after.base[skillLevel];
        this.afterMax = data.after.max[skillLevel];
        this.beforeBase = data.before.base[skillLevel];
        this.beforeMax = data.before.max[skillLevel];
    }

    calculate(charRank, targetValue, options = {}) {
        const { includeDecimal = false, multiplier = null } = options;
        const results = {};

        // --- 1. 정수 기반 계산 (게임 내 실제 적용 로직) ---
        const finalAfterInt = Math.min(Math.floor(this.afterBase + Math.floor(charRank / 2)), this.afterMax);
        const finalBeforeInt = Math.min(Math.floor(this.beforeBase + Math.floor(targetValue / 2)), this.beforeMax);

        let winnerInt = 'draw';
        if (finalAfterInt > finalBeforeInt) winnerInt = 'after';
        else if (finalBeforeInt > finalAfterInt) winnerInt = 'before';

        results.integer = {
            winner: winnerInt,
            after: finalAfterInt,
            before: finalBeforeInt,
            highest: Math.max(finalAfterInt, finalBeforeInt),
            difference: finalBeforeInt - finalAfterInt,
        };
        
        if (multiplier) {
            results.integer.multiplied = {
                after: finalAfterInt * multiplier,
                before: finalBeforeInt * multiplier,
                highest: results.integer.highest * multiplier,
                difference: results.integer.difference * multiplier
            };
        }

        // --- 2. 소수점 기반 계산 (옵션) ---
        if (includeDecimal) {
            const finalAfterDecimal = Math.min(this.afterBase + (charRank / 2), this.afterMax);
            const finalBeforeDecimal = Math.min(this.beforeBase + (targetValue / 2), this.beforeMax);
            
            // --- 핵심 수정: 소수점 기준으로 승패를 다시 결정 ---
            let winnerDecimal = 'draw';
            if (finalAfterDecimal > finalBeforeDecimal) winnerDecimal = 'after';
            else if (finalBeforeDecimal > finalAfterDecimal) winnerDecimal = 'before';
            // --- 수정 끝 ---
            
            results.decimal = {
                winner: winnerDecimal, // 소수점 기준 승패 결과 반영
                after: finalAfterDecimal,
                before: finalBeforeDecimal,
                highest: Math.max(finalAfterDecimal, finalBeforeDecimal), // highest도 소수점 기준
                difference: finalBeforeDecimal - finalAfterDecimal,
            };
            
            if (multiplier) {
                results.decimal.multiplied = {
                    after: finalAfterDecimal * multiplier,
                    before: finalBeforeDecimal * multiplier,
                    highest: results.decimal.highest * multiplier,
                    difference: results.decimal.difference * multiplier
                };
            }
        }

        return results;
    }
}