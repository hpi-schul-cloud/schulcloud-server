import { Injectable } from '@nestjs/common';
import { FilterQuery } from '@mikro-orm/core';
import { BaseRepo } from '@shared/repo/base.repo';
import { QueryOrderMap } from '@mikro-orm/core/enums';
import { Counted, CourseNews, EntityId, IFindOptions, News, SchoolNews, TeamNews } from '@shared/domain';
import { NewsScope } from './news-scope';
import { NewsTargetFilter } from './news-target-filter';

@Injectable()
export class NewsRepo extends BaseRepo<News> {
	propertiesToPopulate = ['school', 'target', 'creator', 'updater'];

	get entityName() {
		return News;
	}

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

	/** resolves a news document with some elements (school, target, and updator/creator) populated already */
	async findOneById(id: EntityId): Promise<News> {
		const newsEntity = await this._em.findOneOrFail(News, id);
		await this._em.populate(newsEntity, this.propertiesToPopulate as never[]);
		return newsEntity;
	}

	/** resolves a news documents list with some elements (school, target, and updator/creator) populated already */
	private async findNewsAndCount(query: FilterQuery<News>, options?: IFindOptions<News>): Promise<Counted<News[]>> {
		const { pagination, order } = options || {};
		const [newsEntities, count] = await this._em.findAndCount(News, query, {
			...pagination,
			orderBy: order as QueryOrderMap<News>,
		});
		await this._em.populate(newsEntities, this.propertiesToPopulate as never[]);
		// populate target for all inheritances of news which not works when the list contains different types
		const discriminatorColumn = 'target';
		const schoolNews = newsEntities.filter((news) => news instanceof SchoolNews);
		await this._em.populate(schoolNews, [discriminatorColumn]);
		const teamNews = newsEntities.filter((news) => news instanceof TeamNews);
		await this._em.populate(teamNews, [discriminatorColumn]);
		const courseNews = newsEntities.filter((news) => news instanceof CourseNews);
		await this._em.populate(courseNews, [discriminatorColumn]);
		return [newsEntities, count];
	}
}
