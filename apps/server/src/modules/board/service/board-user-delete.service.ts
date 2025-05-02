import {
	DataDeletionDomainOperationLoggable,
	DeletionService,
	DomainDeletionReport,
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
	StatusModel,
	UserDeletionInjectionService,
} from '../../deletion';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { Logger } from '@core/logger';
import { BoardExternalReferenceType, MediaBoard } from '../domain';
import { BoardNodeService } from './board-node.service';
import { MediaBoardService } from './media-board/media-board.service';

// @deprecated 'This service is replaced by DeleteUserSubmissionDataStep.'
@Injectable()
export class BoardUserDeleteService implements DeletionService {
	constructor(
		private readonly boardNodeService: BoardNodeService,
		private readonly mediaBoardService: MediaBoardService,
		private readonly logger: Logger,
		userDeletionInjectionService: UserDeletionInjectionService
	) {
		this.logger.setContext(BoardUserDeleteService.name);
		userDeletionInjectionService.injectUserDeletionService(this);
	}

	public async deleteUserData(userId: EntityId): Promise<DomainDeletionReport> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable('Deleting data from Board', DomainName.BOARD, userId, StatusModel.PENDING)
		);

		const mediaBoards: MediaBoard[] = await this.mediaBoardService.findByExternalReference({
			type: BoardExternalReferenceType.User,
			id: userId,
		});

		await Promise.all(
			mediaBoards.map(async (mb) => {
				await this.boardNodeService.delete(mb);
			})
		);

		const numberOfDeletedBoards = mediaBoards.length;
		const boardIds = mediaBoards.map((mb) => mb.id);

		const result: DomainDeletionReport = DomainDeletionReportBuilder.build(DomainName.BOARD, [
			DomainOperationReportBuilder.build(OperationType.DELETE, numberOfDeletedBoards, boardIds),
		]);

		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Successfully removed user data from Board',
				DomainName.BOARD,
				userId,
				StatusModel.FINISHED,
				0,
				numberOfDeletedBoards
			)
		);

		return result;
	}
}
