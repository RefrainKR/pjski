// js/components/CharacterRankManager.js

import { CHARACTER_DATA, LOCAL_STORAGE_KEY } from '../data.js';
import { InputNumberElement } from '../utils/InputNumberElement.js';

export class CharacterRankManager {
    /**
     * @param {string} initialContainerId - 캐릭터 랭크를 표시할 주 HTML 컨테이너의 ID (예: 'character-ranks-content' 또는 'character-ranks-tab-content').
     * @param {Function} messageDisplayCallback - 메시지를 표시하기 위한 콜백 함수.
     */
    constructor(initialContainerId, messageDisplayCallback) {
        this.initialContainerId = initialContainerId; 
        this.messageDisplayCallback = messageDisplayCallback;
        this.characterRanks = this.loadCharacterRanks();
        this.inputElements = {}; 
    }

    loadCharacterRanks() {
        // 1. CHARACTER_DATA에 있는 모든 캐릭터에 대해 기본 랭크(1)와 비활성화(active: false) 상태로 초기화
        const allCharactersDefaultRanks = {};
        CHARACTER_DATA.forEach(group => {
            group.characters.forEach(charName => {
                allCharactersDefaultRanks[charName] = { rank: 1, active: false }; // 요청에 따라 초기값 '비활성화'로 변경
            });
        });

        // 2. LocalStorage에서 저장된 데이터 불러오기
        const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedData) {
            try {
                const parsedStoredData = JSON.parse(storedData);
                // 3. 불러온 데이터를 기본값 위에 병합 (덮어쓰기)
                if (typeof parsedStoredData === 'object' && parsedStoredData !== null) {
                    for (const charName in parsedStoredData) {
                        // CHARACTER_DATA에 존재하는 캐릭터에 대해서만 병합
                        if (allCharactersDefaultRanks.hasOwnProperty(charName)) {
                            const storedCharData = parsedStoredData[charName];
                            
                            // 랭크 값 유효성 검사 및 범위 제한 (1-100)
                            const storedRank = parseInt(storedCharData.rank);
                            allCharactersDefaultRanks[charName].rank = isNaN(storedRank) ? 1 : Math.max(1, Math.min(100, storedRank));
                            
                            // 활성화 상태 유효성 검사 (boolean 타입 확인)
                            allCharactersDefaultRanks[charName].active = typeof storedCharData.active === 'boolean' ? storedCharData.active : false;
                        }
                    }
                }
            } catch (e) {
                console.error("Error parsing character ranks from LocalStorage, resetting data:", e);
                localStorage.removeItem(LOCAL_STORAGE_KEY); // 데이터 손상 시 LocalStorage에서 제거
                // 이 경우 allCharactersDefaultRanks (위에서 초기화된 기본값)가 반환됩니다.
            }
        }
        return allCharactersDefaultRanks;
    }

    saveCharacterRanks() {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.characterRanks));
        this.messageDisplayCallback('캐릭터 랭크가 저장되었습니다.', 'success');
    }

    /**
     * 캐릭터 랭크 UI를 지정된 컨테이너에 렌더링합니다.
     * @param {string} [targetContainerId=this.initialContainerId] - 렌더링할 HTML 컨테이너의 ID.
     * 지정되지 않으면 생성자에서 받은 ID를 사용합니다.
     */
    renderCharacterRanks(targetContainerId = this.initialContainerId) {
        this.container = document.getElementById(targetContainerId);
        if (!this.container) {
            console.error(`CharacterRankManager: Target container with ID '${targetContainerId}' not found for rendering.`);
            return;
        }

        this.container.innerHTML = ''; // 기존 내용 비우기
        this.inputElements = {}; // 기존 InputNumberElement 인스턴스 초기화

        CHARACTER_DATA.forEach(group => {
            const groupSection = document.createElement('div');
            groupSection.className = 'group-section';
            groupSection.innerHTML = `<h3>${group.groupName}</h3>`;

            const characterGrid = document.createElement('div');
            characterGrid.className = 'character-grid';

            group.characters.forEach(charName => {
                // this.characterRanks[charName]는 loadCharacterRanks에 의해 항상 존재함
                const charData = this.characterRanks[charName]; 
                const characterItem = document.createElement('div');
                characterItem.className = 'character-item';

                characterItem.innerHTML = `
                    <label>${charName}</label>
                    <div class="character-controls">
                        <div class="toggle-wrapper">
                            <label class="toggle-switch">
                                <input type="checkbox" 
                                       id="toggle-${charName}" 
                                       data-char-name="${charName}" 
                                       ${charData.active ? 'checked' : ''}>
                                <span class="slider"></span>
                            </label>
                        </div>
                        <input type="number" 
                               id="rank-${charName}" 
                               value="${charData.rank}" 
                               min="1" max="100" 
                               data-char-name="${charName}">
                    </div>
                `; // input type="number"와 toggle-wrapper 순서 변경
                characterGrid.appendChild(characterItem);
            });
            groupSection.appendChild(characterGrid);
            this.container.appendChild(groupSection);
        });

        this.bindCharacterInputEvents();
    }

    bindCharacterInputEvents() {
        // 랭크 입력 필드 바인딩
        this.container.querySelectorAll('.character-item input[type="number"]').forEach(inputElement => {
            const charName = inputElement.dataset.charName;
            const initialValue = parseInt(inputElement.value);
            this.inputElements[charName] = new InputNumberElement(
                inputElement, 
                1, // min rank
                100, // max rank
                1, // defaultValue (blank 시 1로 되돌림)
                (validatedValue) => {
                    // 이 콜백이 호출될 때는 this.characterRanks[charName]가 항상 존재하도록 loadCharacterRanks를 수정함
                    this.characterRanks[charName].rank = validatedValue;
                    this.saveCharacterRanks();
                }
            );
            // 초기값 설정 (InputNumberElement가 초기화된 후 콜백 트리거)
            this.inputElements[charName].setValue(initialValue, true);
        });

        // 토글 스위치 바인딩
        this.container.querySelectorAll('.character-item input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (event) => {
                const charName = event.target.dataset.charName;
                const isActive = event.target.checked;
                this.characterRanks[charName].active = isActive;
                
                // 상태 라벨 업데이트 로직 제거 (요청에 따라)
                // const statusLabel = event.target.closest('.toggle-wrapper').querySelector('.status-label');
                // if (statusLabel) {
                //     statusLabel.textContent = isActive ? '활성화' : '비활성화';
                // }

                this.saveCharacterRanks();
            });
        });
    }

    bindEvents() {
        // 이 클래스는 App.js에서 드롭다운 섹션의 가시성을 관리하므로,
        // 자체적으로 버튼 클릭 이벤트를 바인딩하지 않습니다.
        // 대신 App.js에서 'rankManagementBtn' 클릭 시 이 인스턴스의 renderCharacterRanks()를 호출합니다.
    }

    // 외부에서 캐릭터 랭크 데이터를 설정할 때 사용 (백업 복원 시)
    setCharacterRanks(data) {
        // 이 메서드도 loadCharacterRanks와 유사하게 병합 로직을 적용하여
        // 모든 캐릭터가 올바르게 초기화되도록 합니다.
        const mergedRanks = {};
        CHARACTER_DATA.forEach(group => {
            group.characters.forEach(charName => {
                // 기본값으로 초기화
                mergedRanks[charName] = { rank: 1, active: false }; 
                // 불러온 데이터에 해당 캐릭터가 있으면 덮어쓰기
                if (data && data.hasOwnProperty(charName)) {
                    const importedCharData = data[charName];
                    const importedRank = parseInt(importedCharData.rank);
                    mergedRanks[charName].rank = isNaN(importedRank) ? 1 : Math.max(1, Math.min(100, importedRank));
                    mergedRanks[charName].active = typeof importedCharData.active === 'boolean' ? importedCharData.active : false;
                }
            });
        });
        this.characterRanks = mergedRanks;

        // 현재 활성화된 컨테이너에 렌더링 (드롭다운 또는 탭)
        if (document.getElementById('character-ranks-section').classList.contains('active')) {
            this.renderCharacterRanks('character-ranks-content');
        } else if (document.getElementById('character-tab').classList.contains('active')) {
            this.renderCharacterRanks('character-ranks-tab-content');
        } else {
            // 어떤 탭/드롭다운도 활성화되지 않은 경우, 기본 컨테이너에 렌더링 시도
            this.renderCharacterRanks(this.initialContainerId);
        }
        this.saveCharacterRanks(); // LocalStorage에 저장
        this.messageDisplayCallback('캐릭터 랭크 데이터를 불러왔습니다.', 'success');
    }

    // 외부에서 캐릭터 랭크 데이터를 가져올 때 사용 (백업 시)
    getCharacterRanks() {
        return this.characterRanks;
    }
}
