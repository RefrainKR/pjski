document.addEventListener('DOMContentLoaded', () => {
    // 1. 캐릭터 데이터 정의 (isActive 속성은 유지, 순서가 중요)
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

    // 현재 관리되는 캐릭터 데이터 (랭크 및 활성화 상태 포함)
    let currentCharacterData = {}; // { groupName: { charName: { rank: X, isActive: true/false }, ... }, ... }

    // initialCharactersData의 순서를 유지하기 위한 맵
    // { groupName: [char1_name, char2_name, ...], ... }
    const groupedInitialCharacterNames = initialCharactersData.reduce((acc, char) => {
        if (!acc[char.group]) {
            acc[char.group] = [];
        }
        acc[char.group].push(char.name);
        return acc;
    }, {});


    // 탭 1 (캐릭터 랭크) 관련 요소
    const characterListDiv = document.getElementById('characterList');
    const saveDataBtn = document.getElementById('saveDataBtn');
    const loadDataInput = document.getElementById('loadDataInput');
    const loadDataBtn = document.getElementById('loadDataBtn');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const LOCAL_STORAGE_KEY = 'characterRanksAndActivityData';

    // 탭 2 (스킬 비교) 관련 요소
    const skillLevelSelect = document.getElementById('skillLevel');
    const skillTableContainer = document.getElementById('skillTableContainer');
    const characterSelect = document.getElementById('characterSelect');
    const directRankInput = document.getElementById('directRankInput');
    const directRankInputGroup = document.getElementById('directRankInputGroup');

    // 공통 탭 관련 요소
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    // --- 탭 기능 구현 시작 ---
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;

            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(targetTab).classList.add('active');

            // 스킬 비교 탭이 활성화될 때 자동으로 테이블 생성/업데이트
            if (targetTab === 'skillComparison') {
                populateCharacterSelect(); // 활성화된 캐릭터만 다시 로드
                updateSkillComparisonInputs();
                generateSkillComparisonTable();
            } else if (targetTab === 'characterRank') {
                renderCharacters(); // 랭크 탭으로 돌아오면 캐릭터 리스트를 다시 렌더링
            }
        });
    });
    // --- 탭 기능 구현 끝 ---


    // --- 탭 1: 캐릭터 랭크 기능 (토글 기능 추가 및 데이터 관리 변경) ---

    // currentCharacterData 초기화 및 렌더링
    function initializeCharacterData() {
        // 기존 로컬 스토리지에서 데이터 로드 시도
        const loaded = loadFromLocalStorage();

        if (!loaded) {
            // 로컬 스토리지에 데이터가 없으면 initialCharactersData로 초기화
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
            saveToLocalStorage(); // 초기화된 데이터 저장
        }
        renderCharacters(); // UI 렌더링
    }


    function renderCharacters() {
        characterListDiv.innerHTML = '';
        // groupedInitialCharacterNames의 순서대로 그룹을 순회
        for (const groupName in groupedInitialCharacterNames) {
            const groupDiv = document.createElement('div');
            groupDiv.classList.add('group');
            groupDiv.innerHTML = `<h2>${groupName}</h2>`;

            // 해당 그룹의 initialCharactersData에 정의된 캐릭터 이름 순서대로 순회
            groupedInitialCharacterNames[groupName].forEach(characterName => {
                const charData = currentCharacterData[groupName][characterName]; // currentCharacterData에서 실제 데이터 가져옴
                // charData가 없을 경우 (예외 상황) 기본값으로 처리
                if (!charData) {
                    console.warn(`캐릭터 데이터 없음: ${groupName} - ${characterName}. 기본값으로 렌더링합니다.`);
                    charData = { rank: 1, isActive: false };
                }

                const characterItem = document.createElement('div');
                characterItem.classList.add('character-item');
                characterItem.innerHTML = `
                    <span class="character-name">${characterName}</span>
                    <div class="toggle-container">
                        <span class="toggle-label">${charData.isActive ? '활성화' : '비활성화'}</span>
                        <div class="toggle-switch ${charData.isActive ? 'active' : ''}"
                             data-character-name="${characterName}"
                             data-character-group="${groupName}">
                        </div>
                        <div class="character-rank">
                            <input type="number"
                                   min="1"
                                   max="200"
                                   value="${charData.rank}"
                                   data-character-name="${characterName}"
                                   data-character-group="${groupName}"
                                   placeholder="랭크 (1-200)">
                        </div>
                    </div>
                `;
                groupDiv.appendChild(characterItem);
            });
            characterListDiv.appendChild(groupDiv);
        }
        attachEventListenersToRankInputsAndToggles();
    }

    function attachEventListenersToRankInputsAndToggles() {
        document.querySelectorAll('input[data-character-name]').forEach(input => {
            input.removeEventListener('input', handleRankInput);
            input.addEventListener('input', handleRankInput);
        });

        document.querySelectorAll('.toggle-switch').forEach(toggle => {
            toggle.removeEventListener('click', handleToggleClick);
            toggle.addEventListener('click', handleToggleClick);
        });
    }

    function handleRankInput(event) {
        const input = event.target;
        const charName = input.dataset.characterName;
        const groupName = input.dataset.characterGroup;
        let rank = parseInt(input.value, 10);

        if (isNaN(rank) || rank < 1) {
            rank = 1;
        } else if (rank > 200) {
            rank = 200;
        }
        input.value = rank;

        if (currentCharacterData[groupName] && currentCharacterData[groupName][charName]) {
            currentCharacterData[groupName][charName].rank = rank;
            saveToLocalStorage();
        }
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
            populateCharacterSelect();
            updateSkillComparisonInputs();
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
                        if (typeof mergedData[initialChar.group][initialChar.name].isActive !== 'boolean') {
                             mergedData[initialChar.group][initialChar.name].isActive = initialChar.isActive;
                        }
                    } else {
                        mergedData[initialChar.group][initialChar.name] = {
                            rank: 1,
                            isActive: initialChar.isActive
                        };
                    }
                });
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

    // --- 탭 1: 캐릭터 랭크 기능 끝 ---


    // --- 탭 2: 스킬 값 비교 기능 시작 ---

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

    // 캐릭터 선택 드롭다운 채우기 (활성화된 캐릭터만, 순서 유지)
    function populateCharacterSelect() {
        characterSelect.innerHTML = '';

        const directInputOption = document.createElement('option');
        directInputOption.value = "";
        directInputOption.textContent = "직접 입력";
        characterSelect.appendChild(directInputOption);

        // initialCharactersData에 정의된 그룹 순서대로 순회
        initialCharactersData.forEach(initialChar => {
            // 그룹이 아직 처리되지 않았다면 optgroup 생성
            if (!characterSelect.querySelector(`optgroup[label="${initialChar.group}"]`)) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = initialChar.group;
                characterSelect.appendChild(optgroup);
            }

            // 해당 캐릭터가 활성화되어 있다면 option 추가
            const charData = currentCharacterData[initialChar.group][initialChar.name];
            if (charData && charData.isActive) {
                const option = document.createElement('option');
                option.value = initialChar.name;
                option.textContent = initialChar.name;
                characterSelect.querySelector(`optgroup[label="${initialChar.group}"]`).appendChild(option);
            }
        });

        const currentSelectedChar = characterSelect.value;
        let isCurrentSelectedCharActive = false;
        if (currentSelectedChar !== "") {
            for (const groupName in currentCharacterData) {
                if (currentCharacterData[groupName][currentSelectedChar] && currentCharacterData[groupName][currentSelectedChar].isActive) {
                    isCurrentSelectedCharActive = true;
                    break;
                }
            }
        }
        if (!isCurrentSelectedCharActive && currentSelectedChar !== "") {
            characterSelect.value = "";
        }
    }

    function updateSkillComparisonInputs() {
        const selectedCharacterName = characterSelect.value;
        let foundRank = 1;

        if (selectedCharacterName === "") {
            directRankInputGroup.style.display = 'block';
        } else {
            directRankInputGroup.style.display = 'none';
            for (const groupName in currentCharacterData) {
                if (currentCharacterData[groupName][selectedCharacterName]) {
                    foundRank = currentCharacterData[groupName][selectedCharacterName].rank;
                    break;
                }
            }
            directRankInput.value = Math.min(Math.max(foundRank, 1), 140);
        }
        generateSkillComparisonTable();
    }


    function generateSkillComparisonTable() {
        const skillLv = parseInt(skillLevelSelect.value, 10);
        const targetRank = parseInt(directRankInput.value, 10);

        if (isNaN(skillLv) || skillLv < 1 || skillLv > 4) {
            skillTableContainer.innerHTML = '<p style="color: red;">유효한 스킬 레벨을 선택하세요 (1-4).</p>';
            return;
        }

        let tableHtml = '<table class="skill-table"><thead><tr>';
        tableHtml += '<th>\\스킬값<br>랭크\\</th>';

        const otherSkillVals = [];
        for (let val = 80; val <= 140; val += 5) {
            otherSkillVals.push(val);
            tableHtml += `<th>${val}%</th>`;
        }
        tableHtml += '</tr></thead><tbody>';

        const startRank = 1;
        const endRank = 140;

        for (let rank = startRank; rank <= endRank; rank++) {
            const rowClass = (rank === targetRank) ? 'highlight-row' : '';
            tableHtml += `<tr data-rank="${rank}" class="${rowClass}"><th>${rank}</th>`;

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

        scrollToRank(targetRank);
    }

    function scrollToRank(rankToScroll) {
        const row = skillTableContainer.querySelector(`tr[data-rank="${rankToScroll}"]`);
        if (row) {
            const containerHeight = skillTableContainer.clientHeight;
            const rowOffsetTop = row.offsetTop;
            const rowHeight = row.offsetHeight;
            skillTableContainer.scrollTop = rowOffsetTop - (containerHeight / 2) + (rowHeight / 2);
        }
    }


    skillLevelSelect.addEventListener('change', generateSkillComparisonTable);
    characterSelect.addEventListener('change', updateSkillComparisonInputs);
    directRankInput.addEventListener('input', updateSkillComparisonInputs);

    // 페이지 로드 시 초기화:
    initializeCharacterData();

    populateCharacterSelect();
    updateSkillComparisonInputs();
});