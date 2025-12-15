import { Injectable } from '@nestjs/common';
import { RuntimeConfigService } from '../domain/runtime-config.service';
import { RuntimeConfigValue } from '../domain/runtime-config-value.do';

@Injectable()
export class RuntimeConfigUc {
	constructor(private readonly runtimeConfigService: RuntimeConfigService) {}

	public async getRuntimeConfig(): Promise<RuntimeConfigValue[]> {
		const dto = await this.runtimeConfigService.findAll();
		return dto;
	}

	public async updateRuntimeConfigValue(key: string, value: string): Promise<void> {
		// TODO: authorization

		const config = await this.runtimeConfigService.getByKey(key);
		config.setValue(value);
		// TODO: persist the updated config
		throw new Error('Method not implemented.');
	}
}

/*
if (entity.type === 'string') {
			return { type: 'string', value: entity.value };
		}
		if (entity.type === 'number') {
			const value = Number(entity.value);
			if (isNaN(value)) {
				throw new RuntimeConfigValueInvalidDataLoggable(entity.key, entity.value, entity.type);
			}
			return { type: 'number', value: Number(entity.value) };
		}
		if (entity.type === 'boolean') {
			return { type: 'boolean', value: entity.value === 'true' };
		}
		throw new RuntimeConfigValueInvalidDataLoggable(entity.key, entity.value, entity.type);
*/
