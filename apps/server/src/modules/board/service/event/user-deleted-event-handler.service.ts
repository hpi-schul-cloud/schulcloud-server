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
import { BoardExternalReferenceType } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
import { MediaBoardService } from '../media-board';

@Injectable()
@EventsHandler(UserDeletedEvent)
export class UserDeletedEventHandlerService implements DeletionService, IEventHandler<UserDeletedEvent> {
	constructor(
		private readonly mediaBoardService: MediaBoardService,
		private readonly logger: Logger,
		private readonly eventBus: EventBus
	) {
		this.logger.setContext(UserDeletedEventHandlerService.name);
	}

	public async handle({ deletionRequestId, targetRefId }: UserDeletedEvent): Promise<void> {
		const dataDeleted: DomainDeletionReport = await this.deleteUserData(targetRefId);

		await this.eventBus.publish(new DataDeletedEvent(deletionRequestId, dataDeleted));
	}

	public async deleteUserData(userId: EntityId): Promise<DomainDeletionReport> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable('Deleting data from Board', DomainName.BOARD, userId, StatusModel.PENDING)
		);

		const boardIds: EntityId[] = await this.mediaBoardService.findIdsByExternalReference({
			type: BoardExternalReferenceType.User,
			id: userId,
		});

		const numberOfDeletedBoards: number = await this.mediaBoardService.deleteByExternalReference({
			type: BoardExternalReferenceType.User,
			id: userId,
		});

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
