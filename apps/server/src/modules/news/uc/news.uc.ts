import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EntityId, IPagination } from '@shared/domain';
import { AuthorizationService } from '../../authorization/authorization.service';
import { Logger } from '../../../core/logger/logger.service';
import { News, NewsTargetModel, NewsTargetModelValue, SchoolInfo } from '../entity';
import { NewsRepo, NewsTargetFilter } from '../repo/news.repo';
import { ICreateNews, INewsScope, IUpdateNews } from './news.interface';

type Permission = 'NEWS_VIEW' | 'NEWS_EDIT';

@Injectable()
export class NewsUc {
	constructor(private newsRepo: NewsRepo, private authorizationService: AuthorizationService, private logger: Logger) {
		this.logger.setContext(NewsUc.name);
	}

	async create(userId: EntityId, params: ICreateNews): Promise<News> {
		// TODO add school reference (implicit)
		// authorization
		const news = this.newsRepo.create(params);
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
		const permissions = unpublished ? ['NEWS_EDIT'] : ['NEWS_VIEW'];
		await this.authorizationService.checkUserSchoolPermissions(userId, schoolId, permissions);

		let newsList: News[];

		if (scope?.target == null) {
			// all news for all permitted targets and school
			const targets = await this.getTargetFilters(userId, Object.values(NewsTargetModel), permissions);
			newsList = await this.newsRepo.findAll(schoolId, targets, unpublished, pagination);
		} else if (scope.target.targetModel === 'school') {
			// all news for school only
			newsList = await this.newsRepo.findAllBySchool(schoolId, unpublished, pagination);
		} else {
			let target = await this.getTargetFilter(userId, scope.target.targetModel, scope.target.targetId, permissions);
			newsList = await this.newsRepo.findAllByTarget(schoolId, target, unpublished, pagination);
		}
		await Promise.all(
			newsList.map(async (news: News) => {
				await this.decoratePermissions(news, userId);
			})
		);

		this.logger.log(`return ${newsList.length} news for user ${userId}`);

		return newsList;
	}

	/**
	 *
	 * @param newsId
	 * @param userId
	 * @returns
	 */
	async findOneByIdForUser(newsId: EntityId, userId: EntityId): Promise<News> {
		const news = await this.newsRepo.findOneById(newsId);
		await this.decoratePermissions(news, userId);
		// await this.authorizeUserReadNews(news, userId);
		return news;
	}

	async update(id: EntityId, params: IUpdateNews): Promise<any> {
		return {
			title: 'title',
			body: 'content',
			displayAt: new Date(),
		};
	}

	async remove(id: string) {
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
		let targetIds;
		if (targetId) {
			// all news for specific target
			await this.authorizationService.checkUserTargetPermissions(userId, targetModel, targetId, permissions);
			targetIds = [targetId];
		} else {
			targetIds = await this.authorizationService.getPermittedTargets(userId, targetModel, permissions);
		}
		return {
			targetModel,
			targetIds,
		};
	}

	private async decoratePermissions(news: News, userId: EntityId) {
		news.permissions = (await this.getEntityPermissions(userId, news)).filter((permission) =>
			permission.includes('NEWS')
		);
	}

	private async getEntityPermissions(userId: EntityId, news: News): Promise<string[]> {
		const permissions =
			news.targetModel && news.target
				? await this.authorizationService.getUserTargetPermissions(userId, news.targetModel, news.target.id)
				: await this.authorizationService.getUserSchoolPermissions(userId, news.school.id);

		return permissions;
	}

	private async authorizeUserReadNews(news: News, userId: EntityId): Promise<void> {
		let requiredUserPermission: Permission | null = null;
		const userPermissions = news.permissions;
		// todo new Date was Date.now() before
		if (news.displayAt > new Date()) {
			// request read permission for published news
			requiredUserPermission = 'NEWS_VIEW';
		} else {
			// request write permission for unpublished news
			requiredUserPermission = 'NEWS_EDIT';
		}
		if (userPermissions.includes(requiredUserPermission)) return;
		throw new UnauthorizedException('Nee nee nee...');
	}
}
