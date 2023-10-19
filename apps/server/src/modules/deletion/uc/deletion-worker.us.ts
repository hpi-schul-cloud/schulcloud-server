import { Injectable } from '@nestjs/common';
import { AuthorizationService } from '@src/modules/authorization';
import { DeletionRequestService } from '../services/deletion-request.service';
import { DeletionRequest } from '../domain/deletion-request.do';

@Injectable()
export class DeletionWorkerUc {
	constructor(
		private readonly deletionRequestService: DeletionRequestService,
		private readonly authorizationService: AuthorizationService
	) {}

	async findAllItemsByDeletionDate(): Promise<DeletionRequest[]> {
		return this.deletionRequestService.findAllItemsByDeletionDate();
	}
}
