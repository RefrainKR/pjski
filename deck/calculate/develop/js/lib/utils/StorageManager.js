
export const storageManager = {
    /**
     * 스토리지에서 데이터를 불러옵니다.
     * @param {string} key - 데이터를 가져올 키.
     * @param {any} [defaultValue=null] - 키에 해당하는 데이터가 없을 경우 반환할 기본값.
     * @returns {any}
     */
    load(key, defaultValue = null) {
        const item = localStorage.getItem(key);
        if (item === null) {
            return defaultValue;
        }
        try {
            return JSON.parse(item);
        } catch (e) {
            console.error(`Error parsing JSON from localStorage for key "${key}":`, e);
            // 데이터가 손상되었을 경우를 대비해 해당 아이템을 삭제하고 기본값을 반환
            localStorage.removeItem(key);
            return defaultValue;
        }
    },

    /**
     * 스토리지에 데이터를 저장합니다.
     * @param {string} key - 데이터를 저장할 키.
     * @param {any} value - 저장할 값.
     */
    save(key, value) {
        try {
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(key, serializedValue);
        } catch (e) {
            console.error(`Error saving data to localStorage for key "${key}":`, e);
        }
    },

    /**
     * 스토리지에서 데이터를 삭제합니다.
     * @param {string} key - 삭제할 데이터의 키.
     */
    remove(key) {
        localStorage.removeItem(key);
    }
};