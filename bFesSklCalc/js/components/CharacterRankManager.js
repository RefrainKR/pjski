// js/components/CharacterRankManager.js

import { CHARACTER_DATA, LOCAL_STORAGE_KEY } from '../data.js';
import { InputNumberElement } from '../utils/InputNumberElement.js';

export class CharacterRankManager {
    /**
     * @param {string} initialContainerId - 캐릭터 랭크를 표시할 주 HTML 컨테이너의 ID (예: 'character-ranks-content' 또는 'character-ranks-tab-content').
     * @param {Function} messageDisplayCallback - 메시지를 표시하기 위한 콜백 함수.
     */
    constructor(initialContainerId, messageDisplayCallback) {
        // 초기 컨테이너 ID를 저장하고, 실제 렌더링은 renderCharacterRanks 메서드에서 동적으로 처리
        this.initialContainerId = initialContainerId; 
        this.messageDisplayCallback = messageDisplayCallback;
        this.characterRanks = this.loadCharacterRanks();
        this.inputElements = {}; // InputNumberElement 인스턴스를 저장할 객체

        // constructor에서는 바로 렌더링하지 않고, App.js에서 필요할 때 renderCharacterRanks를 호출하도록 변경
        // 이렇게 하면 DOM이 완전히 로드되지 않은 상태에서 querySelector를 호출하는 오류를 방지할 수 있습니다.
    }

    loadCharacterRanks() {
        const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedData) {
            try {
                return JSON.parse(storedData);
            } catch (e) {
                console.error("Error parsing character ranks from LocalStorage:", e);
                localStorage.removeItem(LOCAL_STORAGE_KEY); // Corrupted data, clear it
            }
        }
        // 기본값으로 초기화: 모든 캐릭터 랭크 1, 활성화
        const defaultRanks = {};
        CHARACTER_DATA.forEach(group => {
            group.characters.forEach(charName => {
                defaultRanks[charName] = { rank: 1, active: true };
            });
        });
        return defaultRanks;
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
            groupSection.innerHTML = `<h2>${group.groupName}</h2>`;

            const characterGrid = document.createElement('div');
            characterGrid.className = 'character-grid';

            group.characters.forEach(charName => {
                const charData = this.characterRanks[charName] || { rank: 1, active: true };
                const characterItem = document.createElement('div');
                characterItem.className = 'character-item';

                characterItem.innerHTML = `
                    <label>${charName}</label>
                    <div class="character-controls">
                        <input type="number" 
                               id="rank-${charName}" 
                               value="${charData.rank}" 
                               min="1" max="100" 
                               data-char-name="${charName}">
                        <div class="toggle-wrapper">
                            <span class="status-label">${charData.active ? '활성화' : '비활성화'}</span>
                            <label class="toggle-switch">
                                <input type="checkbox" 
                                       id="toggle-${charName}" 
                                       data-char-name="${charName}" 
                                       ${charData.active ? 'checked' : ''}>
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>
                `;
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
                
                // 상태 라벨 업데이트
                const statusLabel = event.target.closest('.toggle-wrapper').querySelector('.status-label');
                if (statusLabel) {
                    statusLabel.textContent = isActive ? '활성화' : '비활성화';
                }

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
        this.characterRanks = data;
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
