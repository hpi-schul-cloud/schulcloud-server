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
		config.setValueFromString(value);
		await this.runtimeConfigService.save(config);
	}
}
