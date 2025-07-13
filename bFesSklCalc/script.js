document.addEventListener('DOMContentLoaded', () => {
    let MIN_RANK = 1;
    let MAX_RANK = 100;

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

    const skillLevelSelect = document.getElementById('skillLevel');
    const skillTableContainer = document.getElementById('skillTableContainer');
    const characterSelect = document.getElementById('characterSelect');
    const directRankInput = document.getElementById('directRankInput');
    const directRankInputGroup = document.getElementById('directRankInputGroup');
    const skillLevelSelectContainer = document.getElementById('skillLevelSelectContainer');

    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    // IMPORTANT: '직접 입력' 모드를 위한 더미 그룹과 캐릭터 정의
    const DIRECT_INPUT_GROUP_NAME = "_DIRECT_INPUT_";
    const DIRECT_INPUT_CHAR_NAME = "_DEFAULT_";

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;

            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(targetTab).classList.add('active');

            if (targetTab === 'skillComparison') {
                populateCharacterSelect();
                updateSkillComparisonInputs();
            } else if (targetTab === 'characterRank') {
                renderCharacters();
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
                    rank: 1,
                    isActive: char.isActive
                };
            });

            if (!currentCharacterData[DIRECT_INPUT_GROUP_NAME]) {
                currentCharacterData[DIRECT_INPUT_GROUP_NAME] = {};
            }
            if (!currentCharacterData[DIRECT_INPUT_GROUP_NAME][DIRECT_INPUT_CHAR_NAME]) {
                currentCharacterData[DIRECT_INPUT_GROUP_NAME][DIRECT_INPUT_CHAR_NAME] = {
                    rank: 1, // 초기 랭크 값
                    isActive: true // 활성화 여부는 중요하지 않지만 일관성을 위해 추가
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
                saveToLocalStorage(); // 더미 데이터 추가 후 저장
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
                    // 이 경우는 initialCharactersData와 currentCharacterData 간의 불일치이므로
                    // initializeCharacterData에서 제대로 처리해야 함. 여기서는 기본값으로 렌더링.
                    if (!currentCharacterData[groupName]) {
                        currentCharacterData[groupName] = {};
                    }
                    currentCharacterData[groupName][characterName] = { rank: 1, isActive: false }; // 누락된 데이터 추가
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
                                       min="${MIN_RANK}"
                                       max="${MAX_RANK}" value="${charToRender.rank}"
                                       data-character-name="${characterName}"
                                       data-character-group="${groupName}"
                                       placeholder="랭크 (${MIN_RANK} - ${MAX_RANK})">
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
    function updateAndRenderRank(inputElement, save) {
        const charName = inputElement.dataset.characterName;
        const groupName = inputElement.dataset.characterGroup;
        let rank = parseInt(inputElement.value, 10);

        // 숫자 값 유효성 검사 및 범위 제한
        if (isNaN(rank) || rank < MIN_RANK) {
            rank = MIN_RANK;
        } else if (rank > MAX_RANK) {
            rank = MAX_RANK;
        }
        inputElement.value = rank; // 유효성 검사 후 값 업데이트 (사용자 UI에 반영)

        let isDirectInputMode = false;
        if (charName && groupName) { // 특정 캐릭터 모드
            if (currentCharacterData[groupName] && currentCharacterData[groupName][charName]) {
                if (save) {
                    currentCharacterData[groupName][charName].rank = rank;
                    saveToLocalStorage();
                }
                generateIndividualSkillComparisonTable(rank); // 테이블 갱신

                // 탭2의 해당 캐릭터 랭크 UI도 업데이트 (다른 탭에서 변경 시 동기화)
                const tab2RankInput = document.querySelector(`#characterList input[data-character-name="${charName}"][data-character-group="${groupName}"]`);
                if (tab2RankInput && tab2RankInput !== inputElement) { // 현재 입력 필드와 다른 경우에만 업데이트
                    tab2RankInput.value = rank;
                }
            }
        } else { // "직접 입력" 모드
            isDirectInputMode = true;
            if (save) {
                currentCharacterData[DIRECT_INPUT_GROUP_NAME][DIRECT_INPUT_CHAR_NAME].rank = rank;
                saveToLocalStorage();
            }
            generateIndividualSkillComparisonTable(rank); // 테이블 갱신
        }
    }


    function attachEventListenersToRankInputsAndToggles() {
        document.querySelectorAll('input[data-character-name]').forEach(input => {
            // 기존 이벤트 리스너 제거 (중복 방지)
            input.removeEventListener('focus', handleRankInputFocus);
            input.removeEventListener('blur', (e) => updateAndRenderRank(e.target, true));
            input.removeEventListener('input', (e) => updateAndRenderRank(e.target, false)); // input 시에는 저장하지 않고 테이블만 갱신

            // 새 이벤트 리스너 추가
            input.addEventListener('focus', handleRankInputFocus);   // 포커스 시 전체 선택
            input.addEventListener('blur', (e) => updateAndRenderRank(e.target, true)); // 포커스 잃었을 때 최종 유효성 검사 및 저장
            input.addEventListener('input', (e) => updateAndRenderRank(e.target, false)); // input 시 테이블만 갱신 (저장 X)
        });

        document.querySelectorAll('.toggle-switch').forEach(toggle => {
            toggle.removeEventListener('click', handleToggleClick);
            toggle.addEventListener('click', handleToggleClick);
        });
    }

    function handleRankInputFocus(event) {
        event.target.select(); // 현재 입력 필드의 텍스트 전체 선택
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
        const base = skillData.after.base[skillLv];
        const max = skillData.after.max[skillLv];
        if (!base || !max) return 0;
        let finalValue = base + Math.floor(charRank / 2);
        return Math.min(finalValue, max);
    }

    function calculateSkillBefore(skillLv, otherCharSkillVal) {
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

            if (charData && charData.isActive) { // 활성화된 캐릭터만 추가
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
        let targetCharacterRank = 1;
        let selectedCharacterGroup = '';

        // directRankInput의 dataset 초기화
        delete directRankInput.dataset.characterName;
        delete directRankInput.dataset.characterGroup;

        if (selectedOption === "all") {
            skillLevelSelectContainer.style.display = 'flex';
            directRankInputGroup.style.display = 'none';
            generateOverallSkillComparisonTable();
        } else if (selectedOption === "") { // "직접 입력" 선택
            skillLevelSelectContainer.style.display = 'none';
            directRankInputGroup.style.display = 'flex';

            // '직접 입력' 더미 데이터의 랭크를 사용
            targetCharacterRank = currentCharacterData[DIRECT_INPUT_GROUP_NAME][DIRECT_INPUT_CHAR_NAME].rank;
            directRankInput.value = Math.min(Math.max(targetCharacterRank, MIN_RANK), MAX_RANK); // 랭크 표시

            generateIndividualSkillComparisonTable(targetCharacterRank);
        } else { // 특정 캐릭터 선택
            skillLevelSelectContainer.style.display = 'none';
            directRankInputGroup.style.display = 'flex';

            for (const groupName in currentCharacterData) {
                if (currentCharacterData[groupName][selectedOption]) {
                    targetCharacterRank = currentCharacterData[groupName][selectedOption].rank;
                    selectedCharacterGroup = groupName;
                    break;
                }
            }
            directRankInput.value = Math.min(Math.max(targetCharacterRank, MIN_RANK), MAX_RANK);

            // 특정 캐릭터를 선택했을 때만 directRankInput에 데이터셋 추가
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
        for (let val = 80; val <= 140; val += 5) {
            otherSkillVals.push(val);
            tableHtml += `<th>${val}%</th>`;
        }
        tableHtml += '</tr></thead><tbody>';

        for (let rank = MIN_RANK; rank <= MAX_RANK; rank++) {
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
        for (let val = 80; val <= 140; val += 5) {
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

    // directRankInput의 이벤트 리스너 재설정 (통합 함수 사용)
    directRankInput.removeEventListener('focus', handleRankInputFocus);
    directRankInput.removeEventListener('blur', (e) => updateAndRenderRank(e.target, true));
    directRankInput.removeEventListener('input', (e) => updateAndRenderRank(e.target, false));

    directRankInput.addEventListener('focus', handleRankInputFocus); // 포커스 시 전체 선택
    directRankInput.addEventListener('blur', (e) => updateAndRenderRank(e.target, true)); // 포커스 잃었을 때 최종 유효성 검사 및 저장
    directRankInput.addEventListener('input', (e) => updateAndRenderRank(e.target, false)); // 사용자가 입력할 때 테이블 즉시 갱신 (저장 X)


    initializeCharacterData();
    populateCharacterSelect();
    updateSkillComparisonInputs();
});