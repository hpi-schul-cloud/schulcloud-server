import { Logger } from '@core/logger';
import { RuntimeConfigService, RuntimeConfigValue, RuntimeConfigValueType } from '@infra/runtime-config';
import { AuthorizationService } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { UpdateRuntimeConfigLoggable } from './loggable/update-runtime-config.loggable';

@Injectable()
export class RuntimeConfigUc {
	constructor(
		private readonly runtimeConfigService: RuntimeConfigService,
		private readonly authorizationService: AuthorizationService,
		private readonly logger: Logger
	) {}

	public async getRuntimeConfig(): Promise<RuntimeConfigValue[]> {
		const dto = await this.runtimeConfigService.findAll();
		return dto;
	}

	public async updateRuntimeConfigValue(key: string, value: string, userId: EntityId): Promise<RuntimeConfigValueType> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkAllPermissions(user, [Permission.INSTANCE_EDIT]);

		const config = await this.runtimeConfigService.getByKey(key);
		config.setValueFromString(value);
		await this.runtimeConfigService.save(config);

		const persistedValue = config.getTypeAndValue().value;
		this.logger.info(new UpdateRuntimeConfigLoggable(userId, key, value, persistedValue));

		return persistedValue;
	}
}
