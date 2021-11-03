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
		const newsEntity = await this.em.findOneOrFail(News, id);
		await this.em.populate(newsEntity, this.propertiesToPopulate);
		return newsEntity;
	}

	/** resolves a news documents list with some elements (school, target, and updator/creator) populated already */
	private async findNewsAndCount(query: FilterQuery<News>, options?: IFindOptions<News>): Promise<Counted<News[]>> {
		const { pagination, order } = options || {};
		const [newsEntities, count] = await this.em.findAndCount(News, query, {
			...pagination,
			orderBy: order as QueryOrderMap,
		});
		await this.em.populate(newsEntities, this.propertiesToPopulate);
		// populate target for all inheritances of news which not works when the list contains different types
		const discriminatorColumn = 'target';
		const schoolNews = newsEntities.filter((news) => news instanceof SchoolNews);
		await this.em.populate(schoolNews, discriminatorColumn);
		const teamNews = newsEntities.filter((news) => news instanceof TeamNews);
		await this.em.populate(teamNews, discriminatorColumn);
		const courseNews = newsEntities.filter((news) => news instanceof CourseNews);
		await this.em.populate(courseNews, discriminatorColumn);
		return [newsEntities, count];
	}
}
