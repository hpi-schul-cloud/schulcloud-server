import { EntityName, FilterQuery, QueryOrderMap } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { IFindOptions } from '@shared/domain/interface';
import { Counted, EntityId } from '@shared/domain/types';
import { BaseRepo } from '@shared/repo/base.repo';
import { getFieldName } from '@shared/repo/utils/repo-helper';
import { NewsTargetFilter } from './news-target-filter';
import { CourseNews, News, SchoolNews, TeamNews } from './news.entity';
import { NewsScope } from './scope/news-scope';

@Injectable()
export class NewsRepo extends BaseRepo<News> {
	private readonly propertiesToPopulate = ['school', 'target', 'creator', 'updater'];

	get entityName(): EntityName<News> {
		return News;
	}

	/**
	 * Find news
	 * @param targets
	 * @param options
	 */
	public async findAllPublished(targets: NewsTargetFilter[], options?: IFindOptions<News>): Promise<Counted<News[]>> {
		const scope = new NewsScope();
		scope.byTargets(targets);
		scope.byPublished();

		const countedNewsList = await this.findNewsAndCount(scope.query, options);
		return countedNewsList;
	}

	/**
	 * Find news
	 * @param targets
	 * @param creatorId - creatorId
	 * @param options
	 */
	public async findAllUnpublishedByUser(
		targets: NewsTargetFilter[],
		creatorId: EntityId,
		options?: IFindOptions<News>
	): Promise<Counted<News[]>> {
		const scope = new NewsScope();
		scope.byTargets(targets);
		scope.byUnpublished();
		scope.byCreator(creatorId);

		const countedNewsList = await this.findNewsAndCount(scope.query, options);
		return countedNewsList;
	}

	/** resolves a news document with some elements (school, target, and updator/creator) populated already */
	public async findOneById(id: EntityId): Promise<News> {
		const newsEntity = await this._em.findOneOrFail(News, id);
		await this._em.populate(newsEntity, this.propertiesToPopulate as never[]);
		return newsEntity;
	}

	public async findByCreatorOrUpdaterId(userId: EntityId): Promise<Counted<News[]>> {
		const scope = new NewsScope('$or');
		scope.byCreator(userId);
		scope.byUpdater(userId);

		const countedNewsList = await this.findNewsAndCount(scope.query);
		return countedNewsList;
	}

	public async removeUserReference(userId: EntityId): Promise<[number, number]> {
		const id = new ObjectId(userId);

		const creatorFieldName = getFieldName(this._em, 'creator', News.name);
		const updaterFieldName = getFieldName(this._em, 'updater', News.name);

		const countCreator = await this._em.nativeUpdate(News, { creator: id }, {
			$unset: { [creatorFieldName]: '' },
		} as Partial<News>);

		const countUpdater = await this._em.nativeUpdate(News, { updater: id }, {
			$unset: { [updaterFieldName]: '' },
		} as Partial<News>);

		return [countCreator, countUpdater];
	}

	/** resolves a news documents list with some elements (school, target, and updator/creator) populated already */
	private async findNewsAndCount(query: FilterQuery<News>, options?: IFindOptions<News>): Promise<Counted<News[]>> {
		const { pagination, order } = options || {};
		const [newsEntities, count] = await this._em.findAndCount(News, query, {
			...pagination,
			orderBy: order as QueryOrderMap<News>,
		});
		// populate target for all inheritances of news which not works when the list contains different types
		const schoolNews = newsEntities.filter((news) => news instanceof SchoolNews);
		await this._em.populate(schoolNews, this.propertiesToPopulate as never[]);
		const teamNews = newsEntities.filter((news) => news instanceof TeamNews);
		await this._em.populate(teamNews, this.propertiesToPopulate as never[]);
		const courseNews = newsEntities.filter((news) => news instanceof CourseNews);
		await this._em.populate(courseNews, this.propertiesToPopulate as never[]);
		return [newsEntities, count];
	}
}
