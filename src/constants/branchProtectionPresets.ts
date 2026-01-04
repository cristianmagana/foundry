/**
 * Branch protection preset configurations
 * Defines predefined protection levels for repository branches
 */

import {BranchProtectionPreset} from '../api/types/productionalization';

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
 * Strict branch protection preset
 * Recommended for production branches
 *
 * Features:
 * - Requires 2 approving reviews
 * - Dismisses stale reviews on new push
 * - Requires last push approval
 * - Requires all review threads to be resolved
 * - Prevents force pushes
 */
const strictProtection: BranchProtectionRuleset = {
    name: 'Branch protection rules (strict)',
    target: 'branch',
    enforcement: 'active',
    conditions: {
        ref_name: {
            include: [], // Will be set dynamically
            exclude: [],
        },
    },
    rules: [
        {
            type: 'pull_request',
            parameters: {
                dismiss_stale_reviews_on_push: true,
                require_code_owner_review: false,
                require_last_push_approval: true,
                required_approving_review_count: 2,
                required_review_thread_resolution: true,
            },
        },
        {
            type: 'non_fast_forward',
        },
    ],
};

/**
 * Moderate branch protection preset
 * Recommended for staging/development branches
 *
 * Features:
 * - Requires 1 approving review
 * - Dismisses stale reviews on new push
 * - Requires last push approval
 * - Requires all review threads to be resolved
 * - Prevents force pushes
 */
const moderateProtection: BranchProtectionRuleset = {
    name: 'Branch protection rules (moderate)',
    target: 'branch',
    enforcement: 'active',
    conditions: {
        ref_name: {
            include: [], // Will be set dynamically
            exclude: [],
        },
    },
    rules: [
        {
            type: 'pull_request',
            parameters: {
                dismiss_stale_reviews_on_push: true,
                require_code_owner_review: false,
                require_last_push_approval: true,
                required_approving_review_count: 1,
                required_review_thread_resolution: true,
            },
        },
        {
            type: 'non_fast_forward',
        },
    ],
};

/**
 * Minimal branch protection preset
 * Recommended for feature branches with basic protection
 *
 * Features:
 * - Requires 1 approving review
 * - Does not dismiss stale reviews
 * - Does not require last push approval
 * - Does not require thread resolution
 * - Prevents force pushes
 */
const minimalProtection: BranchProtectionRuleset = {
    name: 'Branch protection rules (minimal)',
    target: 'branch',
    enforcement: 'active',
    conditions: {
        ref_name: {
            include: [], // Will be set dynamically
            exclude: [],
        },
    },
    rules: [
        {
            type: 'pull_request',
            parameters: {
                dismiss_stale_reviews_on_push: false,
                require_code_owner_review: false,
                require_last_push_approval: false,
                required_approving_review_count: 1,
                required_review_thread_resolution: false,
            },
        },
        {
            type: 'non_fast_forward',
        },
    ],
};

/**
 * Map of preset names to their configurations
 */
const BRANCH_PROTECTION_PRESETS: Record<BranchProtectionPreset, BranchProtectionRuleset> = {
    strict: strictProtection,
    moderate: moderateProtection,
    minimal: minimalProtection,
};

/**
 * Gets the branch protection configuration for a given preset
 *
 * @param preset - The preset name
 * @param targetBranch - The branch to protect (e.g., 'master', 'main')
 * @returns Branch protection ruleset configuration
 */
export const getBranchProtectionPreset = (
    preset: BranchProtectionPreset,
    targetBranch: string = 'master'
): BranchProtectionRuleset => {
    const config = {...BRANCH_PROTECTION_PRESETS[preset]};

    // Set the target branch
    config.conditions.ref_name.include = [`refs/heads/${targetBranch}`];

    return config;
};
