import { Controller, Get, Post, Body, Param, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { NewsService } from './news.service';
import { ApiTags } from '@nestjs/swagger';
import { Authenticate, CurrentUser } from '../authentication/auth.decorator';
import { ICurrentUser } from '../authentication/interfaces/jwt-payload';
import { ParseObjectIdPipe } from './parse-object-id.pipe';
import { ObjectId, Schema, SchemaTypes } from 'mongoose';
import { News } from '../models/news/news.model';
import { CreateNewsDto } from '../models/news/news.dto';

@ApiTags('News')
@Authenticate('jwt')
@Controller('news')
@UseInterceptors(ClassSerializerInterceptor) // works only for class instances, default object are not covered!
export class NewsController {
	constructor(private readonly newsService: NewsService) {}

	@Post()
	create(@Body() createNewsDto: CreateNewsDto): Promise<News> {
		return this.newsService.create(createNewsDto);
	}

	@Get()
	findAll(@CurrentUser() currentUser: ICurrentUser): Promise<News[]> {
		return this.newsService.findAll(currentUser);
	}

	/** Retrieve a specific news entry by id. A user may only read news of scopes he has the read permission. The news entity has school and user names populated. */
	@Get(':id')
	async findOne(
		// A parameter pipe like ParseObjectIdPipe gives us the guarantee of typesafety for @Param
		@Param('id', ParseObjectIdPipe) newsId: ObjectId,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<News> {
		const userId = new Schema.Types.ObjectId(currentUser.userId);
		const news = await this.newsService.findOneByIdForUser(newsId, userId);
		return news;
	}

	// @Patch(':id')
	// update(
	// 	@Param('id', ParseObjectIdPipe)
	// 	newsId: ObjectId,
	// 	@Body() updateNewsDto: UpdateNewsDto
	// ) {
	// 	return this.newsService.update(newsId, updateNewsDto);
	// }

	// @Delete(':id')
	// remove(@Param('id') id: string): Promise<string> {
	// 	return this.newsService.remove(id);
	// }
}
