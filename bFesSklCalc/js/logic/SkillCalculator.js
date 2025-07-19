// js/logic/SkillCalculator.js

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
        
        const currentSkillData = SKILL_DATA[cardType];
        this.afterBase = currentSkillData.after.base[skillLevel];
        this.afterMax = currentSkillData.after.max[skillLevel];
        this.beforeBase = currentSkillData.before.base[skillLevel];
        this.beforeMax = currentSkillData.before.max[skillLevel];
    }

    /**
     * 특정 조건에 대한 각전/각후 스킬 값을 계산합니다.
     * @param {number} charRank - 캐릭터 랭크.
     * @param {number} targetValue - 대상 스킬 값 (%).
     * @returns {{winner: 'after'|'before'|'draw', value: number}}
     *          - winner: 어느 쪽이 더 유리한지 ('after', 'before', 'draw')
     *          - value: 더 유리한 쪽의 스킬 값
     */
    calculate(charRank, targetValue) {
        let finalAfterSkill = Math.floor(this.afterBase + Math.floor(charRank / 2));
        finalAfterSkill = Math.min(finalAfterSkill, this.afterMax);

        let finalBeforeSkill = Math.floor(this.beforeBase + (targetValue / 2));
        finalBeforeSkill = Math.min(finalBeforeSkill, this.beforeMax);

        const difference = finalBeforeSkill - finalAfterSkill;

        if (finalAfterSkill > finalBeforeSkill) {
            return { winner: 'after', highest: finalAfterSkill, difference: difference };
        } else if (finalBeforeSkill > finalAfterSkill) {
            return { winner: 'before', highest: finalBeforeSkill, difference: difference };
        } else {
            return { winner: 'draw', highest: finalAfterSkill, difference: difference };
        }
    }
}