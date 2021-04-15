import { Injectable } from '@nestjs/common';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { NewsEntity } from './entities/news.entity';
import { NewsRepoService } from './repos/news-repo.service';

@Injectable()
export class NewsService {
	constructor(private newsRepo: NewsRepoService) {}

	async create(createNewsDto: CreateNewsDto): Promise<NewsEntity> {
		return {
			title: 'title',
			body: 'content',
			publishedOn: new Date(),
		};
	}

	async findAll(): Promise<NewsEntity[]> {
		const news = await this.newsRepo.findAll();

		return news.map((news) => {
			return {
				title: news.title,
				body: news.content,
				publishedOn: news.createdAt,
			};
		});
	}

	async findOne(id: string): Promise<NewsEntity> {
		return {
			title: 'title',
			body: 'content',
			publishedOn: new Date(),
		};
	}

	async update(id: string, updateNewsDto: UpdateNewsDto): Promise<NewsEntity> {
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
