import { AuthorizationLoaderServiceGeneric } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { Instance } from '../domain';
import { InstanceRepo } from '../repo';

@Injectable()
export class InstanceService implements AuthorizationLoaderServiceGeneric<Instance> {
	constructor(private readonly instanceRepo: InstanceRepo) {}

	public async findById(id: EntityId): Promise<Instance> {
		const instance: Instance = await this.instanceRepo.findById(id);

		return instance;
	}

	public async getInstance(): Promise<Instance> {
		const instance: Instance = await this.instanceRepo.getInstance();

		return instance;
	}
}
