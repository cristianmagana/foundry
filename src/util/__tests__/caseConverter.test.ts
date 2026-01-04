/**
 * Unit tests for Case Converter utilities
 */

import {toUpperSnakeCase} from '../caseConverter';

describe('CaseConverter', () => {
    describe('toUpperSnakeCase', () => {
        describe('when converting camelCase', () => {
            it('should convert simple camelCase to UPPER_SNAKE_CASE', () => {
                expect(toUpperSnakeCase('myVariableName')).toBe('MY_VARIABLE_NAME');
            });

            it('should convert camelCase with numbers', () => {
                expect(toUpperSnakeCase('value123Name')).toBe('VALUE123_NAME');
            });

            it('should handle single word', () => {
                expect(toUpperSnakeCase('variable')).toBe('VARIABLE');
            });
        });

        describe('when converting PascalCase', () => {
            it('should convert PascalCase to UPPER_SNAKE_CASE', () => {
                expect(toUpperSnakeCase('MyVariableName')).toBe('MY_VARIABLE_NAME');
            });
        });

        describe('when handling acronyms', () => {
            it('should handle acronyms correctly', () => {
                expect(toUpperSnakeCase('APIKey')).toBe('API_KEY');
            });

            it('should handle AWS pattern', () => {
                expect(toUpperSnakeCase('awsAccountId')).toBe('AWS_ACCOUNT_ID');
            });

            it('should handle consecutive uppercase letters', () => {
                expect(toUpperSnakeCase('HTTPSConnection')).toBe('HTTPS_CONNECTION');
            });
        });

        describe('when handling complex cases', () => {
            it('should convert clusterNameEast', () => {
                expect(toUpperSnakeCase('clusterNameEast')).toBe('CLUSTER_NAME_EAST');
            });

            it('should handle multiple transitions', () => {
                expect(toUpperSnakeCase('nodeEnvProduction')).toBe('NODE_ENV_PRODUCTION');
            });

            it('should handle already uppercase string', () => {
                expect(toUpperSnakeCase('ALREADY_UPPER')).toBe('ALREADY_UPPER');
            });
        });

        describe('when handling edge cases', () => {
            it('should handle empty string', () => {
                expect(toUpperSnakeCase('')).toBe('');
            });

            it('should handle single character', () => {
                expect(toUpperSnakeCase('a')).toBe('A');
            });

            it('should handle single uppercase character', () => {
                expect(toUpperSnakeCase('A')).toBe('A');
            });
        });
    });
});
