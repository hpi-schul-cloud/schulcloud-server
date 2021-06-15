import { Injectable } from '@nestjs/common';
import { News } from '../entity/news.entity';
import { PaginationModel } from '../../../shared/core/repo/interface/pagination.interface';
import { EntityManager } from '@mikro-orm/mongodb';
import { EntityId } from '../../../shared/domain';
import { ICreateNewsDto } from '../uc';
import { Dictionary } from '@mikro-orm/core';

@Injectable()
export class NewsRepo {
	constructor(private readonly em: EntityManager) {}

	async create(props: ICreateNewsDto): Promise<News> {
		const news = this.em.create(News, props);
		this.em.persistAndFlush(news);
		return news;
	}

	async findAllByUser(userId: EntityId, pagination: PaginationModel = {}): Promise<News[]> {
		// TODO filter by user scopes
		const newsList = this.em.find(
			News,
			{},
			{
				populate: ['school', 'creator', 'updater'],
				...pagination,
			}
		);
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
