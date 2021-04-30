import { Controller, Get, Post, Body, Param, UseInterceptors, ClassSerializerInterceptor, Query } from '@nestjs/common';
import { NewsService } from '../news.service';
import { ApiTags } from '@nestjs/swagger';
import { Authenticate, CurrentUser } from '../../../modules/authentication/auth.decorator';
import { ICurrentUser } from '../../../modules/authentication/interfaces/jwt-payload';
import { ParseObjectIdPipe } from '../parse-object-id.pipe';
import { Types } from 'mongoose';
import { News } from '../repo/entity/news.entity';
import { CreateNewsDto } from './dto/news.dto';
import { PaginationDTO } from '../../../models/controller/dto/pagination.dto';

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
	findAll(@CurrentUser() currentUser: ICurrentUser, @Query() pagination: PaginationDTO): Promise<News[]> {
		return this.newsService.findAllForUser(currentUser, pagination);
	}

	/** Retrieve a specific news entry by id. A user may only read news of scopes he has the read permission. The news entity has school and user names populated. */
	@Get(':id')
	async findOne(
		// A parameter pipe like ParseObjectIdPipe gives us the guarantee of typesafety for @Param
		@Param('id', ParseObjectIdPipe) newsId: Types.ObjectId,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<News> {
		const userId = new Types.ObjectId(currentUser.userId);
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
