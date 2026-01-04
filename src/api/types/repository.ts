import {ProductionalizationConfig} from './productionalization';

export type RepositoryInput = {
    token: string;
    name: string;
    description: string;
    private: boolean;
    template?: string;
    organization?: string;
    autoInit: boolean;
    gitignoreTemplate?: string;
    licenseTemplate?: string;
    defaultBranch?: string;
    // Productionalization features
    productionalize?: boolean;
    productionalizationConfig?: ProductionalizationConfig;
};

export type RepositoryResult = {
    id: number;
    full_name: string;
    html_url: string;
};
