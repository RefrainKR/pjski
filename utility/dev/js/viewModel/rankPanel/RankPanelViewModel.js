
import { GROUP_DATA } from '/lib/projectSekai/data/groupData.js';

import { InputNumberElement } from '/lib/utils/InputNumberElement.js';
import { storageManager } from '/lib/utils/storageManager.js';

import { CHARACTER_RANKS_KEY, MIN_RANK, MAX_RANK, DEFAULT_RANK } from '/data.js';

export class RankPanelViewModel {
    constructor(initialContainerId, messageDisplayCallback) {
        this.initialContainerId = initialContainerId; 
        this.messageDisplayCallback = messageDisplayCallback;
        this.characterRanks = this.loadCharacterRanks();
        this.inputElements = {}; 
    }

    loadCharacterRanks() {
        const allCharactersDefaultRanks = {};
        GROUP_DATA.forEach(groupData => {
            groupData.characters.forEach(charName => {
                allCharactersDefaultRanks[charName] = { rank: DEFAULT_RANK, active: false };
            });
        });

        const parsedStoredData = storageManager.load(CHARACTER_RANKS_KEY, {});
       
        if (typeof parsedStoredData === 'object' && parsedStoredData !== null) {
            for (const charName in parsedStoredData) {
                if (allCharactersDefaultRanks.hasOwnProperty(charName)) {
                    const storedCharData = parsedStoredData[charName];
                    const storedRank = parseInt(storedCharData.rank);
                    allCharactersDefaultRanks[charName].rank = isNaN(storedRank) ? MIN_RANK : Math.max(MIN_RANK, Math.min(MAX_RANK, storedRank));
                    allCharactersDefaultRanks[charName].active = typeof storedCharData.active === 'boolean' ? storedCharData.active : false;
                }
            }
        }
        return allCharactersDefaultRanks;
    }

    saveCharacterRanks() {
        storageManager.save(CHARACTER_RANKS_KEY, this.characterRanks);
        this.messageDisplayCallback('캐릭터 랭크가 저장되었습니다.', 'success');
    }

    renderCharacterRanks(targetContainerId = this.initialContainerId) {
        const container = document.getElementById(targetContainerId);
        if (!container) {
            console.error(`RankPanelViewModel: Target container with ID '${targetContainerId}' not found for rendering.`);
            return;
        }

        container.innerHTML = '';
        this.inputElements = {};

        GROUP_DATA.forEach(groupData => {
            const groupDataSection = document.createElement('div');
            groupDataSection.className = 'groupData-section';
            groupDataSection.innerHTML = `<h3>${groupData.group}</h3>`;

            const characterGrid = document.createElement('div');
            characterGrid.className = 'character-grid';

            groupData.characters.forEach(charName => {
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
                        <input type="number" class="input input-sm" value="${charData.rank}" min="${MIN_RANK}" max="${MAX_RANK}" value="${DEFAULT_RANK}" data-char-name="${charName}">
                    </div>
                `;
                characterGrid.appendChild(characterItem);
            });
            groupDataSection.appendChild(characterGrid);
            container.appendChild(groupDataSection);
        });

        this.bindCharacterInputEvents(container);
    }

    bindCharacterInputEvents(container) {
        container.querySelectorAll('.character-item input[type="number"]').forEach(inputElement => {
            const charName = inputElement.dataset.charName;
            
            this.inputElements[charName] = new InputNumberElement(
                inputElement, MIN_RANK, MAX_RANK, DEFAULT_RANK,
                (validatedValue) => {
                    if (this.characterRanks[charName].rank !== validatedValue) {
                        this.characterRanks[charName].rank = validatedValue;
                        this.saveCharacterRanks();
                        this.dispatchEvent(charName);
                    }
                }
            );
            
            this.inputElements[charName].setValue(parseInt(inputElement.value), false);
        });

        container.querySelectorAll('.character-item input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (event) => {
                const charName = event.target.dataset.charName;
                this.characterRanks[charName].active = event.target.checked;
                this.saveCharacterRanks();
                this.dispatchEvent(charName);
            });
        });
    }
    
    dispatchEvent(charName) {
        const updateEvent = new CustomEvent('characterRanksUpdated', {
            bubbles: true,
            detail: { updatedCharacter: charName }
        });
        document.body.dispatchEvent(updateEvent);
    }

    setCharacterRanks(data) {
        const mergedRanks = {};
        GROUP_DATA.forEach(groupData => {
            groupData.characters.forEach(charName => {
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
     * 특정 캐릭터의 랭크를 업데이트하고, UI에 반영하며, 저장하고, 변경 사항을 알립니다.
     * @param {string} charName - 업데이트할 캐릭터의 이름.
     * @param {number} rank - 새로운 랭크 값.
     */
    updateCharacterRank(charName, rank) {
        if (this.characterRanks[charName]) {
            if (this.characterRanks[charName].rank === rank) return;
            
            this.characterRanks[charName].rank = rank;
            if (this.inputElements[charName]) {
                this.inputElements[charName].setValue(rank, false); 
            }
            this.saveCharacterRanks();
        }
    }
}