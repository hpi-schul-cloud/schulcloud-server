import { Injectable } from '@nestjs/common';
import { DomainName, EntityId, OperationType, StatusModel } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
import { DataDeletionDomainOperationLoggable } from '@shared/common/loggable';
import { NewsRepo } from '@shared/repo';
import { DomainOperationBuilder } from '@shared/domain/builder';
import { DomainOperation } from '@shared/domain/interface';
import { News } from '@shared/domain/entity';

@Injectable()
export class NewsService {
	constructor(private readonly newsRepo: NewsRepo, private readonly logger: Logger) {
		this.logger.setContext(NewsService.name);
	}

	public async deleteCreatorOrUpdaterReference(userId: EntityId): Promise<DomainOperation> {
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

		const result = DomainOperationBuilder.build(
			DomainName.NEWS,
			OperationType.UPDATE,
			counterOfNews,
			this.getNewsId(newsWithUserData)
		);

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
