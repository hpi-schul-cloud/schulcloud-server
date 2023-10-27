import { Injectable } from '@nestjs/common';
import { DeletionLogRepo } from '../repo';

@Injectable()
export class DeletionLogService {
	constructor(private readonly deletionLogRepo: DeletionLogRepo) {}

	// async createLogRequest(userId: EntityId): Promise<string> {
	// 	const dateInFuture = new Date();
	// 	dateInFuture.setDate(dateInFuture.getDate() + 30);

	// 	const newDeletionLog = new DeletionLog({
	// 		id: new ObjectId().toHexString(),
	// 		scope: 'scope',
	// 		operation: DeletionOperationModel.DELETE,
	// 		deletionRequestId: new ObjectId(),
	// 		docIds: [new ObjectId(), new ObjectId()],
	// 	});

	// 	await this.deletionLogRepo.create(newDeletionLog);

	// 	return newDeletionLof.id;
	// }

	// async findById(deletionRequestId: EntityId): Promise<DeletionRequest> {
	// 	const deletionRequest: DeletionRequest = await this.deletionRequestRepo.findById(deletionRequestId);

	// 	return deletionRequest;
	// }

	// async findAllItemsByDeletionDate(): Promise<DeletionRequest[]> {
	// 	const itemsToDelete: DeletionRequest[] = await this.deletionRequestRepo.findAllItemsByDeletionDate();

	// 	return itemsToDelete;
	// }

	// async deleteById(deletionRequestId: EntityId): Promise<void> {
	// 	await this.deletionRequestRepo.deleteById(deletionRequestId);
	// }
}
