import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EntityId, IPagination } from '../../../shared/domain';
import { AuthorizationService } from '../../authorization/authorization.service';
import { ServerLogger } from '../../../core/logger/logger.service';
import { News, NewsTargetModel, NewsTargetModelValue, SchoolInfo } from '../entity';
import { NewsRepo, NewsTargetFilter } from '../repo/news.repo';
import { ICreateNews, INewsScope, IUpdateNews } from './news.interface';

type Permission = 'NEWS_VIEW' | 'NEWS_EDIT';
type Target = { targetModel?: string; target?: { id: string } };
type AuthorizationSubject = { school?: SchoolInfo; targetModel?: string; target?: { id: string } };

@Injectable()
export class NewsUc {
	constructor(
		private newsRepo: NewsRepo,
		private authorizationService: AuthorizationService,
		private logger: ServerLogger
	) {
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

		await this.authorizationService.checkUserSchoolPermissions(userId, schoolId, ['NEWS_VIEW']);

		let newsList: News[];

		if (scope == null) {
			// all news for all permitted targets
			const filters = await this.getTargetFilters(userId, Object.values(NewsTargetModel));
			newsList = await this.newsRepo.findAllByTargets(schoolId, filters, pagination);
		} else if (scope.targetModel === 'school') {
			// all news for school
			newsList = await this.newsRepo.findAllBySchool(schoolId, pagination);
		} else {
			// filter news by specific target
			const filters = await this.getTargetFilters(userId, [scope.targetModel]);
			newsList = await this.newsRepo.findAllByTargets(schoolId, filters, pagination);
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

	private async getTargetFilters(userId: EntityId, targetModels: NewsTargetModelValue[]): Promise<NewsTargetFilter[]> {
		const targets = await Promise.all(
			targetModels.map(async (targetModel) => {
				return {
					targetModel: targetModel,
					targetIds: await this.authorizationService.getPermittedTargets(userId, targetModel, ['NEWS_VIEW']),
				};
			})
		);
		return targets;
	}

	private async decoratePermissions(news: News, userId: EntityId) {
		news.permissions = (await this.getUserPermissionsForSubject(userId, news)).filter((permission) =>
			permission.includes('NEWS')
		);
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

	async getUserPermissionsForSubject(userId: EntityId, subject: AuthorizationSubject): Promise<string[]> {
		// detect scope of subject
		// let scope: Target;
		// if ('targetModel' in subject && subject.targetModel && 'target' in subject && subject.target) {
		// 	const { target: target, targetModel } = subject;
		// 	scope = { targetModel, target };
		// } else if ('school' in subject) {
		// 	const { schoolId } = subject;
		// 	if ('name' in schoolId) {
		// 		scope = { targetModel: 'school', targetId: schoolId._id };
		// 	} else {
		// 		scope = { targetModel: 'school', targetId: schoolId };
		// 	}
		// } else {
		// 	// data format not seems to be compatible, throw
		// 	throw new UnauthorizedException('Bääm');
		// }
		// // scope is now school (generic) or a user group (specific)
		// const permissions = await this.authorizationService.getUserPermissions(userId, scope);
		// return permissions;
		return new Promise((resolve) => resolve(['NEWS_VIEW']));
	}
}
