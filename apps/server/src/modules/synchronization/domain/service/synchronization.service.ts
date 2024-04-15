import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ObjectId } from 'bson';
import { Synchronization } from '../do';
import { SynchronizationRepo } from '../../repo';
import { SynchronizationStatusModel } from '../types';

@Injectable()
export class SynchronizationService {
	constructor(private readonly synchronizationRepo: SynchronizationRepo) {}

	async createSynchronization(systemId: string): Promise<EntityId> {
		const newSynchronization = new Synchronization({
			id: new ObjectId().toHexString(),
			systemId,
			status: SynchronizationStatusModel.REGISTERED,
		});

		await this.synchronizationRepo.create(newSynchronization);

		return newSynchronization.id;
	}

	async findById(synchronizationId: EntityId): Promise<Synchronization> {
		const synchronization = await this.synchronizationRepo.findById(synchronizationId);

		return synchronization;
	}

	async update(synchronization: Synchronization): Promise<void> {
		await this.synchronizationRepo.update(synchronization);
	}
}
