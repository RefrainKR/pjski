import { TabManager } from '/lib/utils/TabManager.js';

import { RankTableViewModel } from '/components/skillComparison/table/RankTableViewModel.js';
import { CharacterTableViewModel } from '/components/skillComparison/table/CharacterTableViewModel.js';

/**
 * "스킬 비교기" 툴 전체를 관리하는 최상위 ViewModel입니다.
 * 내부 탭 시스템과 하위 테이블 ViewModel들을 제어합니다.
 */
export class SkillComparisonViewModel {
    constructor(config) {
        this.container = document.getElementById(config.containerId);
        if (!this.container) return;
        
        // --- 1. 하위 ViewModel들을 내부에서 직접 생성 ---
        this.rankTableViewModel = new RankTableViewModel({
            messageDisplayCallback: config.messageDisplayCallback,
            rankPanelViewModel: config.rankPanelViewModel,
            ...config.rankTableConfig
        });
        
        this.characterTableViewModel = new CharacterTableViewModel({
            messageDisplayCallback: config.messageDisplayCallback,
            rankPanelViewModel: config.rankPanelViewModel,
            ...config.characterTableConfig
        });

        // --- 2. 탭 관리 책임을 직접 소유 ---
        this.tabManager = new TabManager(this.container, (activeTabId) => {
            if (activeTabId === 'character-skill-tab') {
                this.characterTableViewModel.refresh();
            }
        });
    }

    init() {
        this.tabManager.activateDefaultTab();
    }
    
    // App.js로부터 이벤트를 전달받는 메서드
    handleRanksUpdated() {
        // 현재 활성화된 탭이 캐릭터 탭인지 확인하고 refresh 호출
        const activeTab = this.container.querySelector('.tab-button.active');
        if (activeTab && activeTab.dataset.tab === 'character-skill-tab') {
            this.characterTableViewModel.refresh();
        }
    }
    
    // "자동 입력" 팝업이 호출할 테이블을 반환하는 메서드
    getActiveTableViewModel() {
        const activeTab = this.container.querySelector('.tab-button.active');
        if (activeTab && activeTab.dataset.tab === 'character-skill-tab') {
            return this.characterTableViewModel;
        }
        return this.rankTableViewModel; // 기본값은 랭크 테이블
    }
}