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
	DeletionService,
} from '@modules/deletion';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { News, NewsRepo } from '../../repo';

@Injectable()
export class NewsService implements DeletionService {
	constructor(
		private readonly newsRepo: NewsRepo,
		private readonly logger: Logger,
		userDeletionInjectionService: UserDeletionInjectionService
	) {
		this.logger.setContext(NewsService.name);
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

		await this.newsRepo.removeUserReference(userId);

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
