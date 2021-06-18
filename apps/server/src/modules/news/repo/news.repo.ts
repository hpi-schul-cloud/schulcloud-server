import { Injectable } from '@nestjs/common';
import { EntityId, IFindOptions } from '@shared/domain';
import { Counted } from '@shared/domain/types';
import { FilterQuery } from '@mikro-orm/core';
import { BaseRepo } from '@shared/repo/base.repo';
import { QueryOrderMap } from '@mikro-orm/core/enums';
import { News } from '../entity';
import { NewsScope } from './news-scope';
import { NewsTargetFilter } from './news-target-filter';

@Injectable()
export class NewsRepo extends BaseRepo<News> {
	/**
	 * Find news
	 * @param targets
	 * @param unpublished
	 * @param options
	 */
	async findAll(
		targets: NewsTargetFilter[],
		unpublished: boolean,
		options?: IFindOptions<News>
	): Promise<Counted<News[]>> {
		const scope = new NewsScope();
		scope.byTargets(targets);
		scope.byUnpublished(unpublished);
		const countedNewsList = await this.findNewsAndCount(scope.query, options);
		return countedNewsList;
	}

	/** resolves a news document with some elements names (school, updator/creator) populated already */
	async findOneById(id: EntityId): Promise<News> {
		const news = await this.em.findOneOrFail(News, id, ['school', 'creator', 'updater']);
		return news;
	}

	private async findNewsAndCount(query: FilterQuery<News>, options?: IFindOptions<News>): Promise<Counted<News[]>> {
		const { pagination, order } = options || {};
		const [obj, count] = await this.em.findAndCount(News, query, {
			...pagination,
			orderBy: order as QueryOrderMap,
		});
		const newsList = await this.em.populate(obj, ['school', 'creator', 'updater']);
		return [newsList, count];
	}
}
