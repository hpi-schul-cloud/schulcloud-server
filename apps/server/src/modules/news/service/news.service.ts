import { Injectable } from '@nestjs/common';
import { DomainModel, EntityId, StatusModel } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
import { DataDeletionDomainOperationLoggable } from '@shared/common/loggable';
import { NewsRepo } from '@shared/repo';

@Injectable()
export class NewsService {
	constructor(private readonly newsRepo: NewsRepo, private readonly logger: Logger) {
		this.logger.setContext(NewsService.name);
	}

	public async deleteCreatorOrUpdaterReference(userId: EntityId): Promise<number> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Deleting user data from News',
				DomainModel.NEWS,
				userId,
				StatusModel.PENDING
			)
		);

		const news = await this.newsRepo.findByCreatorOrUpdaterId(userId);

		const newsCount = news[1];
		if (newsCount === 0) {
			return 0;
		}

		news[0].forEach((newsEntity) => {
			newsEntity.removeCreatorReference(userId);
			newsEntity.removeUpdaterReference(userId);
		});

		await this.newsRepo.save(news[0]);

		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Successfully removed user data from News',
				DomainModel.NEWS,
				userId,
				StatusModel.FINISHED,
				newsCount,
				0
			)
		);
		return newsCount;
	}
}
