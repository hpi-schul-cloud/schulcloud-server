import { Inject, Injectable } from '@nestjs/common';
import { RuntimeConfigRepo } from './runtime-config.repo.interface';
import { RuntimeConfigValue } from './runtime-config-value.do';
import { RuntimeConfigValueNotExpectedType } from './loggable/runtime-config-not-expected-type.loggable';
import { RUNTIME_CONFIG_REPO } from '../injection-keys';

@Injectable()
export class RuntimeConfigService {
	constructor(@Inject(RUNTIME_CONFIG_REPO) private readonly repo: RuntimeConfigRepo) {}

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
			throw new RuntimeConfigValueNotExpectedType('string', domainobject);
		}
		return value;
	}

	public async getNumber(key: string): Promise<number> {
		const domainobject = await this.repo.getByKey(key);
		const { type, value } = domainobject.getTypeAndValue();
		if (type !== 'number') {
			throw new RuntimeConfigValueNotExpectedType('number', domainobject);
		}
		return value;
	}

	public async getBoolean(key: string): Promise<boolean> {
		const domainobject = await this.repo.getByKey(key);
		const { type, value } = domainobject.getTypeAndValue();
		if (type !== 'boolean') {
			throw new RuntimeConfigValueNotExpectedType('boolean', domainobject);
		}
		return value;
	}
}
