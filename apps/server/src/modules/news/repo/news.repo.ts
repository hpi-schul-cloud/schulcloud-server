import { Injectable } from '@nestjs/common';
import { News, NewsTargetModelValue } from '../entity/news.entity';
import { PaginationModel } from '@shared/repo/interface/pagination.interface';
import { EntityManager } from '@mikro-orm/mongodb';
import { EntityId } from '@shared/domain';
import { ICreateNews } from '../uc';
import { Dictionary, FilterQuery } from '@mikro-orm/core';

export interface NewsTargetFilter {
	targetModel: NewsTargetModelValue;
	targetIds: EntityId[];
}

@Injectable()
export class NewsRepo {
	constructor(private readonly em: EntityManager) {}

	async create(props: ICreateNews): Promise<News> {
		const news = this.em.create(News, props);
		this.em.persistAndFlush(news);
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
	): Promise<News[]> {
		const scope = new NewsScope();
		scope.bySchool(schoolId);
		scope.byAllTargets(targets);
		scope.byUnpublished(unpublished);

		const newsList = await this.findNews(scope.query, pagination);
		return newsList;
	}

	/**
	 * Find news for school only
	 * @param schoolId
	 * @param unpublished
	 * @param pagination
	 * @returns
	 */
	async findAllBySchool(schoolId: EntityId, unpublished: boolean, pagination: PaginationModel = {}): Promise<News[]> {
		const scope = new NewsScope().bySchool(schoolId).byEmptyTarget().byUnpublished(unpublished);
		const newsList = await this.findNews(scope.query, pagination);
		return newsList;
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
	): Promise<News[]> {
		const scope = new NewsScope().bySchool(schoolId).byTarget(target).byUnpublished(unpublished);

		const newsList = await this.findNews(scope.query, pagination);
		return newsList;
	}

	/** resolves a news document with some elements names (school, updator/creator) populated already */
	async findOneById(id: EntityId): Promise<News> {
		const news = this.em.findOneOrFail(News, id, ['school', 'creator', 'updater']);
		return news;
	}

	update(id: EntityId, props: Dictionary) {
		return `This action updates a #${id} news`;
	}

	remove(id: EntityId) {
		return `This action removes a #${id} news`;
	}

	private async findNews(query, pagination: PaginationModel) {
		const obj = await this.em.find(News, query, {
			...pagination,
		});
		const newsList = await this.em.populate(obj, ['school', 'creator', 'updater']);
		return newsList;
	}
}

class NewsScope {
	query: FilterQuery<News> = {};

	bySchool(schoolId: EntityId) {
		this.addQuery({ school: schoolId });
		return this;
	}

	// targets + school target
	byAllTargets(targets: NewsTargetFilter[]) {
		const queries: FilterQuery<News>[] = targets.map(this.getTargetQuery);
		queries.push(this.getEmptyTargetQuery());
		this.addQuery({ $or: queries });
		return this;
	}

	// single target
	byTarget(target: NewsTargetFilter) {
		this.addQuery(this.getTargetQuery(target));
		return this;
	}

	byEmptyTarget() {
		this.addQuery(this.getEmptyTargetQuery());
		return this;
	}

	byUnpublished(unpublished: boolean) {
		const now = new Date();
		this.addQuery({ displayAt: unpublished ? { $gt: now } : { $lte: now } });
		return this;
	}

	private addQuery(query: FilterQuery<News>) {
		if (Object.keys(this.query).length === 0) {
			this.query = query;
		} else {
			if (Array.isArray(this.query['$and'])) {
				this.query['$and'].push(query);
			} else {
				this.query = { $and: [Object.assign({}, this.query), query] };
			}
		}
	}

	private getTargetQuery(target: NewsTargetFilter): FilterQuery<News> {
		return { $and: [{ targetModel: target.targetModel }, { 'target:in': target.targetIds }] };
	}

	private getEmptyTargetQuery() {
		return { $and: [{ targetModel: null }, { target: null }] };
	}
}
