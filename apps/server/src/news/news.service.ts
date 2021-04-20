import { Injectable } from '@nestjs/common';
import { CurrentUser } from '../auth/auth.decorator';
import { ICurrentUser, JwtPayload } from '../auth/interfaces/jwt-payload';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { NewsEntity } from './entities/news.entity';
import { NewsRepoService } from './repos/news-repo.service';

@Injectable()
export class NewsService {
	constructor(private newsRepo: NewsRepoService) {}

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

	async getByIdForUserId(id: string, userId: string): Promise<NewsEntity> {
		const news = await this.newsRepo.findOneById(id);
		return new NewsEntity(news);
	}

	async update(id: string, updateNewsDto: UpdateNewsDto): Promise<any> {
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
