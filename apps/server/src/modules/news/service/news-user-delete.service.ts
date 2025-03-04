import { Logger } from '@core/logger';
import {
	DataDeletionDomainOperationLoggable,
	DomainDeletionReport,
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
	StatusModel,
	UserDeletionInjectionService,
	UserDeletionService,
} from '@modules/deletion';
import { Injectable } from '@nestjs/common';
import { News } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { NewsRepo } from '@shared/repo/news';

@Injectable()
export class NewsUserDeleteService implements UserDeletionService {
	constructor(
		private readonly newsRepo: NewsRepo,
		private readonly logger: Logger,
		userDeletionInjectionService: UserDeletionInjectionService
	) {
		this.logger.setContext(NewsUserDeleteService.name);
		userDeletionInjectionService.injectUserDeletionService(this);
	}

	public getDomainName(): DomainName {
		return DomainName.NEWS;
	}

	public async invokeUserDeletion(userId: EntityId): Promise<DomainDeletionReport> {
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

	// TODO: Implement this method
	public compensateUserDeletion(userId: EntityId): void {
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Compensating user data deletion from News',
				DomainName.NEWS,
				userId,
				StatusModel.PENDING
			)
		);
	}

	private getNewsId(news: News[]): EntityId[] {
		return news.map((item) => item.id);
	}
}
