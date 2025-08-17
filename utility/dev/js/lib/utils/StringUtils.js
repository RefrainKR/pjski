// lib/utils/stringUtils.js

/**
 * 문자열 관련 유틸리티 함수들을 모아놓은 객체.
 */
export const stringUtils = {
    /**
     * kebab-case 형태의 문자열을 camelCase 형태로 변환합니다.
     * 예: 'hello-world' -> 'helloWorld'
     * @param {string} str - 변환할 kebab-case 문자열.
     * @returns {string} 변환된 camelCase 문자열.
     */
    kebabToCamelCase(str) {
        return str.replace(/-./g, match => match.charAt(1).toUpperCase());
    },

    /**
     * snake_case 형태의 문자열을 camelCase 형태로 변환합니다.
     * 예: 'hello_world' -> 'helloWorld'
     * @param {string} str - 변환할 snake_case 문자열.
     * @returns {string} 변환된 camelCase 문자열.
     */
    snakeToCamelCase(str) {
        return str.replace(/_./g, match => match.charAt(1).toUpperCase());
    }
};