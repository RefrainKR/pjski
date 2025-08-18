
export const eventPointModel = {
    calculate(inputs, now) {
        if (!inputs.startDate || !inputs.endDate) return null;

        const eventStartDate = new Date(`${inputs.startDate}T${inputs.startTime}:00:00`);
        const eventEndDate = new Date(`${inputs.endDate}T${inputs.startTime === '15' ? '20:59:59' : '19:59:59'}`);
        const timeLeftMs = eventEndDate - now;

        if (timeLeftMs < 0) {
            const remainingEP = Math.max(0, inputs.targetEP - inputs.currentEP);
            return {
                timeLeft: { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 },
                remaining: { naturalEnergy: 0, adEnergy: 0, challengeCount: 0, mysekaiCount: 0 },
                predictions: { 
                    liveEP: 0, 
                    challengeEP: 0, 
                    mysekaiEP: 0,
                    achievableEP: 0, // << 추가
                    remainingEP: remainingEP, // << 추가
                    neededEnergy: inputs.epPer5Energy > 0 ? Math.ceil(remainingEP / (inputs.epPer5Energy / 5)) : 0 // << 추가
                },
                finalEP: inputs.currentEP
            };
        }
		
        const totalSeconds = Math.floor(timeLeftMs / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        // --- 남은 자원 계산 ---
        let remaining = { naturalEnergy: 0, adEnergy: 0, challengeCount: 0, mysekaiCount: 0 };

        // 1. 광고불 & 챌린지 (새벽 4시 초기화 기준)
        const challengeResetHour = 4;
        const nowForChallenge = new Date(now.getTime() - challengeResetHour * 3600 * 1000);
        const endForChallenge = new Date(eventEndDate.getTime() - challengeResetHour * 3600 * 1000);
        const todayForChallenge = new Date(nowForChallenge);
        todayForChallenge.setHours(0, 0, 0, 0);

            // "오늘 몫"을 먼저 결정, 오늘 광고는 항상 소모되었다고 가정
        const todayChallengeCount = inputs.challengeToggle ? 1 : 0;

            // "내일 이후" 몫 계산
        let futureAdCount = 0;
        let futureChallengeCount = 0;
        const diffTimeChallenge = endForChallenge.getTime() - todayForChallenge.getTime();
        if (diffTimeChallenge > 0) {
            const diffDays = Math.floor(diffTimeChallenge / (1000 * 3600 * 24));
            futureAdCount = diffDays;
            futureChallengeCount = diffDays;
        }

        remaining.adEnergy = futureAdCount * 10;
        remaining.challengeCount = todayChallengeCount + futureChallengeCount;

        // 2. 마이세카이 (새벽 5시 초기화 기준)
        const mysekaiResetHour = 5;
        const nowForMysekai = new Date(now.getTime() - mysekaiResetHour * 3600 * 1000);
        const endForMysekai = new Date(eventEndDate.getTime() - mysekaiResetHour * 3600 * 1000);
        const todayForMysekai = new Date(nowForMysekai);
        todayForMysekai.setHours(0, 0, 0, 0);

        const todayMysekaiCount = inputs.mysekaiToggle ? 1 : 0;
        let futureMysekaiCount = 0;
        const diffTimeMysekai = endForMysekai.getTime() - todayForMysekai.getTime();
        if (diffTimeMysekai > 0) {
            futureMysekaiCount = Math.floor(diffTimeMysekai / (1000 * 3600 * 24));
        }
        remaining.mysekaiCount = todayMysekaiCount + futureMysekaiCount;

        // 3. 자연불
        remaining.naturalEnergy = Math.floor(timeLeftMs / (30 * 60 * 1000));

        // --- EP 예측 계산 ---
        const epPerEnergy = inputs.epPer5Energy > 0 ? inputs.epPer5Energy / 5 : 0;
        const totalEnergyFromResources = inputs.currentEnergy + inputs.extraEnergy + remaining.naturalEnergy + (remaining.adEnergy);
                                     
        const predictions = {
            liveEP: Math.max(0, totalEnergyFromResources) * epPerEnergy,
            challengeEP: remaining.challengeCount * inputs.challengeLive,
            mysekaiEP: inputs.mysekaiToggle ? remaining.mysekaiCount * inputs.mysekaiEpValue : 0
        };

        const achievableEP = predictions.liveEP + predictions.challengeEP + predictions.mysekaiEP;
        const finalEP = inputs.currentEP + achievableEP;
        const remainingEP = Math.max(0, inputs.targetEP - finalEP);
        const neededEnergy = epPerEnergy > 0 ? Math.ceil(Math.max(0, inputs.targetEP - finalEP) / epPerEnergy) : 0;

        return {
            timeLeft: { days, hours, minutes, seconds, totalSeconds },
            remaining,
            predictions: {
                ...predictions,
                achievableEP,
                remainingEP,
                neededEnergy
            },
            finalEP
        };
    }
};