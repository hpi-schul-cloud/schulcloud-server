import {
	DataDeletedEvent,
	DataDeletionDomainOperationLoggable,
	DeletionService,
	DomainDeletionReport,
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
	StatusModel,
	UserDeletedEvent,
} from '@modules/deletion';
import { Injectable } from '@nestjs/common';
import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { EntityId } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
import { BoardExternalReferenceType } from '../../domain';
import { MediaBoard } from '../../domain/media-board';
import { MediaBoardService } from '../media-board';
import { BoardNodeService } from '../board-node.service';

@Injectable()
@EventsHandler(UserDeletedEvent)
export class UserDeletedEventHandlerService implements DeletionService, IEventHandler<UserDeletedEvent> {
	constructor(
		private readonly boardNodeService: BoardNodeService,
		private readonly mediaBoardService: MediaBoardService,
		private readonly logger: Logger,
		private readonly eventBus: EventBus
	) {}

	public async handle({ deletionRequestId, targetRefId }: UserDeletedEvent): Promise<void> {
		const dataDeleted: DomainDeletionReport = await this.deleteUserData(targetRefId);

		await this.eventBus.publish(new DataDeletedEvent(deletionRequestId, dataDeleted));
	}

	public async deleteUserData(userId: EntityId): Promise<DomainDeletionReport> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable('Deleting data from Board', DomainName.BOARD, userId, StatusModel.PENDING)
		);

		const mediaBoards: MediaBoard[] = await this.mediaBoardService.findByExternalReference({
			type: BoardExternalReferenceType.User,
			id: userId,
		});

		await this.boardNodeService.delete(mediaBoards);
		const numberOfDeletedBoards = mediaBoards.length;
		const boardIds = mediaBoards.map((mb) => mb.id);

		const result: DomainDeletionReport = DomainDeletionReportBuilder.build(DomainName.CLASS, [
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
