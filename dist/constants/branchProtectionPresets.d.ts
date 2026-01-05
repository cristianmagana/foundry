/**
 * Branch protection preset configurations
 * Defines predefined protection levels for repository branches
 */
import { BranchProtectionPreset } from '../api/types/productionalization';
/**
 * Branch protection ruleset configuration
 * Compatible with GitHub's repository rulesets API
 */
export type BranchProtectionRuleset = {
    name: string;
    target: 'branch' | 'tag';
    enforcement: 'active' | 'disabled' | 'evaluate';
    conditions: {
        ref_name: {
            include: string[];
            exclude: string[];
        };
    };
    rules: Array<{
        type: string;
        parameters?: Record<string, unknown>;
    }>;
};
/**
 * Gets the branch protection configuration for a given preset
 *
 * @param preset - The preset name
 * @param targetBranch - The branch to protect (e.g., 'master', 'main')
 * @returns Branch protection ruleset configuration
 */
export declare const getBranchProtectionPreset: (preset: BranchProtectionPreset, targetBranch?: string) => BranchProtectionRuleset;
//# sourceMappingURL=branchProtectionPresets.d.ts.map