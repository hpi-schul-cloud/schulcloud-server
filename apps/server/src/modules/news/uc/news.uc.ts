import { Injectable } from '@nestjs/common';
import { EntityId, IPagination } from '@shared/domain';
import { Counted } from '@shared/types';
import { AuthorizationService } from '../../authorization/authorization.service';
import { Logger } from '../../../core/logger/logger.service';
import { News, NewsTargetModel, NewsTargetModelValue, ICreateNews, INewsScope, IUpdateNews } from '../entity';
import { NewsRepo } from '../repo/news.repo';
import { NewsTargetFilter } from '../repo/news-target-filter';

type Permission = 'NEWS_VIEW' | 'NEWS_EDIT';

@Injectable()
export class NewsUc {
	constructor(private newsRepo: NewsRepo, private authorizationService: AuthorizationService, private logger: Logger) {
		this.logger.setContext(NewsUc.name);
	}

	/**
	 *
	 * @param userId
	 * @param schoolId
	 * @param params
	 * @returns
	 */
	async create(userId: EntityId, schoolId: EntityId, params: ICreateNews): Promise<News> {
		this.logger.log(`create news as user ${userId}`);

		const { targetModel, targetId } = params.target;
		await this.authorizationService.checkEntityPermissions(userId, targetModel, targetId, ['NEWS_CREATE']);

		const { target, ...props } = params;
		const news = News.createInstance(targetModel, {
			...props,
			school: schoolId,
			creator: userId,
			target: targetId,
		});
		await this.newsRepo.save(news);

		this.logger.log(`news ${news.id} created by user ${userId}`);

		return news;
	}

	/**
	 *
	 * @param userId
	 * @param scope
	 * @param pagination
	 * @returns
	 */
	async findAllForUser(userId: EntityId, scope?: INewsScope, pagination?: IPagination): Promise<Counted<News[]>> {
		this.logger.log(`start find all news for user ${userId}`);

		const unpublished = !!scope?.unpublished; // default is only published news
		const permissions: [Permission] = NewsUc.getRequiredPermissions(unpublished);

		const targets = await this.getPermittedTargets(userId, scope, permissions);
		const [newsList, newsCount] = await this.newsRepo.findAll(targets, unpublished, pagination);

		await Promise.all(
			newsList.map(async (news: News) => {
				news.permissions = await this.getNewsPermissions(userId, news);
			})
		);

		this.logger.log(`return ${newsList.length} news for user ${userId}`);

		return [newsList, newsCount];
	}

	/**
	 *
	 * @param id
	 * @param userId
	 * @returns
	 */
	async findOneByIdForUser(id: EntityId, userId: EntityId): Promise<News> {
		this.logger.log(`start find one news ${id}`);

		const news = await this.newsRepo.findOneById(id);
		const isPublished = news.displayAt > new Date();
		const requiredPermissions = NewsUc.getRequiredPermissions(isPublished);
		await this.authorizationService.checkEntityPermissions(
			userId,
			news.targetModel,
			news.target.id,
			requiredPermissions
		);
		news.permissions = await this.getNewsPermissions(userId, news);

		return news;
	}

	/**
	 *
	 * @param id
	 * @param userId
	 * @param params
	 * @returns
	 */
	async update(id: EntityId, userId: EntityId, params: IUpdateNews): Promise<News> {
		this.logger.log(`start update news ${id}`);

		const news = await this.newsRepo.findOneById(id);
		await this.authorizationService.checkEntityPermissions(userId, news.targetModel, news.target.id, ['NEWS_EDIT']);

		// eslint-disable-next-line no-restricted-syntax
		for (const [key, value] of Object.entries(params)) {
			if (value) {
				news[key] = value;
			}
		}

		await this.newsRepo.save(news);

		return news;
	}

	/**
	 *
	 * @param id
	 * @param userId
	 * @returns
	 */
	async delete(id: EntityId, userId: EntityId): Promise<EntityId> {
		this.logger.log(`start remove news ${id}`);

		const news = await this.newsRepo.findOneById(id);
		await this.authorizationService.checkEntityPermissions(userId, news.targetModel, news.target.id, ['NEWS_EDIT']);

		await this.newsRepo.delete(news);

		return id;
	}

	private async getPermittedTargets(userId: EntityId, scope: INewsScope | undefined, permissions: Permission[]) {
		let targets: NewsTargetFilter[];

		if (scope?.target == null) {
			// for all target models
			targets = await this.getTargetFilters(userId, Object.values(NewsTargetModel), permissions);
		} else {
			const { targetModel, targetId } = scope.target;
			if (targetModel && targetId) {
				// for specific news target
				await this.authorizationService.checkEntityPermissions(userId, targetModel, targetId, permissions);
				targets = [{ targetModel, targetIds: [targetId] }];
			} else {
				// for single target model
				targets = await this.getTargetFilters(userId, [targetModel], permissions);
			}
		}
		return targets;
	}

	private async getTargetFilters(
		userId: EntityId,
		targetModels: NewsTargetModelValue[],
		permissions: string[]
	): Promise<NewsTargetFilter[]> {
		const targets = await Promise.all(
			targetModels.map(async (targetModel) => {
				return {
					targetModel,
					targetIds: await this.authorizationService.getPermittedEntities(userId, targetModel, permissions),
				};
			})
		);
		const nonEmptyTargets = targets.filter((target) => target.targetIds.length > 0);

		return nonEmptyTargets;
	}

	private async getNewsPermissions(userId: EntityId, news: News): Promise<string[]> {
		const permissions = await this.authorizationService.getEntityPermissions(userId, news.targetModel, news.target.id);
		return permissions.filter((permission) => permission.includes('NEWS'));
	}

	/**
	 *
	 * @param unpublished news with displayAt set to future date are not published for users with view permission
	 * @returns
	 */
	private static getRequiredPermissions(unpublished: boolean): [Permission] {
		return unpublished ? ['NEWS_EDIT'] : ['NEWS_VIEW'];
	}
}
