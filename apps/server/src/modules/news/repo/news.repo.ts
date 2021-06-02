import { Injectable } from '@nestjs/common';
import { PaginationModel } from '@shared/repo/interface/pagination.interface';
import { EntityManager } from '@mikro-orm/mongodb';
import { EntityId } from '@shared/domain';
import { News } from '../entity';
import { NewsScope } from './news-scope';
import { NewsTargetFilter } from './news-target-filter';

@Injectable()
export class NewsRepo {
	constructor(private readonly em: EntityManager) {}

	async save(news: News): Promise<News> {
		await this.em.persistAndFlush(news);
		return news;
	}

	/**
	 * Find news
	 * @param targets
	 * @param unpublished
	 * @param pagination
	 */
	async findAll(targets: NewsTargetFilter[], unpublished: boolean, pagination: PaginationModel = {}): Promise<News[]> {
		const scope = new NewsScope();
		scope.byTargets(targets);
		scope.byUnpublished(unpublished);

		const newsList = await this.findNews(scope.query, pagination);
		return newsList;
	}

	/** resolves a news document with some elements names (school, updator/creator) populated already */
	async findOneById(id: EntityId): Promise<News> {
		const news = await this.em.findOneOrFail(News, id, ['school', 'creator', 'updater']);
		return news;
	}

	// remove(id: EntityId): string {
	// 	return `This action removes a #${id} news`;
	// }

	private async findNews(query, pagination: PaginationModel) {
		const obj = await this.em.find(News, query, {
			...pagination,
		});
		const newsList = await this.em.populate(obj, ['school', 'creator', 'updater']);
		return newsList;
	}
}
