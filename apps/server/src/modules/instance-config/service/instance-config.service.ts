import { AuthorizationLoaderServiceGeneric } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { InstanceConfig } from '../domain';
import { InstanceConfigRepo } from '../repo';

@Injectable()
export class InstanceConfigService implements AuthorizationLoaderServiceGeneric<InstanceConfig> {
	constructor(private readonly instanceConfigRepo: InstanceConfigRepo) {}

	public async findById(id: EntityId): Promise<InstanceConfig> {
		const instanceConfig: InstanceConfig = await this.instanceConfigRepo.findById(id);

		return instanceConfig;
	}
}
