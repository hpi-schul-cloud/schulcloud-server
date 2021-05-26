import { Injectable } from '@nestjs/common';
import { News, NewsTargetModelValue } from '../entity/news.entity';
import { PaginationModel } from '../../../shared/repo/interface/pagination.interface';
import { EntityManager } from '@mikro-orm/mongodb';
import { EntityId } from '../../../shared/domain';
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
	 * @param pagination
	 */
	async findAll(schoolId: EntityId, targets: NewsTargetFilter[], pagination: PaginationModel = {}): Promise<News[]> {
		const targetSubQuery: FilterQuery<News>[] = [];
		// include all targets
		targets.forEach((target) => {
			targetSubQuery.push({ $and: [{ targetModel: target.targetModel }, { 'target:in': target.targetIds }] });
		});
		// include school
		targetSubQuery.push({ $and: [{ targetModel: null }, { target: null }] });

		const targetQuery = targetSubQuery.length > 1 ? { $or: targetSubQuery } : targetSubQuery[0];
		const query = { $and: [{ school: schoolId }, targetQuery] };

		const newsList = await this.findNews(query, pagination);
		return newsList;
	}

	/**
	 * Find news for school only
	 * @param schoolId
	 * @param pagination
	 * @returns
	 */
	async findAllBySchool(schoolId: EntityId, pagination: PaginationModel = {}): Promise<News[]> {
		const query = { $and: [{ school: schoolId }, { $and: [{ targetModel: null }, { target: null }] }] };
		const newsList = await this.findNews(query, pagination);
		return newsList;
	}

	/**
	 * Find news for a specific target
	 * @param schoolId
	 * @param target
	 * @param pagination
	 * @returns
	 */
	async findAllByTarget(
		schoolId: EntityId,
		target: NewsTargetFilter,
		pagination: PaginationModel = {}
	): Promise<News[]> {
		const query = { $and: [{ school: schoolId }, { targetModel: target.targetModel, 'target:in': target.targetIds }] };

		const newsList = await this.findNews(query, pagination);
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
