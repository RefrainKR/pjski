
import { BloomFesSkill } from '/lib/projectSekai/skill/BloomFesSkill.js';

/**
 * 게임 규칙 계산 결과를 분석하고 조합하여,
 * UI 컴포넌트가 사용하기 좋은 최종 데이터를 생성하는 Factory 클래스입니다.
 */
export class SkillDataFactory {
    constructor(skillLevel) {
        this.bloomFesSkill = new BloomFesSkill(skillLevel);
    }

    /**
     * 두 개의 스킬 값을 받아 비교하고 분석하는 헬퍼 메서드입니다.
     * @param {Object} values - { after: number, before: number } 형태의 객체.
     * @returns {Object} - { winner, highest, difference } 분석 결과.
     */
    _analyze(values) {
        const { after, before } = values;
        let winner = 'draw';
        if (after > before) winner = 'after';
        else if (before > after) winner = 'before';
        return { winner, highest: Math.max(after, before), difference: before - after };
    }

    calculate(charRank, targetValue, options = {}) {
        const { includeDecimal = false, multiplier = null } = options;
        const results = {};

        // 1. 정수 계산 및 분석
        const intValues = this.bloomFesSkill.calculateInteger(charRank, targetValue);
        const intAnalysis = this._analyze(intValues);
        results.integer = { ...intValues, ...intAnalysis };

        if (multiplier) {
            results.integer.multiplied = {
                highest: intAnalysis.highest * multiplier,
                difference: intAnalysis.difference * multiplier
            };
        }

        // 2. 소수점 계산 및 분석 (옵션)
        if (includeDecimal) {
            const decValues = this.bloomFesSkill.calculateDecimal(charRank, targetValue);
            const decAnalysis = this._analyze(decValues);
            results.decimal = { ...decValues, ...decAnalysis };

            if (multiplier) {
                results.decimal.multiplied = {
                    highest: decAnalysis.highest * multiplier,
                    difference: decAnalysis.difference * multiplier
                };
            }
        }

        return results;
    }
}