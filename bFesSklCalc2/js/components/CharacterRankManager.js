// js/components/CharacterRankManager.js

import { CHARACTER_DATA, LOCAL_STORAGE_KEY } from '../data.js';

export class CharacterRankManager {
    constructor(containerId, messageDisplayCallback) {
        this.characterRanks = {};
        this.container = document.getElementById(containerId);
        this.contentElement = this.container.querySelector('#character-ranks-content'); // ID로 직접 접근
        this.closeButton = this.container.querySelector('.close-btn');
        this.messageDisplayCallback = messageDisplayCallback; // 메시지 표시 콜백 함수

        this.loadRanksFromLocalStorage();
        this.renderUI();
        this.bindEvents();
    }

    loadRanksFromLocalStorage() {
        const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedData) {
            try {
                this.characterRanks = JSON.parse(storedData);
            } catch (e) {
                console.error("Error parsing stored character ranks from LocalStorage:", e);
                localStorage.removeItem(LOCAL_STORAGE_KEY);
                this.characterRanks = {};
            }
        } else {
            this.characterRanks = {};
        }

        // CHARACTER_DATA를 기반으로 초기화 및 누락된 캐릭터 추가
        CHARACTER_DATA.forEach(groupData => {
            const groupName = groupData.groupName;
            if (!this.characterRanks[groupName]) {
                this.characterRanks[groupName] = {};
            }
            groupData.characters.forEach(characterName => {
                const characterId = this.getCharacterId(characterName);
                if (!this.characterRanks[groupName][characterId]) {
                    this.characterRanks[groupName][characterId] = { rank: 1, active: false };
                }
            });
        });
        this.saveRanksToLocalStorage();
    }

    saveRanksToLocalStorage() {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.characterRanks));
    }

    getCharacterId(characterName) {
        return characterName.replace(/[^a-zA-Z0-9가-힣]/g, '').replace(/\s/g, '_');
    }

    renderUI() {
        if (!this.contentElement) return;

        this.contentElement.innerHTML = '';

        CHARACTER_DATA.forEach(groupData => {
            const groupName = groupData.groupName;
            const groupSection = document.createElement('div');
            groupSection.className = 'group-section';
            groupSection.innerHTML = `<h2>${groupName}</h2><div class="character-grid"></div>`;
            const characterGrid = groupSection.querySelector('.character-grid');

            groupData.characters.forEach(characterName => {
                const characterId = this.getCharacterId(characterName);
                const currentRank = this.characterRanks[groupName]?.[characterId]?.rank || 1;
                const currentActive = this.characterRanks[groupName]?.[characterId]?.active ?? false;

                const characterItem = document.createElement('div');
                characterItem.className = 'character-item';
                
                characterItem.innerHTML = `
                    <label for="rank-${characterId}">${characterName}</label>
                    <div class="character-controls">
                        <div class="toggle-wrapper">
                            <label class="toggle-switch">
                                <input type="checkbox" id="active-${characterId}" ${currentActive ? 'checked' : ''}>
                                <span class="slider"></span>
                            </label>
                        </div>
                        <input type="number" id="rank-${characterId}" min="1" max="100" value="${currentRank}">
                    </div>
                `;
                characterGrid.appendChild(characterItem);

                const rankInputElement = characterItem.querySelector(`#rank-${characterId}`);
                rankInputElement.addEventListener('change', (event) => {
                    let value = parseInt(event.target.value);
                    if (isNaN(value) || value < 1) {
                        value = 1;
                    } else if (value > 100) {
                        value = 100;
                    }
                    event.target.value = value;
                    this.characterRanks[groupName][characterId].rank = value;
                    this.saveRanksToLocalStorage();
                    this.messageDisplayCallback(''); // 메시지 초기화
                });

                const activeInputElement = characterItem.querySelector(`#active-${characterId}`);
                activeInputElement.addEventListener('change', (event) => {
                    this.characterRanks[groupName][characterId].active = event.target.checked;
                    this.saveRanksToLocalStorage();
                    this.messageDisplayCallback(''); // 메시지 초기화
                });
            });
            this.contentElement.appendChild(groupSection);
        });
    }

    bindEvents() {
        // closeButton 이벤트는 UIManager에서 처리하므로 여기서는 제거
    }
}