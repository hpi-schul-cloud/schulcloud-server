import { Logger } from '@core/logger';
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
} from '@modules/deletion';
import { Injectable } from '@nestjs/common';
import type { News } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { NewsRepo } from '@shared/repo/news';

@Injectable()
export class NewsUserDeleteService implements DeletionService {
	constructor(
		private readonly newsRepo: NewsRepo,
		private readonly logger: Logger,
		userDeletionInjectionService: UserDeletionInjectionService
	) {
		this.logger.setContext(NewsUserDeleteService.name);
		userDeletionInjectionService.injectUserDeletionService(this);
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

		this.newsRepo.persist(newsWithUserData);

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
