// js/App.js

import { MESSAGE_DISPLAY_DURATION } from './data.js';
import { CharacterRankManager } from './components/CharacterRankManager.js';
import { SkillCalculator } from './components/SkillCalculator.js';
import { BackupManager } from './components/BackupManager.js';
import { TabManager } from './components/TabManager.js';

class App {
    constructor() {
        this.messageTimeout = null;

        this.header = document.querySelector('.header');
        this.messageDiv = document.getElementById('message');
        this.rankManagementBtn = document.getElementById('rankManagementBtn');
        this.backupBtn = document.getElementById('backupBtn');
        this.autoCalcSection = document.getElementById('auto-calc-section'); // New: Auto Calc Modal

        this.characterRankManager = new CharacterRankManager('character-ranks-section', this.displayMessage.bind(this));
        this.skillCalculator = new SkillCalculator('rank-tab', this.displayMessage.bind(this));
        this.backupManager = new BackupManager('backup-section', this.displayMessage.bind(this), this.characterRankManager);
        this.tabManager = new TabManager('.tab-button', '.tab-content');

        this.bindGlobalEvents();
        this.tabManager.openTab('rank-tab');
    }

    bindGlobalEvents() {
        this.rankManagementBtn.addEventListener('click', this.toggleCharacterRankDropdown.bind(this));
        this.backupBtn.addEventListener('click', this.toggleBackupDropdown.bind(this));

        // Close buttons for dropdowns
        document.getElementById('character-ranks-section').querySelector('.close-btn')
            .addEventListener('click', () => this.closeDropdown(document.getElementById('character-ranks-section')));
        document.getElementById('backup-section').querySelector('.close-btn')
            .addEventListener('click', () => this.closeDropdown(document.getElementById('backup-section')));
        // New: Close button for Auto Calc Modal
        this.autoCalcSection.querySelector('.close-btn')
            .addEventListener('click', () => this.closeDropdown(this.autoCalcSection));


        document.addEventListener('click', (event) => {
            const isClickInsideHeader = this.header.contains(event.target);
            const isClickOnRankBtn = this.rankManagementBtn.contains(event.target);
            const isClickOnBackupBtn = this.backupBtn.contains(event.target);
            const isClickOnAutoCalcTriggerBtn = this.skillCalculator.autoCalcTriggerBtn.contains(event.target); // New: Auto Calc Trigger button

            // Check if any dropdown is currently active
            const characterRanksSection = document.getElementById('character-ranks-section');
            const backupSection = document.getElementById('backup-section');
            const autoCalcSection = document.getElementById('auto-calc-section'); // New: Auto Calc Modal

            const isAnyDropdownActive = characterRanksSection.classList.contains('active') ||
                                         backupSection.classList.contains('active') ||
                                         autoCalcSection.classList.contains('active'); // New: Check Auto Calc Modal

            if (isAnyDropdownActive) {
                const isClickInsideOpenDropdown =
                    (characterRanksSection.classList.contains('active') && characterRanksSection.contains(event.target)) ||
                    (backupSection.classList.contains('active') && backupSection.contains(event.target)) ||
                    (autoCalcSection.classList.contains('active') && autoCalcSection.contains(event.target)); // New: Check Auto Calc Modal

                // If click is not on any header button and not inside an open dropdown, close all.
                if (!isClickOnRankBtn && !isClickOnBackupBtn && !isClickOnAutoCalcTriggerBtn && !isClickInsideOpenDropdown) {
                    this.closeAllDropdowns();
                }
            }
        });
    }

    isAnyDropdownActive() {
        return document.getElementById('character-ranks-section').classList.contains('active') ||
               document.getElementById('backup-section').classList.contains('active') ||
               document.getElementById('auto-calc-section').classList.contains('active'); // New: Check Auto Calc Modal
    }

    closeAllDropdowns() {
        this.closeDropdown(document.getElementById('character-ranks-section'));
        this.closeDropdown(document.getElementById('backup-section'));
        this.closeDropdown(document.getElementById('auto-calc-section')); // New: Close Auto Calc Modal
    }

    closeDropdown(sectionElement) {
        sectionElement.classList.remove('active');
        this.displayMessage('');
    }

    openDropdown(sectionElement) {
        // 다른 드롭다운이 열려있으면 닫기
        this.closeAllDropdowns();
        sectionElement.classList.add('active');
        this.displayMessage('');
    }

    toggleCharacterRankDropdown() {
        const characterRanksSection = document.getElementById('character-ranks-section');
        if (characterRanksSection.classList.contains('active')) {
            this.closeDropdown(characterRanksSection);
        } else {
            this.openDropdown(characterRanksSection);
        }
    }

    toggleBackupDropdown() {
        const backupSection = document.getElementById('backup-section');
        if (backupSection.classList.contains('active')) {
            this.closeDropdown(backupSection);
        } else {
            this.openDropdown(backupSection);
        }
    }

    // New: Toggle Auto Calculation Modal
    toggleAutoCalcModal() {
        const autoCalcSection = document.getElementById('auto-calc-section');
        if (autoCalcSection.classList.contains('active')) {
            this.closeDropdown(autoCalcSection);
        } else {
            this.openDropdown(autoCalcSection);
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
