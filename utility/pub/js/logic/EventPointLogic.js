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

        // 이벤트가 종료되었을 경우, 모든 값을 0으로 채운 완전한 객체 반환
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
        const today = new Date(now);
        today.setHours(0, 0, 0, 0); // 오늘 날짜의 자정으로 설정

        
        // 오늘부터 이벤트 종료일까지 하루씩 순회
        for (let d = new Date(today); d <= eventEndDate; d.setDate(d.getDate() + 1)) {
            // 1. 광고불 & 챌린지 (새벽 4시 초기화 기준)
            const resetTime4Clock = this._getResetTimeForDate(d, 4);
            if (now < resetTime4Clock) {
                remaining.adEnergy += 10; // 광고 2회 x 5불
                remaining.challengeCount += 1;
            }

            // 2. 마이세카이 (새벽 5시 초기화 기준)
            const resetTime5Clock = this._getResetTimeForDate(d, 5);
            if (now < resetTime5Clock) {
                remaining.mysekaiCount += 1;
            }
        }

        // 3. 자연불
        remaining.naturalEnergy = Math.floor(timeLeftMs / (30 * 60 * 1000));
        
        // --- EP 예측 계산 ---
        const epPerEnergy = inputs.epPer5Energy > 0 ? inputs.epPer5Energy / 5 : 0;
    
        const totalEnergyForLive = inputs.currentEnergy 
                                 + inputs.extraEnergy 
                                 + remaining.naturalEnergy 
                                 + remaining.adEnergy;
                                 
        const predictions = {
            liveEP: Math.max(0, totalEnergyForLive) * epPerEnergy,
            challengeEP: remaining.challengeCount * inputs.challengeLive,
            mysekaiEP: inputs.mysekaiToggle ? remaining.mysekaiCount * inputs.mysekaiEpValue : 0
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