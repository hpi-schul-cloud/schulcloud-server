import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mongodb';
import { EntityId, IPagination } from '@shared/domain';
import { Counted } from '@shared/domain/types';
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
	async findAll(
		targets: NewsTargetFilter[],
		unpublished: boolean,
		pagination: IPagination = {}
	): Promise<Counted<News[]>> {
		const scope = new NewsScope();
		scope.byTargets(targets);
		scope.byUnpublished(unpublished);
		// TODO sort by publishedAt?
		// scope.sortBy(...)
		const countedNewsList = await this.findNewsAndCount(scope.query, pagination);
		return countedNewsList;
	}

	/** resolves a news document with some elements names (school, updator/creator) populated already */
	async findOneById(id: EntityId): Promise<News> {
		const news = await this.em.findOneOrFail(News, id, ['school', 'creator', 'updater']);
		return news;
	}

	async delete(news: News): Promise<void> {
		await this.em.removeAndFlush(news);
	}

	private async findNewsAndCount(query, pagination: IPagination): Promise<Counted<News[]>> {
		const [obj, count] = await this.em.findAndCount(News, query, {
			...pagination,
		});
		const newsList = await this.em.populate(obj, ['school', 'creator', 'updater']);
		return [newsList, count];
	}
}
