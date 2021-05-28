import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ParseObjectIdPipe } from '@shared/pipe';
import { PaginationQuery } from '@shared/controller';
import { NewsUc } from '../uc/news.uc';
import { Authenticate, CurrentUser } from '../../authentication/decorator/auth.decorator';
import { ICurrentUser } from '../../authentication/interface/jwt-payload';
import { CreateNewsParams, NewsFilterQuery, NewsResponse } from './dto';
import { NewsMapper } from '../mapper/news.mapper';

@ApiTags('News')
@Authenticate('jwt')
@Controller('news')
export class NewsController {
	constructor(private readonly newsUc: NewsUc) {}

	@Post()
	async create(@CurrentUser() currentUser: ICurrentUser, @Body() params: CreateNewsParams): Promise<NewsResponse> {
		const news = await this.newsUc.create(currentUser.userId, NewsMapper.mapCreateNewsToDomain(params));
		const dto = NewsMapper.mapToResponse(news);
		return dto;
	}

	@Get()
	async findAll(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() scope: NewsFilterQuery,
		@Query() pagination: PaginationQuery
	): Promise<NewsResponse[]> {
		const newsList = await this.newsUc.findAllForUserAndSchool(
			currentUser.userId,
			currentUser.schoolId,
			NewsMapper.mapNewsScopeToDomain(scope),
			pagination
		);
		const dtoList = newsList.map((news) => NewsMapper.mapToResponse(news));
		return dtoList;
	}

	/** Retrieve a specific news entry by id. A user may only read news of scopes he has the read permission. The news entity has school and user names populated. */
	@Get(':id')
	async findOne(
		// A parameter pipe like ParseObjectIdPipe gives us the guarantee of typesafety for @Param
		@Param('id', ParseObjectIdPipe) newsId: string,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<NewsResponse> {
		const news = await this.newsUc.findOneByIdForUser(newsId, currentUser.userId);
		const dto = NewsMapper.mapToResponse(news);
		return dto;
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
