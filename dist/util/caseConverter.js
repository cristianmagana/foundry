"use strict";
/**
 * Case conversion utilities for environment variables
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.toUpperSnakeCase = void 0;
/**
 * Converts a camelCase or PascalCase string to UPPER_SNAKE_CASE
 *
 * Examples:
 * - myVariableName -> MY_VARIABLE_NAME
 * - awsAccountId -> AWS_ACCOUNT_ID
 * - clusterNameEast -> CLUSTER_NAME_EAST
 * - APIKey -> API_KEY
 *
 * @param str - The string to convert
 * @returns The string in UPPER_SNAKE_CASE format
 */
const toUpperSnakeCase = (str) => {
    return (str
        // Insert underscore before uppercase letters
        .replace(/([a-z\d])([A-Z])/g, '$1_$2')
        // Handle consecutive uppercase letters (e.g., APIKey -> API_KEY)
        .replace(/([A-Z]+)([A-Z][a-z\d]+)/g, '$1_$2')
        // Convert to uppercase
        .toUpperCase());
};
exports.toUpperSnakeCase = toUpperSnakeCase;
//# sourceMappingURL=caseConverter.js.map