import { Inject, Injectable } from '@nestjs/common';
import { Document, LeanDocument, Model, ObjectId } from 'mongoose';
import { CreateNewsDto } from '../dto/create-news.dto';
import { UpdateNewsDto } from '../dto/update-news.dto';
import legacyConstants = require('../../../../../src/services/news/constants');
import { NewsEntity } from '../entities/news.entity';
import { plainToClass } from 'class-transformer';

const { populateProperties } = legacyConstants;

@Injectable()
export class NewsRepo {
	constructor(@Inject('NEWS_MODEL') private readonly newsModel: Model<Document<NewsEntity>>) {}

	create(createNewsDto: CreateNewsDto): Promise<Document<NewsEntity>> {
		const createdNews = new this.newsModel(createNewsDto);
		return createdNews.save();
	}

	async findAll(): Promise<NewsEntity[]> {
		const newsDocuments = await this.newsModel.find().lean().exec();
		return newsDocuments.map((doc) => plainToClass(NewsEntity, doc, { excludeExtraneousValues: true }));
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
		populateProperties.forEach(({ path, target }) => {
			if (target) {
				newsDocument[target] = newsDocument[path];
				newsDocument[path] = newsDocument[target]._id;
			}
		});
		return plainToClass(NewsEntity, newsDocument);
	}

	update(id: string, updateNewsDto: UpdateNewsDto) {
		return `This action updates a #${id} news`;
	}

	remove(id: string) {
		return `This action removes a #${id} news`;
	}
}
