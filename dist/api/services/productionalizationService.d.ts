/**
 * Productionalization service for GitHub repositories
 * Handles team permissions, environments, branch protection, topics, and secrets
 */
import { Octokit } from '@octokit/rest';
import type { Logger } from 'loglevel';
import { ProductionalizationConfig, ProductionalizationResult } from '../types/productionalization';
/**
 * Productionalization service interface
 */
export interface ProductionalizationService {
    productionalizeRepository: (owner: string, repo: string, config: ProductionalizationConfig) => Promise<ProductionalizationResult>;
}
/**
 * Factory function to create a productionalization service
 *
 * @param client - Octokit client
 * @param log - Logger instance
 * @returns ProductionalizationService
 */
export declare const getProductionalizationService: (client: Octokit, log: Logger) => ProductionalizationService;
//# sourceMappingURL=productionalizationService.d.ts.map