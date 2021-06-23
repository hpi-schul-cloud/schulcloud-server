import { Reference } from '@mikro-orm/core';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PaginationQueryDto } from '../../../shared/core/controller/dto/pagination.query.dto';
import { BaseEntity, EntityId } from '../../../shared/domain';
import { AuthorizationService } from '../../authorization/authorization.service';
import { CreateNewsRequestDto, UpdateNewsRequestDto } from '../controller/dto';
import { News, SchoolInfo } from '../entity';
import { NewsRepo } from '../repo/news.repo';
import { ICreateNewsDto } from './create-news.dto';

type Permission = 'NEWS_VIEW' | 'NEWS_EDIT';
type Target = { targetModel?: string; target?: { id: string } };
type AuthorizationSubject = { school?: SchoolInfo; targetModel?: string; target?: { id: string } };

@Injectable()
export class NewsUc {
	constructor(private newsRepo: NewsRepo, private authorizationService: AuthorizationService) {}

	async create(createNewsParams: ICreateNewsDto): Promise<News> {
		const news = this.newsRepo.create(createNewsParams);
		return news;
	}

	async findAllForUser(userId: EntityId, pagination: PaginationQueryDto): Promise<News[]> {
		const newsList = await this.newsRepo.findAllByUser(userId, pagination);
		await Promise.all(
			newsList.map(async (news: News) => {
				await this.decoratePermissions(news, userId);
				// await this.authorizeUserReadNews(news, userId);
			})
		);
		return newsList;
	}

	async findOneByIdForUser(newsId: EntityId, userId: EntityId): Promise<News> {
		const news = await this.newsRepo.findOneById(newsId);
		await this.decoratePermissions(news, userId);
		// await this.authorizeUserReadNews(news, userId);
		return news;
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

	async update(id: EntityId, updateNewsDto: UpdateNewsRequestDto): Promise<any> {
		return {
			title: 'title',
			body: 'content',
			publishedOn: new Date(),
		};
	}

	async remove(id: string) {
		return id;
	}

	async getUserPermissionsForSubject(userId: EntityId, subject: AuthorizationSubject): Promise<string[]> {
		// TODO figure out hoe we can handle targetModel/target in ORM

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
