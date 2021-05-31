import { Injectable } from '@nestjs/common';
import { EntityId, IPagination } from '@shared/domain';
import { AuthorizationService, EntityTypeValue } from '../../authorization/authorization.service';
import { Logger } from '../../../core/logger/logger.service';
import { News, NewsTargetModel, NewsTargetModelValue } from '../entity';
import { NewsRepo } from '../repo/news.repo';
import { ICreateNews, INewsScope, IUpdateNews } from './news.interface';
import { NewsTargetFilter } from '../repo/news-target-filter';

type Permission = 'NEWS_VIEW' | 'NEWS_EDIT';

@Injectable()
export class NewsUc {
	constructor(private newsRepo: NewsRepo, private authorizationService: AuthorizationService, private logger: Logger) {
		this.logger.setContext(NewsUc.name);
	}

	async create(userId: EntityId, schoolId: EntityId, params: ICreateNews): Promise<News> {
		// TODO authorization
		const props = {
			...params,
			school: schoolId,
			creator: userId,
		};
		const newsEntity = new News(props);
		const news = await this.newsRepo.create(newsEntity);
		return news;
	}

	/**
	 *
	 * @param userId
	 * @param schoolId
	 * @param scope
	 * @param pagination
	 * @returns
	 */
	async findAllForUserAndSchool(
		userId: EntityId,
		schoolId: EntityId,
		scope?: INewsScope,
		pagination?: IPagination
	): Promise<News[]> {
		// 1. isAuthorized(userId, schoolId, 'NEWS_READ')
		// 2. user, resource, permission
		// 		yields list of ids
		// 		getAuthorizedEntities(userId, 'Course', 'NEWS_READ'): EntityId[]
		// 3. user, resource (by id)
		// 		getPermissions(userId, 'Course', courseId)
		this.logger.log(`start find all news for user ${userId}`);

		const unpublished = !!scope?.unpublished;
		const permissions: Permission[] = NewsUc.getRequiredPermissions(unpublished);
		await this.authorizationService.checkEntityPermissions(userId, 'school', schoolId, permissions);

		let newsList: News[];

		if (scope?.target == null) {
			// all news for all permitted targets and school
			const targets = await this.getTargetFilters(userId, Object.values(NewsTargetModel), permissions);
			newsList = await this.newsRepo.findAll(schoolId, targets, unpublished, pagination);
		} else if (scope.target.targetModel === 'school') {
			// all news for school only
			newsList = await this.newsRepo.findAllBySchool(schoolId, unpublished, pagination);
		} else {
			const target = await this.getTargetFilter(userId, scope.target.targetModel, scope.target.targetId, permissions);
			newsList = await this.newsRepo.findAllByTarget(schoolId, target, unpublished, pagination);
		}
		await Promise.all(
			newsList.map(async (news: News) => {
				news.permissions = await this.getNewsPermissions(userId, news);
			})
		);

		this.logger.log(`return ${newsList.length} news for user ${userId}`);

		return newsList;
	}

	/**
	 *
	 * @param id
	 * @param userId
	 * @returns
	 */
	async findOneByIdForUser(id: EntityId, userId: EntityId): Promise<News> {
		const news = await this.newsRepo.findOneById(id);
		const requiredPermissions = NewsUc.getRequiredPermissions(news.displayAt > new Date());
		const newsTarget = NewsUc.getTarget(news);
		await this.authorizationService.checkEntityPermissions(
			userId,
			newsTarget.targetModel as EntityTypeValue,
			newsTarget.targetId,
			requiredPermissions
		);
		news.permissions = await this.getNewsPermissions(userId, news);
		return news;
	}

	async update(id: EntityId, userId: EntityId, params: IUpdateNews): Promise<News> {
		this.logger.log(`start update news ${id}`);
		// TODO replace with real functionality
		const news = await this.findOneByIdForUser(id, userId);
		return news;
	}

	async remove(id: EntityId): Promise<EntityId> {
		this.logger.log(`start remove news ${id}`);
		// TODO replace with real functionality
		await Promise.resolve();
		return id;
	}

	private async getTargetFilters(
		userId: EntityId,
		targetModels: NewsTargetModelValue[],
		permissions: string[]
	): Promise<NewsTargetFilter[]> {
		const targets = await Promise.all(
			targetModels.map((targetModel) => this.getTargetFilter(userId, targetModel, undefined, permissions))
		);
		const nonEmptyTargets = targets.filter((target) => target.targetIds.length > 0);

		return nonEmptyTargets;
	}

	private async getTargetFilter(
		userId: EntityId,
		targetModel: NewsTargetModelValue,
		targetId?: EntityId,
		permissions: string[] = []
	): Promise<NewsTargetFilter> {
		let targetIds: EntityId[];
		if (targetId) {
			// all news for specific target
			await this.authorizationService.checkEntityPermissions(userId, targetModel, targetId, permissions);
			targetIds = [targetId];
		} else {
			targetIds = await this.authorizationService.getPermittedEntities(userId, targetModel, permissions);
		}
		return {
			targetModel,
			targetIds,
		};
	}

	private async getNewsPermissions(userId: EntityId, news: News): Promise<string[]> {
		const newsTarget = NewsUc.getTarget(news);
		const permissions = await this.authorizationService.getEntityPermissions(
			userId,
			newsTarget.targetModel as EntityTypeValue,
			newsTarget.targetId
		);
		return permissions.filter((permission) => permission.includes('NEWS'));
	}

	private static getTarget(news: News) {
		const target =
			news.targetModel && news.target
				? { targetModel: news.targetModel, targetId: news.target.id }
				: { targetModel: 'school', targetId: news.school.id };
		return target;
	}

	private static getRequiredPermissions(unpublished: boolean): Permission[] {
		return unpublished ? ['NEWS_EDIT'] : ['NEWS_VIEW'];
	}
}
