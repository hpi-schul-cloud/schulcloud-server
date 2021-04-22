import { Inject, Injectable } from '@nestjs/common';
import { Model, ObjectId } from 'mongoose';
import { CreateNewsDto } from '../dto/create-news.dto';
import { UpdateNewsDto } from '../dto/update-news.dto';
import { News, NewsDocument } from '../interfaces/news.interface';
import legacyConstants = require('../../../../../src/services/news/constants');
import { NewsEntity } from '../entities/news.entity';

const { populateProperties } = legacyConstants;

@Injectable()
export class NewsRepo {
	constructor(@Inject('NEWS_MODEL') private readonly newsModel: Model<NewsDocument>) {}

	create(createNewsDto: CreateNewsDto): Promise<NewsDocument> {
		const createdNews = new this.newsModel(createNewsDto);
		return createdNews.save();
	}

	findAll(): Promise<News[]> {
		return this.newsModel.find().lean().exec();
	}

	/** resolves a news document with some elements names (school, updator/creator) populated already */
	async findOneById(id: ObjectId): Promise<NewsEntity | null> {
		let query = this.newsModel.findById(id);
		if (populateProperties) {
			populateProperties.forEach((populationSet) => {
				const { path, select } = populationSet;
				query = query.populate(path, select);
			});
		}
		const newsDocument = await query.lean().exec();
		return (newsDocument as any) as NewsEntity;
	}

	update(id: string, updateNewsDto: UpdateNewsDto) {
		return `This action updates a #${id} news`;
	}

	remove(id: string) {
		return `This action removes a #${id} news`;
	}
}
