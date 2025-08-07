
/**
 * kebab-case 형태의 문자열을 camelCase 형태로 변환합니다.
 * 예: 'hello-world' -> 'helloWorld'
 * @param {string} str - 변환할 kebab-case 문자열.
 * @returns {string} 변환된 camelCase 문자열.
 */
export const kebabToCamelCase = (str) => {
    return str.replace(/-./g, match => match.charAt(1).toUpperCase());
};

/**
 * snake_case 형태의 문자열을 camelCase 형태로 변환합니다.
 * 예: 'hello_world' -> 'helloWorld'
 * @param {string} str - 변환할 snake_case 문자열.
 * @returns {string} 변환된 camelCase 문자열.
 */
export const snakeToCamelCase = (str) => {
    return str.replace(/_./g, match => match.charAt(1).toUpperCase());
};