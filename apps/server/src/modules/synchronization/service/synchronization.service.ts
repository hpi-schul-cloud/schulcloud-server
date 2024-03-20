import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ObjectId } from 'bson';
import { StatusModel } from '@modules/deletion';
import { Synchronization } from '../domain';
import { SynchronizationRepo } from '../repo';

@Injectable()
export class SynchronizationService {
	constructor(private readonly synchronizationRepo: SynchronizationRepo) {}

	async createSynchronization(): Promise<EntityId> {
		const newSynchronization = new Synchronization({
			id: new ObjectId().toHexString(),
			status: StatusModel.REGISTERED,
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
