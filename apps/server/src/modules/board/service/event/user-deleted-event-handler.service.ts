import { MikroORM, UseRequestContext } from '@mikro-orm/core';
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
import { BoardExternalReferenceType, MediaBoard } from '../../domain';
import { BoardNodeService } from '../board-node.service';
import { MediaBoardService } from '../media-board/media-board.service';

@Injectable()
@EventsHandler(UserDeletedEvent)
export class UserDeletedEventHandlerService implements DeletionService, IEventHandler<UserDeletedEvent> {
	constructor(
		private readonly boardNodeService: BoardNodeService,
		private readonly mediaBoardService: MediaBoardService,
		private readonly logger: Logger,
		private readonly eventBus: EventBus,
		private readonly orm: MikroORM
	) {
		this.logger.setContext(UserDeletedEventHandlerService.name);
	}

	@UseRequestContext()
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
