import { Injectable } from '@nestjs/common';
import { EntityId, StatusModel } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
import { NewsRepo } from '@shared/repo';
import { News } from '@shared/domain/entity';
import { IEventHandler, EventBus, EventsHandler } from '@nestjs/cqrs';
import {
	UserDeletedEvent,
	DeletionService,
	DataDeletedEvent,
	DomainDeletionReport,
	DomainName,
	DomainDeletionReportBuilder,
	DomainOperationReportBuilder,
	OperationType,
	DataDeletionDomainOperationLoggable,
} from '@modules/deletion';

@Injectable()
@EventsHandler(UserDeletedEvent)
export class NewsService implements DeletionService, IEventHandler<UserDeletedEvent> {
	constructor(
		private readonly newsRepo: NewsRepo,
		private readonly logger: Logger,
		private readonly eventBus: EventBus
	) {
		this.logger.setContext(NewsService.name);
	}

	public async handle({ deletionRequestId, targetRefId }: UserDeletedEvent): Promise<void> {
		const dataDeleted = await this.deleteUserData(targetRefId);
		await this.eventBus.publish(new DataDeletedEvent(deletionRequestId, dataDeleted));
	}

	public async deleteUserData(userId: EntityId): Promise<DomainDeletionReport> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Deleting user data from News',
				DomainName.NEWS,
				userId,
				StatusModel.PENDING
			)
		);

		const [newsWithUserData, counterOfNews] = await this.newsRepo.findByCreatorOrUpdaterId(userId);

		newsWithUserData.forEach((newsEntity) => {
			newsEntity.removeCreatorReference(userId);
			newsEntity.removeUpdaterReference(userId);
		});

		await this.newsRepo.save(newsWithUserData);

		const result = DomainDeletionReportBuilder.build(DomainName.NEWS, [
			DomainOperationReportBuilder.build(OperationType.UPDATE, counterOfNews, this.getNewsId(newsWithUserData)),
		]);

		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Successfully removed user data from News',
				DomainName.NEWS,
				userId,
				StatusModel.FINISHED,
				counterOfNews,
				0
			)
		);
		return result;
	}

	private getNewsId(news: News[]): EntityId[] {
		return news.map((item) => item.id);
	}
}
