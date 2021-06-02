import { Injectable } from '@nestjs/common';
import { PaginationModel } from '@shared/repo/interface/pagination.interface';
import { EntityManager } from '@mikro-orm/mongodb';
import { EntityId } from '@shared/domain';
import { Counted } from '@shared/types';
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
	 * Find news for all targets including school
	 * @param schoolId
	 * @param targets
	 * @param unpublished
	 * @param pagination
	 */
	async findAll(
		schoolId: EntityId,
		targets: NewsTargetFilter[],
		unpublished: boolean,
		pagination: PaginationModel = {}
	): Promise<Counted<News[]>> {
		const scope = new NewsScope();
		scope.bySchool(schoolId);
		scope.byAllTargets(targets);
		scope.byUnpublished(unpublished);

		const countedNewsList = await this.findNews(scope.query, pagination);
		return countedNewsList;
	}

	/**
	 * Find news for school only
	 * @param schoolId
	 * @param unpublished
	 * @param pagination
	 * @returns
	 */
	async findAllBySchool(
		schoolId: EntityId,
		unpublished: boolean,
		pagination: PaginationModel = {}
	): Promise<Counted<News[]>> {
		const scope = new NewsScope().bySchool(schoolId).byEmptyTarget().byUnpublished(unpublished);
		const countedNewsList = await this.findNews(scope.query, pagination);
		return countedNewsList;
	}

	/**
	 * Find news for a specific target
	 * @param schoolId
	 * @param target
	 * @param unpublished
	 * @param pagination
	 * @returns
	 */
	async findAllByTarget(
		schoolId: EntityId,
		target: NewsTargetFilter,
		unpublished: boolean,
		pagination: PaginationModel = {}
	): Promise<Counted<News[]>> {
		const scope = new NewsScope().bySchool(schoolId).byTarget(target).byUnpublished(unpublished);

		const countedNewsList = await this.findNews(scope.query, pagination);
		return countedNewsList;
	}

	/** resolves a news document with some elements names (school, updator/creator) populated already */
	async findOneById(id: EntityId): Promise<News> {
		const news = await this.em.findOneOrFail(News, id, ['school', 'creator', 'updater']);
		return news;
	}

	// remove(id: EntityId): string {
	// 	return `This action removes a #${id} news`;
	// }

	private async findNews(query, pagination: PaginationModel): Promise<Counted<News[]>> {
		const [obj, count] = await this.em.findAndCount(News, query, {
			...pagination,
		});
		const newsList = await this.em.populate(obj, ['school', 'creator', 'updater']);
		return [newsList, count];
	}
}
