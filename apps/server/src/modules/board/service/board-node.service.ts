import { Injectable } from '@nestjs/common';
import { AnyBoardDo, EntityId } from '@shared/domain';
import { AuthorizationLoaderService } from '@src/modules/authorization';
import { BoardDoRepo } from '../repo';

@Injectable()
export class BoardNodeService implements AuthorizationLoaderService {
	constructor(private readonly boardDoRepo: BoardDoRepo) {}

	async findById(elementId: EntityId): Promise<AnyBoardDo> {
		const element = await this.boardDoRepo.findById(elementId);

		return element;
	}
}
