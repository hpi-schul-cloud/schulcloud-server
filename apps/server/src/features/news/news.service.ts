import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ICurrentUser } from '../../modules/authentication/interfaces/jwt-payload';
import { AuthorizationService } from '../../modules/authorization/authorization.service';
import { CreateNewsDto, UpdateNewsDto } from './controller/dto/news.dto';
import { News } from '../../models/news/news.model';
import { PaginationDTO } from '../../models/controller/dto/pagination.dto';
import { School } from '../../models/school/school.model';

import { NewsRepo } from './repo/news.repo';

type Permission = 'NEWS_VIEW' | 'NEWS_EDIT';
type Target = { targetModel: string; targetId: Types.ObjectId };
type AuthorizationSubject = { schoolId: Types.ObjectId | School; target?: Types.ObjectId; targetModel?: string };

// CONSIDER https://github.com/devonfw/devon4j/blob/master/documentation/guide-service-layer.asciidoc#service-considerations

@Injectable()
export class NewsService {
	constructor(private newsRepo: NewsRepo, private authorizationService: AuthorizationService) {}

	async create(createNewsDto: CreateNewsDto): Promise<any> {
		return {
			title: 'title',
			body: 'content',
			publishedOn: new Date(),
		};
	}

	async findAllForUser(currentUser: ICurrentUser, pagination: PaginationDTO): Promise<News[]> {
		const userId = new Types.ObjectId(currentUser.userId);
		// TODO pagination
		// TODO filter for current user
		const newsDocuments = await this.newsRepo.findAllByUser(userId, pagination);
		const newsEntities = await Promise.all(
			newsDocuments.map(async (news: News) => {
				await this.decoratePermissions(news, userId);
				// TODO await this.authorizeUserReadNews(news, userId);
				return news;
			})
		);
		return newsEntities;
	}

	private async decoratePermissions(news: News, userId: Types.ObjectId) {
		news.permissions = (await this.getUserPermissionsForSubject(userId, news)).filter((permission) =>
			permission.includes('NEWS')
		);
	}

	async findOneByIdForUser(newsId: Types.ObjectId, userId: Types.ObjectId): Promise<News> {
		const news = await this.newsRepo.findOneById(newsId);
		await this.decoratePermissions(news, userId);
		await this.authorizeUserReadNews(news, userId);
		return news;
	}

	private async authorizeUserReadNews(news: News, userId: Types.ObjectId): Promise<void> {
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

	async update(id: Types.ObjectId, updateNewsDto: UpdateNewsDto): Promise<any> {
		return {
			title: 'title',
			body: 'content',
			publishedOn: new Date(),
		};
	}

	async remove(id: string) {
		return id;
	}

	async getUserPermissionsForSubject(userId: Types.ObjectId, subject: AuthorizationSubject): Promise<string[]> {
		// detect scope of subject
		let scope: Target;
		if ('targetModel' in subject && subject.targetModel && 'target' in subject && subject.target) {
			const { target: targetId, targetModel } = subject;
			scope = { targetModel, targetId };
		} else if ('schoolId' in subject) {
			const { schoolId } = subject;
			if ('name' in schoolId) {
				scope = { targetModel: 'school', targetId: schoolId._id };
			} else {
				scope = { targetModel: 'school', targetId: schoolId };
			}
		} else {
			// data format not seems to be compatible, throw
			throw new UnauthorizedException('Bääm');
		}
		// scope is now school (generic) or a user group (specific)
		const permissions = await this.authorizationService.getUserPermissions(userId, scope);
		return permissions;
	}
}
