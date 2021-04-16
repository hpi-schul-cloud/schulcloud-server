import { Injectable } from '@nestjs/common';
import { AnyARecord } from 'node:dns';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { NewsEntity } from './entities/news.entity';
import { News } from './interfaces/news.interface';
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

	async findAll(): Promise<News[]> {
		const news = await this.newsRepo.findAll();
		// return news;
		return news.map((news) => {
			return {
				...news,
				test: 'huhu',
			};
		});
	}

	async findOneById(id: string): Promise<News> {
		const news = await this.newsRepo.findOneById(id);
		return news; // TODO filter props pipe
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
