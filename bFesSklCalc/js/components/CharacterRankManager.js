import { CHARACTER_DATA, LOCAL_STORAGE_KEY } from '../data.js';
import { InputNumberElement } from '../utils/InputNumberElement.js';
import { storageManager } from '../utils/StorageManager.js';

export class CharacterRankManager {
    constructor(initialContainerId, messageDisplayCallback) {
        this.initialContainerId = initialContainerId; 
        this.messageDisplayCallback = messageDisplayCallback;
        this.characterRanks = this.loadCharacterRanks();
        this.inputElements = {}; 
    }

    loadCharacterRanks() {
        const allCharactersDefaultRanks = {};
        CHARACTER_DATA.forEach(group => {
            group.characters.forEach(charName => {
                allCharactersDefaultRanks[charName] = { rank: 1, active: false };
            });
        });

        const parsedStoredData = storageManager.load(LOCAL_STORAGE_KEY, {});
       
        if (typeof parsedStoredData === 'object' && parsedStoredData !== null) {
            for (const charName in parsedStoredData) {
                if (allCharactersDefaultRanks.hasOwnProperty(charName)) {
                    const storedCharData = parsedStoredData[charName];
                    const storedRank = parseInt(storedCharData.rank);
                    allCharactersDefaultRanks[charName].rank = isNaN(storedRank) ? 1 : Math.max(1, Math.min(100, storedRank));
                    allCharactersDefaultRanks[charName].active = typeof storedCharData.active === 'boolean' ? storedCharData.active : false;
                }
            }
        }
        return allCharactersDefaultRanks;
    }

    saveCharacterRanks() {
        storageManager.save(LOCAL_STORAGE_KEY, this.characterRanks);
        this.messageDisplayCallback('캐릭터 랭크가 저장되었습니다.', 'success');
    }

    renderCharacterRanks(targetContainerId = this.initialContainerId) {
        const container = document.getElementById(targetContainerId);
        if (!container) {
            console.error(`CharacterRankManager: Target container with ID '${targetContainerId}' not found for rendering.`);
            return;
        }

        container.innerHTML = '';
        this.inputElements = {};

        CHARACTER_DATA.forEach(group => {
            const groupSection = document.createElement('div');
            groupSection.className = 'group-section';
            groupSection.innerHTML = `<h3>${group.groupName}</h3>`;

            const characterGrid = document.createElement('div');
            characterGrid.className = 'character-grid';

            group.characters.forEach(charName => {
                const charData = this.characterRanks[charName]; 
                const characterItem = document.createElement('div');
                characterItem.className = 'character-item';

                characterItem.innerHTML = `
                    <label>${charName}</label>
                    <div class="character-controls">
                        <div class="toggle-wrapper">
                            <label class="toggle-switch">
                                <input type="checkbox" data-char-name="${charName}" ${charData.active ? 'checked' : ''}>
                                <span class="slider"></span>
                            </label>
                        </div>
                        <input type="number" value="${charData.rank}" min="1" max="100" data-char-name="${charName}">
                    </div>
                `;
                characterGrid.appendChild(characterItem);
            });
            groupSection.appendChild(characterGrid);
            container.appendChild(groupSection);
        });

        this.bindCharacterInputEvents(container);
    }

    bindCharacterInputEvents(container) {
        container.querySelectorAll('.character-item input[type="number"]').forEach(inputElement => {
            const charName = inputElement.dataset.charName;
            this.inputElements[charName] = new InputNumberElement(
                inputElement, 1, 100, 1,
                (validatedValue) => {
                    this.characterRanks[charName].rank = validatedValue;
                    this.saveCharacterRanks();
                }
            );
            this.inputElements[charName].setValue(parseInt(inputElement.value), true);
        });

        container.querySelectorAll('.character-item input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (event) => {
                const charName = event.target.dataset.charName;
                this.characterRanks[charName].active = event.target.checked;
                this.saveCharacterRanks();

                const updateEvent = new CustomEvent('characterRanksUpdated', {
                    bubbles: true,
                    detail: {
                        updatedCharacter: charName
                    }
                });
                document.body.dispatchEvent(updateEvent);
            });
        });
    }

    setCharacterRanks(data) {
        const mergedRanks = {};
        CHARACTER_DATA.forEach(group => {
            group.characters.forEach(charName => {
                mergedRanks[charName] = { rank: 1, active: false };
                if (data && data.hasOwnProperty(charName)) {
                    const importedCharData = data[charName];
                    const importedRank = parseInt(importedCharData.rank);
                    mergedRanks[charName].rank = isNaN(importedRank) ? 1 : Math.max(1, Math.min(100, importedRank));
                    mergedRanks[charName].active = typeof importedCharData.active === 'boolean' ? importedCharData.active : false;
                }
            });
        });
        this.characterRanks = mergedRanks;

        // 현재 활성화된 컨테이너에 다시 렌더링
        const activeDropdown = document.querySelector('#character-ranks-panel.active');
        if (activeDropdown) {
            this.renderCharacterRanks('character-ranks-content');
        }
        
        this.saveCharacterRanks();
        this.messageDisplayCallback('캐릭터 랭크 데이터를 불러왔습니다.', 'success');
    }

    getCharacterRanks() {
        return this.characterRanks;
    }

    /**
     * 활성화된 캐릭터 목록을 반환합니다.
     * @returns {Array<Object>} [{name: string, rank: number}, ...]
     */
    getActiveCharacters() {
        const activeChars = [];
        for (const charName in this.characterRanks) {
            if (this.characterRanks[charName].active) {
                activeChars.push({
                    name: charName,
                    rank: this.characterRanks[charName].rank
                });
            }
        }
        return activeChars;
    }

    /**
     * 특정 캐릭터의 랭크를 업데이트하고 저장합니다.
     * @param {string} charName - 업데이트할 캐릭터의 이름.
     * @param {number} rank - 새로운 랭크 값.
     */
    updateCharacterRank(charName, rank) {
        if (this.characterRanks[charName]) {
            this.characterRanks[charName].rank = rank;
            // 랭크 패널의 입력 필드 값도 동기화
            if (this.inputElements[charName]) {
                this.inputElements[charName].setValue(rank, false); // 콜백 없이 값만 업데이트
            }
            this.saveCharacterRanks();
        }
    }
}