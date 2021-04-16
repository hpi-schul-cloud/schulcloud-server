import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { CreateNewsDto } from '../dto/create-news.dto';
import { UpdateNewsDto } from '../dto/update-news.dto';
import { News, NewsDocument } from '../interfaces/news.interface';

@Injectable()
export class NewsRepoService {
	constructor(@Inject('NEWS_MODEL') private readonly newsModel: Model<NewsDocument>) {}

	create(createNewsDto: CreateNewsDto): Promise<NewsDocument> {
		const createdNews = new this.newsModel(createNewsDto);
		return createdNews.save();
	}

	findAll(): Promise<News[]> {
		return this.newsModel.find().lean().exec();
	}

	findOneById(id: string): Promise<News> {
		return this.newsModel.findById(id).lean().exec();
	}

	update(id: string, updateNewsDto: UpdateNewsDto) {
		return `This action updates a #${id} news`;
	}

	remove(id: string) {
		return `This action removes a #${id} news`;
	}
}
