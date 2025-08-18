import { storageManager } from '/lib/utils/storageManager.js';

export class BackupViewModel {
    constructor(config) {
        this.container = document.getElementById(config.containerId);
        if (!this.container) return;
        
        this.messageDisplayCallback = config.messageDisplayCallback;
        this.dataSources = config.dataSources;

        this.exportDataBtn = this.container.querySelector('#exportDataBtn');
        this.importFile = this.container.querySelector('#importFile');
        this.clearDataBtn = this.container.querySelector('#clearDataBtn');
        this.userIdDisplay = this.container.querySelector('#user-id-display');

        this.bindEvents();
    }

    bindEvents() {
        if (this.exportDataBtn) {
            this.exportDataBtn.addEventListener('click', this.exportData.bind(this));
        }
        if (this.importFile) {
            this.importFile.addEventListener('change', this.importData.bind(this));
        }
        if (this.clearDataBtn) {
            this.clearDataBtn.addEventListener('click', this.clearData.bind(this));
        }
    }

    exportData() {
        const backupObject = {};
        
        for (const key in this.dataSources) {
            const source = this.dataSources[key];
            if (typeof source.getData === 'function') {
                backupObject[key] = source.getData();
            }
        }

        if (Object.keys(backupObject).length === 0) {
            this.messageDisplayCallback('내보낼 데이터가 없습니다.', 'info');
            return;
        }

        const jsonData = JSON.stringify(backupObject, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pjski_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.messageDisplayCallback('데이터가 성공적으로 내보내졌습니다.', 'success');
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) {
            this.messageDisplayCallback('파일을 선택해주세요.', 'info');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                let applied = false;
                for (const key in this.dataSources) {
                    if (importedData.hasOwnProperty(key)) {
                        const source = this.dataSources[key];
                        if (typeof source.setData === 'function') {
                            source.setData(importedData[key]);
                            applied = true;
                        }
                    }
                }
                if (applied) {
                    this.messageDisplayCallback('데이터를 성공적으로 불러왔습니다. 페이지를 새로고침합니다.', 'success');
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    this.messageDisplayCallback('파일에 유효한 데이터가 없습니다.', 'error');
                }

            } catch (error) {
                this.messageDisplayCallback('JSON 파일을 파싱하는 데 실패했습니다: ' + error.message, 'error');
                console.error("Error parsing imported JSON:", error);
            }
        };
        reader.onerror = () => {
            this.messageDisplayCallback('파일을 읽는 데 실패했습니다.', 'error');
        };
        reader.readAsText(file);
    }

    clearData() {
        if (confirm('정말로 모든 설정 데이터를 지우시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            for (const key in this.dataSources) {
                const source = this.dataSources[key];
                if (source.storageKey) {
                    storageManager.remove(source.storageKey);
                }
            }
            
            this.messageDisplayCallback('모든 데이터가 삭제되었습니다. 페이지를 새로고침합니다.', 'success');
            setTimeout(() => window.location.reload(), 1500);
        }
    }
}