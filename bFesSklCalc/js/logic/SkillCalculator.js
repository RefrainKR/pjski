import { SKILL_DATA } from '../data.js';

/**
 * 스킬 효율 계산 로직만을 전담하는 순수 계산기 클래스입니다.
 * DOM 조작이나 UI 상태에 대해서는 알지 못합니다.
 */
export class SkillCalculator {
    /**
     * @param {number} skillLevel - 계산에 사용할 스킬 레벨 (1-4).
     */
    constructor(skillLevel) {
        const cardType = 'bloomFes'; // 현재는 블룸 페스만 지원
        if (!SKILL_DATA[cardType] || !SKILL_DATA[cardType].after.base[skillLevel]) {
            throw new Error(`잘못된 스킬 레벨 또는 카드 데이터입니다.`);
        }
        
        const data = SKILL_DATA[cardType];
        this.afterBase = data.after.base[skillLevel];
        this.afterMax = data.after.max[skillLevel];
        this.beforeBase = data.before.base[skillLevel];
        this.beforeMax = data.before.max[skillLevel];
    }

    /**
     * 스킬 효율을 계산하고 구조화된 데이터 객체를 반환합니다.
     * @param {number} charRank - 캐릭터 랭크.
     * @param {number} targetValue - 대상 스킬 값 (%).
     * @param {Object} [options={}] - 계산 옵션.
     * @param {boolean} [options.includeDecimal=false] - 결과에 소수점 계산을 포함할지 여부.
     * @param {number|null} [options.multiplier=null] - 적용할 배율 (예: 0.2).
     * @returns {Object} 계산된 스킬 데이터 객체.
     */
    calculate(charRank, targetValue, options = {}) {
        const { includeDecimal = false, multiplier = null } = options;
        const results = {};

        // --- 1. 정수 기반 계산 (게임 내 실제 적용 로직) ---
        const finalAfterInt = Math.min(Math.floor(this.afterBase + Math.floor(charRank / 2)), this.afterMax);
        const finalBeforeInt = Math.min(Math.floor(this.beforeBase + Math.floor(targetValue / 2)), this.beforeMax);

        let winner = 'draw';
        if (finalAfterInt > finalBeforeInt) winner = 'after';
        else if (finalBeforeInt > finalAfterInt) winner = 'before';

        // 정수 결과 객체 생성
        results.integer = {
            winner: winner,
            after: finalAfterInt,
            before: finalBeforeInt,
            highest: Math.max(finalAfterInt, finalBeforeInt),
            difference: finalBeforeInt - finalAfterInt,
        };
        
        // 정수 결과에 대한 배율 계산 (옵션)
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
            
            // 소수점 결과 객체 생성
            results.decimal = {
                winner: winner, // 승패 여부는 항상 정수 기준을 따름
                after: finalAfterDecimal,
                before: finalBeforeDecimal,
                highest: winner === 'after' ? finalAfterDecimal : finalBeforeDecimal,
                difference: finalBeforeDecimal - finalAfterDecimal,
            };
            
            // 소수점 결과에 대한 배율 계산 (옵션)
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