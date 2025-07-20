// js/components/TabManager.js

// 현재 해당 기능은 App.js에서 관리

export class TabManager {
    constructor(tabButtonSelector, tabContentSelector) {
        this.tabButtons = document.querySelectorAll(tabButtonSelector);
        this.tabContents = document.querySelectorAll(tabContentSelector);

        this.bindEvents();
    }

    bindEvents() {
        this.tabButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                this.openTab(event.target.dataset.tab);
            });
        });
    }

    openTab(tabName) {
        this.tabButtons.forEach(button => {
            button.classList.remove('active');
        });

        this.tabContents.forEach(content => {
            content.classList.remove('active');
        });

        const targetButton = document.querySelector(`.tab-button[data-tab="${tabName}"]`);
        if (targetButton) {
            targetButton.classList.add('active');
        }

        const targetContent = document.getElementById(tabName);
        if (targetContent) {
            targetContent.classList.add('active');
        }
    }
}
