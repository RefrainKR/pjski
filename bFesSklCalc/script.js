document.addEventListener('DOMContentLoaded', () => {
    // 1. 기존 상수 이름을 변수형식으로 변경
    let minRank;
    let maxRank;
    let otherSkillValMin;
    let otherSkillValMax;
    let otherSkillValIncrease;

    // 기본 설정값 (로컬 스토리지에 없을 경우 사용)
    const DEFAULT_SETTINGS = {
        minRank: 1,
        maxRank: 100, // 이 값은 `loadAndApplySettings`에서 SETTINGS_LIMITS에 따라 조정됩니다.
        otherSkillValMin: 80,
        otherSkillValMax: 140,
        otherSkillValIncrease: 5
    };

    // 설정 값별 유효 범위
    const SETTINGS_LIMITS = {
        minRank: { min: 1, max: 80 },
        maxRank: { min: 20, max: 100 },
        otherSkillValMin: { min: 40, max: 140 },
        otherSkillValMax: { min: 80, max: 140 },
        otherSkillValIncrease: { min: 5, max: 10 }
    };

    const initialCharactersData = [
        { name: "미쿠", group: "VIRTUAL_SINGER", isActive: false },
        { name: "린", group: "VIRTUAL_SINGER", isActive: false },
        { name: "렌", group: "VIRTUAL_SINGER", isActive: false },
        { name: "루카", group: "VIRTUAL_SINGER", isActive: false },
        { name: "MEIKO", group: "VIRTUAL_SINGER", isActive: false },
        { name: "KAITO", group: "VIRTUAL_SINGER", isActive: false },
        { name: "이치카", group: "Leo_Need", isActive: false },
        { name: "사키", group: "Leo_Need", isActive: false },
        { name: "호나미", group: "Leo_Need", isActive: false },
        { name: "시호", group: "Leo_Need", isActive: false },
        { name: "미노리", group: "MORE_MORE_JUMP", isActive: false },
        { name: "하루카", group: "MORE_MORE_JUMP", isActive: false },
        { name: "아이리", group: "MORE_MORE_JUMP", isActive: false },
        { name: "시즈쿠", group: "MORE_MORE_JUMP", isActive: false },
        { name: "코하네", group: "Vivid_BAD_SQUAD", isActive: false },
        { name: "안", group: "Vivid_BAD_SQUAD", isActive: false },
        { name: "아키토", group: "Vivid_BAD_SQUAD", isActive: false },
        { name: "토우야", group: "Vivid_BAD_SQUAD", isActive: false },
        { name: "츠카사", group: "원더랜즈X쇼타임", isActive: false },
        { name: "에무", group: "원더랜즈X쇼타임", isActive: false },
        { name: "네네", group: "원더랜즈X쇼타임", isActive: false },
        { name: "루이", group: "원더랜즈X쇼타임", isActive: false },
        { name: "카나데", group: "25시_나이트_코드에서.", isActive: false },
        { name: "마후유", group: "25시_나이트_코드에서.", isActive: false },
        { name: "에나", group: "25시_나이트_코드에서.", isActive: false },
        { name: "미즈키", group: "25시_나이트_코드에서.", isActive: false }
    ];

    let currentCharacterData = {};

    const groupedInitialCharacterNames = initialCharactersData.reduce((acc, char) => {
        if (!acc[char.group]) {
            acc[char.group] = [];
        }
        acc[char.group].push(char.name);
        return acc;
    }, {});

    const characterListDiv = document.getElementById('characterList');
    const saveDataBtn = document.getElementById('saveDataBtn');
    const loadDataInput = document.getElementById('loadDataInput');
    const loadDataBtn = document.getElementById('loadDataBtn');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const LOCAL_STORAGE_KEY = 'characterRanksAndActivityData';
    const SETTINGS_STORAGE_KEY = 'appSettings'; // 설정값 저장을 위한 새로운 키

    const skillLevelSelect = document.getElementById('skillLevel');
    const skillTableContainer = document.getElementById('skillTableContainer');
    const characterSelect = document.getElementById('characterSelect');
    const directRankInput = document.getElementById('directRankInput');
    const directRankInputGroup = document.getElementById('directRankInputGroup');
    const skillLevelSelectContainer = document.getElementById('skillLevelSelectContainer');

    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    // 설정 탭 관련 DOM 요소
    const minRankInput = document.getElementById('minRankInput');
    const maxRankInput = document.getElementById('maxRankInput');
    const otherSkillValMinInput = document.getElementById('otherSkillValMinInput');
    const otherSkillValMaxInput = document.getElementById('otherSkillValMaxInput');
    const otherSkillValIncreaseInput = document.getElementById('otherSkillValIncreaseInput');
    // const settingsSaveStatus = document.getElementById('settingsSaveStatus'); // 안내문 제거되므로 더 이상 사용하지 않음


    // IMPORTANT: '직접 입력' 모드를 위한 더미 그룹과 캐릭터 정의
    const DIRECT_INPUT_GROUP_NAME = "_DIRECT_INPUT_";
    const DIRECT_INPUT_CHAR_NAME = "_DEFAULT_";

    // --- 설정값 로드 및 적용 함수 ---
    function loadAndApplySettings() {
        try {
            const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
            const settings = storedSettings ? JSON.parse(storedSettings) : DEFAULT_SETTINGS;

            // 각 변수에 저장된 값 또는 기본값 할당 및 유효성 검사 적용
            minRank = validateSetting('minRank', settings.minRank);
            maxRank = validateSetting('maxRank', settings.maxRank);
            otherSkillValMin = validateSetting('otherSkillValMin', settings.otherSkillValMin);
            otherSkillValMax = validateSetting('otherSkillValMax', settings.otherSkillValMax);
            otherSkillValIncrease = validateSetting('otherSkillValIncrease', settings.otherSkillValIncrease);

            // 특별 유효성 검사: maxRank는 minRank보다 크거나 같아야 함
            if (maxRank < minRank) {
                maxRank = minRank;
            }
            // 특별 유효성 검사: otherSkillValMax는 otherSkillValMin보다 크거나 같아야 함
            if (otherSkillValMax < otherSkillValMin) {
                otherSkillValMax = otherSkillValMin;
            }

            // 설정 탭 입력 필드에 값 반영
            minRankInput.value = minRank;
            maxRankInput.value = maxRank;
            otherSkillValMinInput.value = otherSkillValMin;
            otherSkillValMaxInput.value = otherSkillValMax;
            otherSkillValIncreaseInput.value = otherSkillValIncrease;

            // 랭크 입력 필드의 min/max 속성 업데이트
            document.querySelectorAll('input[type="number"][data-character-name]').forEach(input => {
                input.min = minRank;
                input.max = maxRank;
            });
            directRankInput.min = minRank;
            directRankInput.max = maxRank;

            console.log('설정값이 로드 및 적용되었습니다:', { minRank, maxRank, otherSkillValMin, otherSkillValMax, otherSkillValIncrease });

            // 설정값 변경으로 인해 영향을 받는 UI 업데이트
            if (document.getElementById('characterRank').classList.contains('active')) {
                renderCharacters(); // 캐릭터 랭크 입력 필드의 min/max가 바뀔 수 있으므로 갱신
            }
            if (document.getElementById('skillComparison').classList.contains('active')) {
                updateSkillComparisonInputs(); // 스킬 비교 테이블이 갱신되어야 함
            }

        } catch (e) {
            console.error('설정값 로드 및 적용 실패:', e);
            // 오류 발생 시 기본값으로 강제 적용 (SETTINGS_LIMITS에 따라 조정된 값)
            minRank = validateSetting('minRank', DEFAULT_SETTINGS.minRank);
            maxRank = validateSetting('maxRank', DEFAULT_SETTINGS.maxRank);
            otherSkillValMin = validateSetting('otherSkillValMin', DEFAULT_SETTINGS.otherSkillValMin);
            otherSkillValMax = validateSetting('otherSkillValMax', DEFAULT_SETTINGS.otherSkillValMax);
            otherSkillValIncrease = validateSetting('otherSkillValIncrease', DEFAULT_SETTINGS.otherSkillValIncrease);

            if (maxRank < minRank) maxRank = minRank;
            if (otherSkillValMax < otherSkillValMin) otherSkillValMax = otherSkillValMin;

            // UI도 기본값으로 업데이트
            minRankInput.value = minRank;
            maxRankInput.value = maxRank;
            otherSkillValMinInput.value = otherSkillValMin;
            otherSkillValMaxInput.value = otherSkillValMax;
            otherSkillValIncreaseInput.value = otherSkillValIncrease;
        }
    }

    // 설정값 개별 유효성 검사 도우미 함수 (null/빈 문자열 허용)
    function validateSetting(key, value) {
        // 값이 빈 문자열이거나 null이면 그대로 반환하여 사용자가 지울 수 있도록 허용
        if (value === '' || value === null) {
            return value;
        }
        let parsedValue = parseInt(value, 10);
        const limits = SETTINGS_LIMITS[key];

        // 숫자가 아니면 default값을 반환
        if (isNaN(parsedValue)) {
            return DEFAULT_SETTINGS[key];
        }
        // 범위를 벗어나면 범위 내 값으로 강제 조정
        return Math.min(Math.max(parsedValue, limits.min), limits.max);
    }

    // --- 설정값 자동 저장 함수 (입력 필드 변경 시 호출) ---
    function saveSettingsImmediately() {
        // 현재 입력 필드의 값들을 임시로 가져옴 (아직 최종 유효성 검사 전)
        const currentInputValues = {
            minRank: minRankInput.value,
            maxRank: maxRankInput.value,
            otherSkillValMin: otherSkillValMinInput.value,
            otherSkillValMax: otherSkillValMaxInput.value,
            otherSkillValIncrease: otherSkillValIncreaseInput.value
        };

        // 각 값을 validateSetting 함수를 통해 최종 유효성 검사 및 조정
        const settingsToSave = {
            minRank: validateSetting('minRank', currentInputValues.minRank),
            maxRank: validateSetting('maxRank', currentInputValues.maxRank),
            otherSkillValMin: validateSetting('otherSkillValMin', currentInputValues.otherSkillValMin),
            otherSkillValMax: validateSetting('otherSkillValMax', currentInputValues.otherSkillValMax),
            otherSkillValIncrease: validateSetting('otherSkillValIncrease', currentInputValues.otherSkillValIncrease)
        };

        // 특별 유효성 검사: maxRank는 minRank보다 크거나 같아야 함
        if (settingsToSave.maxRank < settingsToSave.minRank) {
            settingsToSave.maxRank = settingsToSave.minRank;
        }
        // 특별 유효성 검사: otherSkillValMax는 otherSkillValMin보다 크거나 같아야 함
        if (settingsToSave.otherSkillValMax < settingsToSave.otherSkillValMin) {
            settingsToSave.otherSkillValMax = settingsToSave.otherSkillValMin;
        }

        // 유효성 검사 및 조정된 최종 값을 UI에 반영
        minRankInput.value = settingsToSave.minRank;
        maxRankInput.value = settingsToSave.maxRank;
        otherSkillValMinInput.value = settingsToSave.otherSkillValMin;
        otherSkillValMaxInput.value = settingsToSave.otherSkillValMax;
        otherSkillValIncreaseInput.value = settingsToSave.otherSkillValIncrease;

        try {
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settingsToSave));
            // "설정이 자동 저장되었습니다!" 안내 메시지 표시 제거
            console.log('설정값이 로컬 스토리지에 자동 저장되었습니다.'); // 개발자 도구 콘솔에서만 확인
            
            loadAndApplySettings(); // 저장된 값을 전역 변수에 즉시 적용하고 다른 UI 갱신
        } catch (e) {
            console.error('설정 자동 저장 실패:', e);
            // "설정 자동 저장 실패!" 안내 메시지 표시 제거
        }
    }


    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;

            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(targetTab).classList.add('active');

            // 탭 전환 시 해당 탭의 내용 갱신
            if (targetTab === 'skillComparison') {
                populateCharacterSelect();
                updateSkillComparisonInputs();
            } else if (targetTab === 'characterRank') {
                renderCharacters();
            } else if (targetTab === 'settings') {
                loadAndApplySettings(); // 설정 탭 진입 시 현재 설정값 다시 불러와 표시
            }
        });
    });


    function initializeCharacterData() {
        const loaded = loadFromLocalStorage();

        if (!loaded) {
            currentCharacterData = {};
            initialCharactersData.forEach(char => {
                if (!currentCharacterData[char.group]) {
                    currentCharacterData[char.group] = {};
                }
                currentCharacterData[char.group][char.name] = {
                    rank: 1, // 초기 랭크 값은 1로 유지
                    isActive: char.isActive
                };
            });

            if (!currentCharacterData[DIRECT_INPUT_GROUP_NAME]) {
                currentCharacterData[DIRECT_INPUT_GROUP_NAME] = {};
            }
            if (!currentCharacterData[DIRECT_INPUT_GROUP_NAME][DIRECT_INPUT_CHAR_NAME]) {
                currentCharacterData[DIRECT_INPUT_GROUP_NAME][DIRECT_INPUT_CHAR_NAME] = {
                    rank: 1, // 초기 랭크 값은 1로 유지
                    isActive: true
                };
            }
            saveToLocalStorage();
        } else {
            // 기존 데이터 로드 후에도 DIRECT_INPUT_GROUP_NAME이 없으면 추가
            if (!currentCharacterData[DIRECT_INPUT_GROUP_NAME] || !currentCharacterData[DIRECT_INPUT_GROUP_NAME][DIRECT_INPUT_CHAR_NAME]) {
                if (!currentCharacterData[DIRECT_INPUT_GROUP_NAME]) {
                    currentCharacterData[DIRECT_INPUT_GROUP_NAME] = {};
                }
                currentCharacterData[DIRECT_INPUT_GROUP_NAME][DIRECT_INPUT_CHAR_NAME] = {
                    rank: 1,
                    isActive: true
                };
                saveToLocalStorage();
            }
        }
    }

    function renderCharacters() {
        characterListDiv.innerHTML = '';
        for (const groupName in groupedInitialCharacterNames) {
            const groupDiv = document.createElement('div');
            groupDiv.classList.add('group');
            groupDiv.innerHTML = `<h2>${groupName}</h2>`;

            groupedInitialCharacterNames[groupName].forEach(characterName => {
                const charData = currentCharacterData[groupName]?.[characterName];
                if (!charData) {
                    console.warn(`캐릭터 데이터 없음: ${groupName} - ${characterName}. 기본값으로 렌더링합니다.`);
                    if (!currentCharacterData[groupName]) {
                        currentCharacterData[groupName] = {};
                    }
                    currentCharacterData[groupName][characterName] = { rank: 1, isActive: false };
                }
                const charToRender = currentCharacterData[groupName][characterName];

                const characterItem = document.createElement('div');
                characterItem.classList.add('character-item');
                characterItem.innerHTML = `
                    <span class="character-name">${characterName}</span>
                    <div class="toggle-container">
                        <span class="toggle-label">${charToRender.isActive ? '활성화' : '비활성화'}</span>
                        <div class="toggle-switch ${charToRender.isActive ? 'active' : ''}"
                             data-character-name="${characterName}"
                             data-character-group="${groupName}">
                        </div>
                        <div class="character-rank">
                            <input type="number"
                                       min="${minRank}"
                                       max="${maxRank}" value="${charToRender.rank}"
                                       data-character-name="${characterName}"
                                       data-character-group="${groupName}"
                                       placeholder="랭크 (${minRank} - ${maxRank})">
                        </div>
                    </div>
                `;
                groupDiv.appendChild(characterItem);
            });
            characterListDiv.appendChild(groupDiv);
        }
        attachEventListenersToRankInputsAndToggles();
    }

    // 랭크 입력 필드의 값을 업데이트하고 테이블을 갱신하며, 필요시 데이터를 저장하는 공통 함수
    function updateAndRenderRank(inputElement, saveChanges = false) {
        const charName = inputElement.dataset.characterName;
        const groupName = inputElement.dataset.characterGroup;
        let inputValue = inputElement.value;
        let rank;

        // 사용자가 값을 완전히 지웠을 때
        if (inputValue === '') {
            rank = ''; // 빈 문자열 허용 (UI에만)
        } else {
            rank = parseInt(inputValue, 10);
            // 숫자가 아니거나 유효 범위를 벗어나면 조정 (saveChanges가 true일 때만 강제 조정)
            if (saveChanges) {
                if (isNaN(rank) || rank < minRank) {
                    rank = minRank;
                } else if (rank > maxRank) {
                    rank = maxRank;
                }
                inputElement.value = rank; // 최종적으로 조정된 값 UI에 반영
            }
        }
        
        // input 이벤트에서는 일단 숫자로 파싱 가능한지, 유효 범위에 들어가는지만 확인하고 테이블 갱신
        // 입력 중인 상태에서는 실시간으로 값이 확정되는 것을 방지
        const currentEffectiveRank = (inputValue === '' || isNaN(rank)) ? 0 : rank; // 테이블 계산을 위한 임시 유효 랭크

        if (charName && groupName) { // 특정 캐릭터 모드
            // 실제 데이터는 saveChanges가 true일 때만 업데이트 및 저장
            if (saveChanges) {
                if (currentCharacterData[groupName] && currentCharacterData[groupName][charName]) {
                    // 데이터 저장 시에는 빈 문자열이 아닌 유효한 숫자로 저장 (NaN일 경우 minRank)
                    currentCharacterData[groupName][charName].rank = isNaN(rank) ? minRank : rank;
                    saveToLocalStorage();
                }
            }
            // 스킬 비교 탭이 현재 활성화되어 있고, 해당 캐릭터가 선택된 경우에만 갱신
            if (document.getElementById('skillComparison').classList.contains('active') && characterSelect.value === charName) {
                 // 테이블 갱신은 현재 input의 값 또는 유효한 값으로
                 generateIndividualSkillComparisonTable(currentEffectiveRank || (currentCharacterData[groupName][charName] ? currentCharacterData[groupName][charName].rank : minRank));
            }
            // 탭2의 해당 캐릭터 랭크 UI도 업데이트 (다른 탭에서 변경 시 동기화)
            const tab2RankInput = document.querySelector(`#characterList input[data-character-name="${charName}"][data-character-group="${groupName}"]`);
            if (tab2RankInput && tab2RankInput !== inputElement) {
                tab2RankInput.value = rank; // 여기서는 유효성 검사된 최종 랭크를 반영
            }
        } else { // "직접 입력" 모드
            if (saveChanges) {
                // 데이터 저장 시에는 빈 문자열이 아닌 유효한 숫자로 저장 (NaN일 경우 minRank)
                currentCharacterData[DIRECT_INPUT_GROUP_NAME][DIRECT_INPUT_CHAR_NAME].rank = isNaN(rank) ? minRank : rank;
                saveToLocalStorage();
            }
            // 스킬 비교 탭이 현재 활성화되어 있고, 직접 입력 모드인 경우에만 갱신
            if (document.getElementById('skillComparison').classList.contains('active') && characterSelect.value === "") {
                generateIndividualSkillComparisonTable(currentEffectiveRank || (currentCharacterData[DIRECT_INPUT_GROUP_NAME][DIRECT_INPUT_CHAR_NAME] ? currentCharacterData[DIRECT_INPUT_GROUP_NAME][DIRECT_INPUT_CHAR_NAME].rank : minRank));
            }
        }
    }


    function attachEventListenersToRankInputsAndToggles() {
        document.querySelectorAll('input[data-character-name]').forEach(input => {
            // 기존 이벤트 리스너 제거 (중복 방지)
            input.removeEventListener('focus', handleRankInputFocus);
            input.removeEventListener('blur', (e) => updateAndRenderRank(e.target, true)); // 포커스 잃으면 최종 저장
            input.removeEventListener('input', (e) => updateAndRenderRank(e.target, false)); // 입력 중에는 저장하지 않음

            // 새 이벤트 리스너 추가
            input.addEventListener('focus', handleRankInputFocus);   // 포커스 시 전체 선택
            input.addEventListener('blur', (e) => updateAndRenderRank(e.target, true)); // 포커스 잃었을 때 최종 유효성 검사 및 저장
            input.addEventListener('input', (e) => updateAndRenderRank(e.target, false)); // input 시에는 값 조정 없이 테이블만 갱신
        });

        document.querySelectorAll('.toggle-switch').forEach(toggle => {
            toggle.removeEventListener('click', handleToggleClick);
            toggle.addEventListener('click', handleToggleClick);
        });
    }

    function handleRankInputFocus(event) {
        event.target.select();
    }

    function handleToggleClick(event) {
        const toggle = event.target;
        const charName = toggle.dataset.characterName;
        const groupName = toggle.dataset.characterGroup;

        if (currentCharacterData[groupName] && currentCharacterData[groupName][charName]) {
            const currentIsActive = currentCharacterData[groupName][charName].isActive;
            currentCharacterData[groupName][charName].isActive = !currentIsActive;

            toggle.classList.toggle('active', !currentIsActive);
            const toggleLabel = toggle.previousElementSibling;
            toggleLabel.textContent = !currentIsActive ? '활성화' : '비활성화';

            saveToLocalStorage();
            populateCharacterSelect(); // 활성화/비활성화 목록이 바뀌었으므로 드롭다운 갱신

            // skillComparison 탭이 활성화되어 있을 경우 해당 탭의 내용을 업데이트
            if (document.getElementById('skillComparison').classList.contains('active')) {
                updateSkillComparisonInputs();
            }
        }
    }

    function saveToLocalStorage() {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentCharacterData));
            console.log('캐릭터 랭크 및 활성화 상태가 로컬 스토리지에 자동 저장되었습니다.');
        } catch (e) {
            console.error('로컬 스토리지 저장 실패:', e);
            fileNameDisplay.textContent = '로컬 스토리지 저장 실패!';
        }
    }

    function loadFromLocalStorage() {
        try {
            const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (storedData) {
                const loadedData = JSON.parse(storedData);

                const mergedData = {};
                initialCharactersData.forEach(initialChar => {
                    if (!mergedData[initialChar.group]) {
                        mergedData[initialChar.group] = {};
                    }
                    if (loadedData[initialChar.group] && loadedData[initialChar.group][initialChar.name]) {
                        mergedData[initialChar.group][initialChar.name] = loadedData[initialChar.group][initialChar.name];
                        // isActive 필드 유효성 검사 추가 (불린 타입이 아니면 초기값으로)
                        if (typeof mergedData[initialChar.group][initialChar.name].isActive !== 'boolean') {
                            mergedData[initialChar.group][initialChar.name].isActive = initialChar.isActive;
                        }
                    } else {
                        // 새로운 캐릭터 추가 또는 데이터 누락 시 초기값으로 설정
                        mergedData[initialChar.group][initialChar.name] = {
                            rank: 1,
                            isActive: initialChar.isActive
                        };
                    }
                });

                // 더미 데이터 로드 또는 초기화
                if (loadedData[DIRECT_INPUT_GROUP_NAME] && loadedData[DIRECT_INPUT_GROUP_NAME][DIRECT_INPUT_CHAR_NAME]) {
                    if (!mergedData[DIRECT_INPUT_GROUP_NAME]) {
                        mergedData[DIRECT_INPUT_GROUP_NAME] = {};
                    }
                    mergedData[DIRECT_INPUT_GROUP_NAME][DIRECT_INPUT_CHAR_NAME] = loadedData[DIRECT_INPUT_GROUP_NAME][DIRECT_INPUT_CHAR_NAME];
                } else {
                    if (!mergedData[DIRECT_INPUT_GROUP_NAME]) {
                        mergedData[DIRECT_INPUT_GROUP_NAME] = {};
                    }
                    mergedData[DIRECT_INPUT_GROUP_NAME][DIRECT_INPUT_CHAR_NAME] = { rank: 1, isActive: true };
                }

                currentCharacterData = mergedData;
                console.log('캐릭터 랭크 및 활성화 상태가 로컬 스토리지에서 자동 불러와졌습니다.');
                return true;
            }
        } catch (e) {
            console.error('로컬 스토리지 불러오기 또는 파싱 실패:', e);
            fileNameDisplay.textContent = '로컬 스토리지 불러오기 오류!';
        }
        return false;
    }

    saveDataBtn.addEventListener('click', () => {
        const dataToSave = currentCharacterData;
        const dataStr = JSON.stringify(dataToSave, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'character_data_backup.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('캐릭터 데이터가 character_data_backup.json 파일로 다운로드되었습니다.');
        fileNameDisplay.textContent = '데이터가 다운로드되었습니다!';
        setTimeout(() => fileNameDisplay.textContent = '선택된 파일 없음', 3000);
    });

    loadDataBtn.addEventListener('click', () => {
        loadDataInput.click();
    });

    loadDataInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) {
            fileNameDisplay.textContent = '선택된 파일 없음';
            return;
        }
        if (file.type !== 'application/json') {
            fileNameDisplay.textContent = '잘못된 파일 형식 (JSON만 가능)';
            return;
        }
        fileNameDisplay.textContent = `선택된 파일: ${file.name}`;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const loadedFileContent = JSON.parse(e.target.result);

                const mergedDataFromFile = {};
                initialCharactersData.forEach(initialChar => {
                    if (!mergedDataFromFile[initialChar.group]) {
                        mergedDataFromFile[initialChar.group] = {};
                    }
                    if (loadedFileContent[initialChar.group] && loadedFileContent[initialChar.group][initialChar.name]) {
                        mergedDataFromFile[initialChar.group][initialChar.name] = loadedFileContent[initialChar.group][initialChar.name];
                        if (typeof mergedDataFromFile[initialChar.group][initialChar.name].isActive !== 'boolean') {
                            mergedDataFromFile[initialChar.group][initialChar.name].isActive = initialChar.isActive;
                        }
                    } else {
                        mergedDataFromFile[initialChar.group][initialChar.name] = {
                            rank: 1,
                            isActive: initialChar.isActive
                        };
                    }
                });

                if (loadedFileContent[DIRECT_INPUT_GROUP_NAME] && loadedFileContent[DIRECT_INPUT_GROUP_NAME][DIRECT_INPUT_CHAR_NAME]) {
                    if (!mergedDataFromFile[DIRECT_INPUT_GROUP_NAME]) {
                        mergedDataFromFile[DIRECT_INPUT_GROUP_NAME] = {};
                    }
                    mergedDataFromFile[DIRECT_INPUT_GROUP_NAME][DIRECT_INPUT_CHAR_NAME] = loadedFileContent[DIRECT_INPUT_GROUP_NAME][DIRECT_INPUT_CHAR_NAME];
                } else {
                    if (!mergedDataFromFile[DIRECT_INPUT_GROUP_NAME]) {
                        mergedDataFromFile[DIRECT_INPUT_GROUP_NAME] = {};
                    }
                    mergedDataFromFile[DIRECT_INPUT_GROUP_NAME][DIRECT_INPUT_CHAR_NAME] = { rank: 1, isActive: true };
                }

                currentCharacterData = mergedDataFromFile;
                saveToLocalStorage();

                if (document.getElementById('characterRank').classList.contains('active')) {
                    renderCharacters();
                }
                populateCharacterSelect();
                updateSkillComparisonInputs();

                console.log(`캐릭터 데이터가 ${file.name} 파일에서 성공적으로 업데이트되었습니다.`);
                fileNameDisplay.textContent = `성공적으로 불러왔습니다: ${file.name}`;
                setTimeout(() => fileNameDisplay.textContent = '선택된 파일 없음', 3000);
            } catch (error) {
                console.error("JSON 파일을 파싱하는 데 오류가 발생했습니다. 파일이 손상되었거나 올바른 JSON 형식이 아닐 수 있습니다.", error);
                fileNameDisplay.textContent = 'JSON 파싱 오류!';
            }
        };
        reader.onerror = () => {
            console.error('파일을 읽는 도중 오류가 발생했습니다.');
            fileNameDisplay.textContent = '파일 읽기 오류!';
        };
        reader.readAsText(file);
    });


    const skillData = {
        after: {
            base: { 1: 90, 2: 95, 3: 100, 4: 110 },
            max: { 1: 140, 2: 145, 3: 150, 4: 160 }
        },
        before: {
            base: { 1: 60, 2: 65, 3: 70, 4: 80 },
            max: { 1: 120, 2: 130, 3: 140, 4: 150 }
        }
    };

    function calculateSkillAfter(skillLv, charRank) {
        // 계산 시에는 유효한 숫자 범위 내로 강제
        if (isNaN(charRank) || charRank < minRank) {
            charRank = minRank;
        } else if (charRank > maxRank) {
            charRank = maxRank;
        }

        const base = skillData.after.base[skillLv];
        const max = skillData.after.max[skillLv];
        if (!base || !max) return 0;
        let finalValue = base + Math.floor(charRank / 2);
        return Math.min(finalValue, max);
    }

    function calculateSkillBefore(skillLv, otherCharSkillVal) {
        // 계산 시에는 유효한 숫자 범위 내로 강제
        if (isNaN(otherCharSkillVal) || otherCharSkillVal < otherSkillValMin) {
            otherCharSkillVal = otherSkillValMin;
        } else if (otherCharSkillVal > otherSkillValMax) {
            otherCharSkillVal = otherSkillValMax;
        }

        const base = skillData.before.base[skillLv];
        const max = skillData.before.max[skillLv];
        if (!base || !max) return 0;
        let finalValue = base + Math.floor(otherCharSkillVal / 2);
        return Math.min(finalValue, max);
    }

    function populateCharacterSelect() {
        characterSelect.innerHTML = '';

        const allDisplayOption = document.createElement('option');
        allDisplayOption.value = "all";
        allDisplayOption.textContent = "전체 표시";
        characterSelect.appendChild(allDisplayOption);

        const directInputOption = document.createElement('option');
        directInputOption.value = "";
        directInputOption.textContent = "직접 입력";
        characterSelect.appendChild(directInputOption);

        const previouslySelectedValue = characterSelect.value;
        let currentSelectedCharExistsAndActive = false;

        initialCharactersData.forEach(initialChar => {
            const charData = currentCharacterData[initialChar.group]?.[initialChar.name];

            if (charData && charData.isActive) {
                if (!characterSelect.querySelector(`optgroup[label="${initialChar.group}"]`)) {
                    const optgroup = document.createElement('optgroup');
                    optgroup.label = initialChar.group;
                    characterSelect.appendChild(optgroup);
                }
                const option = document.createElement('option');
                option.value = initialChar.name;
                option.textContent = initialChar.name;
                characterSelect.querySelector(`optgroup[label="${initialChar.group}"]`).appendChild(option);

                if (previouslySelectedValue === initialChar.name) {
                    currentSelectedCharExistsAndActive = true;
                }
            }
        });

        if (previouslySelectedValue && previouslySelectedValue !== "all" && previouslySelectedValue !== "" && !currentSelectedCharExistsAndActive) {
            characterSelect.value = "all";
        } else {
            characterSelect.value = previouslySelectedValue || "all";
        }
    }

    function updateSkillComparisonInputs() {
        const selectedOption = characterSelect.value;
        let targetCharacterRank = 1; // 기본값
        let selectedCharacterGroup = '';

        delete directRankInput.dataset.characterName;
        delete directRankInput.dataset.characterGroup;

        if (selectedOption === "all") {
            skillLevelSelectContainer.style.display = 'flex';
            directRankInputGroup.style.display = 'none';
            generateOverallSkillComparisonTable();
        } else if (selectedOption === "") { // 직접 입력 모드
            skillLevelSelectContainer.style.display = 'none';
            directRankInputGroup.style.display = 'flex';

            targetCharacterRank = currentCharacterData[DIRECT_INPUT_GROUP_NAME][DIRECT_INPUT_CHAR_NAME].rank;
            directRankInput.value = targetCharacterRank; // UI에 표시
            generateIndividualSkillComparisonTable(targetCharacterRank);
        } else { // 특정 캐릭터 선택 모드
            skillLevelSelectContainer.style.display = 'none';
            directRankInputGroup.style.display = 'flex';

            for (const groupName in currentCharacterData) {
                if (currentCharacterData[groupName][selectedOption]) {
                    targetCharacterRank = currentCharacterData[groupName][selectedOption].rank;
                    selectedCharacterGroup = groupName;
                    break;
                }
            }
            directRankInput.value = targetCharacterRank; // UI에 표시

            directRankInput.dataset.characterName = selectedOption;
            directRankInput.dataset.characterGroup = selectedCharacterGroup;

            generateIndividualSkillComparisonTable(targetCharacterRank);
        }
    }

    function generateOverallSkillComparisonTable() {
        const skillLv = parseInt(skillLevelSelect.value, 10);

        if (isNaN(skillLv) || skillLv < 1 || skillLv > 4) {
            skillTableContainer.innerHTML = '<p style="color: red;">유효한 스킬 레벨을 선택하세요 (1-4).</p>';
            return;
        }

        let tableHtml = '<table class="skill-table"><thead><tr>';
        tableHtml += '<th>\\값<br>랭크\\</th>';

        const otherSkillVals = [];
        // otherSkillValMin, Max, Increase 사용
        for (let val = otherSkillValMin; val <= otherSkillValMax; val += otherSkillValIncrease) {
            otherSkillVals.push(val);
            tableHtml += `<th>${val}%</th>`;
        }
        tableHtml += '</tr></thead><tbody>';

        for (let rank = minRank; rank <= maxRank; rank++) {
            tableHtml += `<tr data-rank="${rank}"><th>${rank}</th>`;

            otherSkillVals.forEach(otherSkillVal => {
                const skillAfter = calculateSkillAfter(skillLv, rank);
                const skillBefore = calculateSkillBefore(skillLv, otherSkillVal);

                let cellValue;
                let cellClass = '';

                if (skillBefore > skillAfter) {
                    cellValue = skillBefore;
                    cellClass = 'advantage-before';
                } else if (skillAfter > skillBefore) {
                    cellValue = skillAfter;
                    cellClass = 'advantage-after';
                } else {
                    cellValue = skillBefore;
                    cellClass = 'advantage-equal';
                }
                tableHtml += `<td class="${cellClass}">${cellValue}%</td>`;
            });
            tableHtml += '</tr>';
        }
        tableHtml += '</tbody></table>';
        skillTableContainer.innerHTML = tableHtml;
    }

    function generateIndividualSkillComparisonTable(targetCharacterRank) {
        let tableHtml = '<table class="skill-table individual-table"><thead><tr>';
        tableHtml += '<th>\\값<br>레벨\\</th>';

        const otherSkillVals = [];
        // otherSkillValMin, Max, Increase 사용
        for (let val = otherSkillValMin; val <= otherSkillValMax; val += otherSkillValIncrease) {
            otherSkillVals.push(val);
            tableHtml += `<th>${val}%</th>`;
        }
        tableHtml += '</tr></thead><tbody>';

        for (let skillLv = 1; skillLv <= 4; skillLv++) {
            tableHtml += `<tr data-skill-level="${skillLv}"><th>Lv.${skillLv}</th>`;

            otherSkillVals.forEach(otherSkillVal => {
                const skillAfter = calculateSkillAfter(skillLv, targetCharacterRank);
                const skillBefore = calculateSkillBefore(skillLv, otherSkillVal);

                let cellValue;
                let cellClass = '';

                if (skillBefore > skillAfter) {
                    cellValue = skillBefore;
                    cellClass = 'advantage-before';
                } else if (skillAfter > skillBefore) {
                    cellValue = skillAfter;
                    cellClass = 'advantage-after';
                } else {
                    cellValue = skillBefore;
                    cellClass = 'advantage-equal';
                }

                tableHtml += `<td class="${cellClass}">${cellValue}%</td>`;
            });
            tableHtml += '</tr>';
        }
        tableHtml += '</tbody></table>';
        skillTableContainer.innerHTML = tableHtml;
    }

    skillLevelSelect.addEventListener('change', () => {
        if (characterSelect.value === "all") {
            generateOverallSkillComparisonTable();
        }
    });

    characterSelect.addEventListener('change', updateSkillComparisonInputs);

    // directRankInput 이벤트 리스너도 updateAndRenderRank로 통합 (blur 시 저장, input 시 테이블만 갱신)
    directRankInput.removeEventListener('focus', handleRankInputFocus);
    directRankInput.removeEventListener('blur', (e) => updateAndRenderRank(e.target, true));
    directRankInput.removeEventListener('input', (e) => updateAndRenderRank(e.target, false));

    directRankInput.addEventListener('focus', handleRankInputFocus);
    directRankInput.addEventListener('blur', (e) => updateAndRenderRank(e.target, true));
    directRankInput.addEventListener('input', (e) => updateAndRenderRank(e.target, false));

    // 설정 입력 필드에 'blur' 이벤트 리스너 추가하여 자동 저장
    minRankInput.addEventListener('blur', saveSettingsImmediately);
    maxRankInput.addEventListener('blur', saveSettingsImmediately);
    otherSkillValMinInput.addEventListener('blur', saveSettingsImmediately);
    otherSkillValMaxInput.addEventListener('blur', saveSettingsImmediately);
    otherSkillValIncreaseInput.addEventListener('blur', saveSettingsImmediately);


    // 초기화 순서 변경: 설정 먼저 로드 후 캐릭터 데이터 초기화
    loadAndApplySettings(); // DOMContentLoaded 시점에 설정 로드 및 적용
    initializeCharacterData(); // 캐릭터 데이터 초기화

    // 초기 탭 활성화 로직
    const initialActiveTabButton = document.querySelector('.tab-button.active');
    if (initialActiveTabButton) {
        initialActiveTabButton.click(); // 활성화된 탭에 맞춰 내용 갱신
    } else {
        // 기본으로 'characterRank' 탭을 활성화
        document.querySelector('.tab-button[data-tab="characterRank"]').click();
    }
});