// js/App.js

import { MESSAGE_DISPLAY_DURATION } from './data.js';
import { CharacterRankManager } from './components/CharacterRankManager.js';
import { SkillCalculator } from './components/SkillCalculator.js'; // SkillSimulator -> SkillCalculator로 변경
import { BackupManager } from './components/BackupManager.js';
import { TabManager } from './components/TabManager.js';

class App {
    constructor() {
        this.messageTimeout = null;

        this.header = document.querySelector('.header');
        this.messageDiv = document.getElementById('message');
        this.rankManagementBtn = document.getElementById('rankManagementBtn');
        this.backupBtn = document.getElementById('backupBtn');

        this.characterRankManager = new CharacterRankManager('character-ranks-section', this.displayMessage.bind(this));
        this.skillCalculator = new SkillCalculator('rank-tab', this.displayMessage.bind(this)); // SkillSimulator -> SkillCalculator로 변경
        this.backupManager = new BackupManager('backup-section', this.displayMessage.bind(this), this.characterRankManager);
        this.tabManager = new TabManager('.tab-button', '.tab-content');

        this.bindGlobalEvents();
        this.tabManager.openTab('rank-tab');
    }

    bindGlobalEvents() {
        this.rankManagementBtn.addEventListener('click', this.toggleCharacterRankDropdown.bind(this));
        this.backupBtn.addEventListener('click', this.toggleBackupDropdown.bind(this));

        document.getElementById('character-ranks-section').querySelector('.close-btn')
            .addEventListener('click', () => this.closeDropdown(document.getElementById('character-ranks-section')));
        document.getElementById('backup-section').querySelector('.close-btn')
            .addEventListener('click', () => this.closeDropdown(document.getElementById('backup-section')));

        document.addEventListener('click', (event) => {
            const isClickInsideHeader = this.header.contains(event.target);
            const isClickOnRankBtn = this.rankManagementBtn.contains(event.target);
            const isClickOnBackupBtn = this.backupBtn.contains(event.target);

            if (!isClickInsideHeader && this.isAnyDropdownActive()) {
                this.closeAllDropdowns();
            } else if (this.isAnyDropdownActive()) {
                const isClickInsideOpenDropdown =
                    (document.getElementById('character-ranks-section').classList.contains('active') && document.getElementById('character-ranks-section').contains(event.target)) ||
                    (document.getElementById('backup-section').classList.contains('active') && document.getElementById('backup-section').contains(event.target));

                if (!isClickOnRankBtn && !isClickOnBackupBtn && !isClickInsideOpenDropdown) {
                    this.closeAllDropdowns();
                }
            }
        });
    }

    isAnyDropdownActive() {
        return document.getElementById('character-ranks-section').style.display === 'block' ||
               document.getElementById('backup-section').style.display === 'block';
    }

    closeAllDropdowns() {
        this.closeDropdown(document.getElementById('character-ranks-section'));
        this.closeDropdown(document.getElementById('backup-section'));
    }

    closeDropdown(sectionElement) {
        sectionElement.classList.remove('active');
        sectionElement.style.display = 'none';
        this.displayMessage('');
    }

    openDropdown(sectionElement) {
        sectionElement.classList.add('active');
        sectionElement.style.display = 'block';
        this.displayMessage('');
    }

    toggleCharacterRankDropdown() {
        if (document.getElementById('backup-section').classList.contains('active')) {
            this.closeDropdown(document.getElementById('backup-section'));
        }
        if (document.getElementById('character-ranks-section').style.display === 'block') {
            this.closeDropdown(document.getElementById('character-ranks-section'));
        } else {
            this.openDropdown(document.getElementById('character-ranks-section'));
        }
    }

    toggleBackupDropdown() {
        if (document.getElementById('character-ranks-section').classList.contains('active')) {
            this.closeDropdown(document.getElementById('character-ranks-section'));
        }
        if (document.getElementById('backup-section').style.display === 'block') {
            this.closeDropdown(document.getElementById('backup-section'));
        } else {
            this.openDropdown(document.getElementById('backup-section'));
        }
    }

    displayMessage(msg, type = '') {
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout);
        }

        this.messageDiv.textContent = msg;
        this.messageDiv.className = 'message';
        if (type) {
            this.messageDiv.classList.add(type);
        }

        if (msg) {
            this.messageTimeout = setTimeout(() => {
                this.messageDiv.textContent = '';
                this.messageDiv.className = 'message';
            }, MESSAGE_DISPLAY_DURATION);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});