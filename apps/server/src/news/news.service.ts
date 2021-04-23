import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ObjectId, Types } from 'mongoose';
import { hasPermission } from '../../../../src/hooks';
import { ICurrentUser } from '../authentication/interfaces/jwt-payload';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { NewsEntity } from './entities/news.entity';
import { NewsRepo } from './repos/news.repo';

@Injectable()
export class NewsService {
	constructor(private newsRepo: NewsRepo) {}

	async create(createNewsDto: CreateNewsDto): Promise<any> {
		return {
			title: 'title',
			body: 'content',
			publishedOn: new Date(),
		};
	}

	async findAll(currentUser: ICurrentUser): Promise<NewsEntity[]> {
		const { userId, schoolId } = currentUser;
		// TODO pagination
		// TODO filter for current user
		const news = await this.newsRepo.findAll();
		return news;
	}

	async findOneByIdForUser(id: ObjectId, userId: ObjectId): Promise<NewsEntity> {
		const news = await this.newsRepo.findOneById(id);
		// TODO permissions
		userHasSubjectPermission(userId, 'NEWS_VIEW', news);
		// TODO decorate news permissions
		return news;
	}

	async update(id: ObjectId, updateNewsDto: UpdateNewsDto): Promise<any> {
		return {
			title: 'title',
			body: 'content',
			publishedOn: new Date(),
		};
	}

	async remove(id: string) {
		return id;
	}
}

type Permission = 'NEWS_VIEW' | 'NEWS_EDIT';
type Scope = { targetModel: string; targetId: Types.ObjectId };
type HasSchool = { schoolId: ObjectId };
type AuthorizationSubject = Scope | HasSchool;

function userHasSubjectPermission(userId: ObjectId, permission: Permission, subject: AuthorizationSubject) {
	// detect scope of subject
	let scope: Scope;
	if ('targetModel' in subject && 'target' in subject) {
		const { target: targetId, targetModel } = subject;
		scope = { targetModel, targetId };
	} else if ('schoolId' in subject) {
		const { schoolId } = subject;
		scope = { targetModel: 'school', targetId: schoolId };
	} else {
		throw new UnauthorizedException('Bääm');
	}
	// scope is now school (generic) or a user group (specific)
	const hasPerimssion = userHasScopePermission(userId, permission, scope);
	return hasPermission;
}

function userHasScopePermission(userId: ObjectId, permission: Permission, scope: Scope) {
	// get scope permission service
	// mount legacy service from legacy app service
}
