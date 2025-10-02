import { Inject, Injectable } from '@nestjs/common';
import { RuntimeConfigRepo } from './runtime-config.repo.interface';
import { RuntimeConfigValue } from './runtime-config-value.do';

@Injectable()
export class RuntimeConfigService {
	constructor(@Inject('RUNTIME_CONFIG_REPO') private readonly repo: RuntimeConfigRepo) {}

	public async getByKey(key: string): Promise<RuntimeConfigValue> {
		const domainobject = await this.repo.getByKey(key);
		return domainobject;
	}

	public async findAll(): Promise<RuntimeConfigValue[]> {
		const domainobjects = await this.repo.getAll();
		return domainobjects;
	}

	public async getString(key: string): Promise<string> {
		const domainobject = await this.repo.getByKey(key);
		const { type, value } = domainobject.getTypeAndValue();
		if (type !== 'string') {
			// TODO: loggable
			throw new Error(`Runtime Config for key: ${key} is not of type string`);
		}
		return value;
	}

	public async getNumber(key: string): Promise<number> {
		const domainobject = await this.repo.getByKey(key);
		const { type, value } = domainobject.getTypeAndValue();
		if (type !== 'number') {
			// TODO: loggable
			throw new Error(`Runtime Config for key: ${key} is not of type number`);
		}
		return value;
	}

	public async getBoolean(key: string): Promise<boolean> {
		const domainobject = await this.repo.getByKey(key);
		const { type, value } = domainobject.getTypeAndValue();
		if (type !== 'boolean') {
			// TODO: loggable
			throw new Error(`Runtime Config for key: ${key} is not of type boolean`);
		}
		return value;
	}
}
