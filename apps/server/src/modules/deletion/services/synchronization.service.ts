import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ObjectId } from 'bson';
import { SynchronizationRepo } from '../repo';
import { Synchronization } from '../domain';

@Injectable()
export class SynchronizationService {
	constructor(private readonly synchronizationRepo: SynchronizationRepo) {}

	async createSynchronization(): Promise<EntityId> {
		const newSynchronization = new Synchronization({ id: new ObjectId().toHexString() });

		await this.synchronizationRepo.create(newSynchronization);

		return newSynchronization.id;
	}

	async findById(synchronizationId: EntityId): Promise<Synchronization> {
		const synchronization = await this.synchronizationRepo.findById(synchronizationId);

		return synchronization;
	}
}
