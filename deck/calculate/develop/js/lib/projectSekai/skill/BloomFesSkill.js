
import { SKILL_DATA } from '../data/skillData.js';

export class BloomFesSkill {
    constructor(skillLevel) {
        const cardData = SKILL_DATA.bloomFes;
        if (!cardData || !cardData.after.base[skillLevel]) {
            throw new Error(`'bloomFes' 카드에 대한 잘못된 스킬 레벨입니다.`);
        }
        
        this.afterBase = cardData.after.base[skillLevel];
        this.afterMax = cardData.after.max[skillLevel];
        this.beforeBase = cardData.before.base[skillLevel];
        this.beforeMax = cardData.before.max[skillLevel];
    }

    /**
     * 정수(게임 로직) 기반 스킬 값을 계산하여 반환합니다.
     * @param {number} charRank - 캐릭터 랭크.
     * @param {number} targetValue - 대상 스킬 값 (%).
     * @returns {{after: number, before: number}} 계산된 각후/각전 스킬 값.
     */
    calculateInteger(charRank, targetValue) {
        const after = Math.min(Math.floor(this.afterBase + Math.floor(charRank / 2)), this.afterMax);
        const before = Math.min(Math.floor(this.beforeBase + Math.floor(targetValue / 2)), this.beforeMax);
        return { after, before };
    }

    /**
     * 소수점 기반 스킬 값을 계산하여 반환합니다.
     * @param {number} charRank - 캐릭터 랭크.
     * @param {number} targetValue - 대상 스킬 값 (%).
     * @returns {{after: number, before: number}} 계산된 각후/각전 스킬 값.
     */
    calculateDecimal(charRank, targetValue) {
        const after = Math.min(this.afterBase + (charRank / 2), this.afterMax);
        const before = Math.min(this.beforeBase + (targetValue / 2), this.beforeMax);
        return { after, before };
    }
}