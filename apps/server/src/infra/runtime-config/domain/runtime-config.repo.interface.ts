import { RuntimeConfigValue } from './runtime-config-value.do';

export interface RuntimeConfigRepo {
	save(domainObject: RuntimeConfigValue): Promise<RuntimeConfigValue>;
	getAll(): Promise<RuntimeConfigValue[]>;
	getByKey(key: string): Promise<RuntimeConfigValue>;
}
