import { RuntimeConfigValue } from './runtime-config-value.do';

export interface RuntimeConfigRepo {
	save(domainObject: RuntimeConfigValue): Promise<RuntimeConfigValue>;
	getAll(): Promise<RuntimeConfigValue[]>;
	getByKey(key: string): Promise<RuntimeConfigValue>;
}

export const RUNTIME_CONFIG_REPO = 'RUNTIME_CONFIG_REPO';
