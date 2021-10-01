import { Controller, Get, Post, Body, Param, Query, Patch, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '@shared/domain';
import { ParseObjectIdPipe, PaginationQuery, PaginationResponse } from '@shared/controller';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { NewsUc } from '../uc/news.uc';

import { CreateNewsParams, NewsFilterQuery, NewsResponse, UpdateNewsParams } from './dto';
import { NewsMapper } from '../mapper/news.mapper';

@ApiTags('News')
@Authenticate('jwt')
@Controller('news')
export class NewsController {
	constructor(private readonly newsUc: NewsUc) {}

	/**
	 * Create a news by a user in a given scope (school or team).
	 */
	@Post()
	async create(@CurrentUser() currentUser: ICurrentUser, @Body() params: CreateNewsParams): Promise<NewsResponse> {
		const news = await this.newsUc.create(
			currentUser.userId,
			currentUser.schoolId,
			NewsMapper.mapCreateNewsToDomain(params)
		);
		const dto = NewsMapper.mapToResponse(news);
		return dto;
	}

	/**
	 * Responds with all news for a user.
	 */
	@Get()
	async findAll(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() scope: NewsFilterQuery,
		@Query() pagination: PaginationQuery
	): Promise<PaginationResponse<NewsResponse[]>> {
		const [newsList, count] = await this.newsUc.findAllForUser(
			currentUser.userId,
			NewsMapper.mapNewsScopeToDomain(scope),
			{ pagination }
		);
		const dtoList = newsList.map((news) => NewsMapper.mapToResponse(news));
		const response = new PaginationResponse(dtoList, count);
		return response;
	}

	/**
	 * Retrieve a specific news entry by id.
	 * A user may only read news of scopes he has the read permission.
	 * The news entity has school and user names populated.
	 */
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

	/**
	 * Update properties of a news.
	 */
	@Patch(':id')
	async update(
		@Param('id', ParseObjectIdPipe) newsId: string,
		@CurrentUser() currentUser: ICurrentUser,
		@Body() params: UpdateNewsParams
	): Promise<NewsResponse> {
		const news = await this.newsUc.update(newsId, currentUser.userId, NewsMapper.mapUpdateNewsToDomain(params));
		const dto = NewsMapper.mapToResponse(news);
		return dto;
	}

	/**
	 * Delete a news.
	 */
	@Delete(':id')
	async delete(
		@Param('id', ParseObjectIdPipe) newsId: string,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<string> {
		const deletedId = await this.newsUc.delete(newsId, currentUser.userId);
		return deletedId;
	}
}
