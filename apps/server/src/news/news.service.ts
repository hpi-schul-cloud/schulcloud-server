import { Injectable, NotFoundException } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { CurrentUser } from '../auth/auth.decorator';
import { ICurrentUser, JwtPayload } from '../auth/interfaces/jwt-payload';
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
		const news = await this.newsRepo.findAll();
		return news.map((news) => new NewsEntity({}));
	}

	async getOne(id: ObjectId, userId: string): Promise<NewsEntity> {
		const news = await this.newsRepo.findOneById(id);
		// TODO permissions
		// TODO decorate news permissions
		if (news == null) {
			throw new NotFoundException();
		}
		return news as NewsEntity;
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
