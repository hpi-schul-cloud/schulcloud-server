import { Injectable } from '@nestjs/common';
import { News, NewsTargetModel } from '../entity/news.entity';
import { PaginationModel } from '../../../shared/repo/interface/pagination.interface';
import { EntityManager } from '@mikro-orm/mongodb';
import { EntityId } from '../../../shared/domain';
import { ICreateNews } from '../uc';
import { Dictionary, Reference } from '@mikro-orm/core';
import { INewsScope } from '../uc/news-scope.interface';
import { targetModels } from '../../../../../../src/services/news/constants';
export interface NewsTarget {
	targetModel: NewsTargetModel;
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

	findAllBySchool(schoolId: EntityId, pagination: PaginationModel = {}): Promise<News[]> {
		const query = { $and: [{ school: schoolId }, { $and: [{ targetModel: null }, { target: null }] }] };

		const newsList = this.em.find(News, query, {
			populate: ['school', 'creator', 'updater'],
			...pagination,
		});
		return newsList;
	}

	async findAllByTargets(schoolId: EntityId, targets: NewsTarget[], pagination: PaginationModel = {}): Promise<News[]> {
		const subQueries = [];

		subQueries.push({ school: schoolId });

		const targetSubQuery = targets.map((target) => {
			$and: [{ targetModel: target.targetModel }, { 'target:in': target.targetIds }];
		});

		subQueries.push(...targetSubQuery);

		const query = subQueries.length > 1 ? { $and: subQueries } : subQueries[0];

		const newsList = this.em.find(News, query, {
			populate: ['school', 'creator', 'updater'],
			...pagination,
		});
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
}
