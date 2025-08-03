export const eventPointLogic = {
    /**
     * @param {Date} date - 날짜 객체
     * @param {number} hour - 설정할 시간 (예: 4)
     * @returns {Date} - 해당 날짜의 지정된 시간으로 설정된 새로운 Date 객체
     */
    _getResetTimeForDate(date, hour) {
        const resetTime = new Date(date);
        resetTime.setHours(hour, 0, 0, 0);
        return resetTime;
    },

calculate(inputs, now) {
        if (!inputs.startDate || !inputs.endDate) {
            return null;
        }

        const eventStartDate = new Date(`${inputs.startDate}T${inputs.startTime}:00:00`);
        const eventEndDate = new Date(`${inputs.endDate}T${inputs.startTime === '15' ? '20:59:59' : '19:59:59'}`);
        const timeLeftMs = eventEndDate - now;

        // --- 핵심 수정: 이벤트 종료 시 완전한 구조의 0값 객체 반환 ---
        if (timeLeftMs < 0) {
            return {
                timeLeft: { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 },
                remaining: { naturalEnergy: 0, adEnergy: 0, challengeCount: 0, mysekaiCount: 0 },
                predictions: { liveEP: 0, challengeEP: 0, mysekaiEP: 0 },
                finalEP: inputs.currentPoints
            };
        }
		
        const totalSeconds = Math.floor(timeLeftMs / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        // --- 남은 자원 계산 ---
        let remaining = { naturalEnergy: 0, adEnergy: 0, challengeCount: 0, mysekaiCount: 0 };

        // 1. 자연불 & 광고불 & 챌린지 (새벽 4시 초기화 기준)
        let cursorDate = new Date(now);
        while(cursorDate < eventEndDate) {
            const nextResetTime = this._getResetTimeForDate(cursorDate, 4);
            if (now < nextResetTime && cursorDate < nextResetTime) {
                remaining.adEnergy += 1;
                remaining.challengeCount += 1;
            }
            cursorDate.setDate(cursorDate.getDate() + 1);
        }
        remaining.naturalEnergy = Math.floor(timeLeftMs / (30 * 60 * 1000));

        // 2. 마이세카이 (새벽 5시 초기화 기준)
        cursorDate = new Date(now);
        while(cursorDate < eventEndDate) {
            const nextResetTime = this._getResetTimeForDate(cursorDate, 5);
             if (now < nextResetTime && cursorDate < nextResetTime) {
                remaining.mysekaiCount += 1;
            }
            cursorDate.setDate(cursorDate.getDate() + 1);
        }
        
        // --- EP 예측 계산 ---
        const epPerEnergy = inputs.epPer5Energy / 5;
        const predictions = {
            liveEP: (inputs.currentEnergy + inputs.extraEnergy + remaining.naturalEnergy + (remaining.adEnergy * 5)) * epPerEnergy,
            challengeEP: remaining.challengeCount * inputs.challengeLive,
            mysekaiEP: remaining.mysekaiCount * (inputs.mysekaiChoice * epPerEnergy * 10) // 1불 or 10불
        };
        
        const finalEP = inputs.currentPoints + predictions.liveEP + predictions.challengeEP + predictions.mysekaiEP;

        return {
            timeLeft: { days, hours, minutes, seconds, totalSeconds },
            remaining,
            predictions,
            finalEP
        };
    }
};