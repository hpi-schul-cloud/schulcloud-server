import { Inject, Injectable, NotFoundException } from '@nestjs/common';
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
		// TODO filter by user scopes
		let query = this.newsModel.find();
		populateProperties.forEach((populationSet) => {
			const { path, select } = populationSet;
			query = query.populate(path, select);
		});
		const newsDocuments = await query.lean().exec();

		const newsEntities = newsDocuments.map(toNewsEntity);
		return newsEntities;
	}

	/** resolves a news document with some elements names (school, updator/creator) populated already */
	async findOneById(id: ObjectId): Promise<NewsEntity> {
		let query = this.newsModel.findById(id);
		populateProperties.forEach((populationSet) => {
			const { path, select } = populationSet;
			query = query.populate(path, select);
		});
		const newsDocument = await query.lean().exec();
		// NOT EXPORT A DOCUMENT, HERE WE KNOW WHAT THE DB HAS RETURNED
		// FOR UPPER LAYERS ONLY WE MUST PROVIDE TYPESAFETY
		// THIS MIGHT CHANGE WHEN WE USE A NON_LEGACY MODEL FACTORY
		if (newsDocument !== null) {
			const newsEntity = toNewsEntity(newsDocument);
			return newsEntity;
		}
		throw new NotFoundException('The requested news ' + id + 'has not been found.');
	}

	update(id: string, updateNewsDto: UpdateNewsDto) {
		return `This action updates a #${id} news`;
	}

	remove(id: string) {
		return `This action removes a #${id} news`;
	}
}
function toNewsEntity(newsDocument: LeanDocument<Document<NewsEntity, {}>>): NewsEntity {
	// move populated properties to other named property and restore id's like without population
	// sample: schoolId:{...} to schoolId:ObjectId and school:{...}
	populateProperties.forEach(({ path, target }) => {
		if (target && path in newsDocument) {
			const id = newsDocument[path]._id;
			newsDocument[target] = newsDocument[path];
			newsDocument[path] = id;
		}
	});
	const newsEntity = plainToClass(NewsEntity, newsDocument, {
		/** remove properties not exported in @NewsEntity */
		excludeExtraneousValues: true,
		/** For undefined properties, apply defaults defined within of @NewsEntity */
		exposeDefaultValues: true,
	});
	return newsEntity;
}
