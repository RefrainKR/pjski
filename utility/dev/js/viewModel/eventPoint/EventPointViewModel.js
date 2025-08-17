import { TabManager } from '/lib/utils/TabManager.js';
import { NatureEnergyTabViewModel } from '/viewModel/eventPoint/tab/NatureEnergyTabViewModel.js';
// import { EventRunTabViewModel } from '/viewModel/eventPoint/tab/EventRunTabViewModel.js';

export class EventPointViewModel {
    constructor(config) {
        this.container = document.getElementById(config.containerId);
        
        // --- 하위 ViewModel 인스턴스화 ---
        this.natureEnergyTab = new NatureEnergyTabViewModel({
            containerId: 'ep-nature-energy-tab',
            ...config
        });
        
        // this.eventRunTab = new EventRunTabViewModel(...);

        // --- 탭 시스템 초기화 ---
        this.tabManager = new TabManager(this.container);
    }
}