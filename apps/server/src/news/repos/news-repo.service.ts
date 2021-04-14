import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateNewsDto } from '../dto/create-news.dto';
import { UpdateNewsDto } from '../dto/update-news.dto';
import { News, NewsDocument } from './schemas/news.schema';

@Injectable()
export class NewsRepoService {
	constructor(@InjectModel(News.name) private readonly newsModel: Model<NewsDocument>) {}

	create(createNewsDto: CreateNewsDto): Promise<News> {
		const createdNews = new this.newsModel(createNewsDto);
		return createdNews.save();
	}

	findAll(): Promise<News[]> {
		return this.newsModel.find().exec();
	}

	findOne(id: string): Promise<News> {
		return this.newsModel.findById(id).exec();
	}

	update(id: string, updateNewsDto: UpdateNewsDto) {
		return `This action updates a #${id} news`;
	}

	remove(id: string) {
		return `This action removes a #${id} news`;
	}
}
