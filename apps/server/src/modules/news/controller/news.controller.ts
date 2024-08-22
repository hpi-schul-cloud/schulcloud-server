import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationParams } from '@shared/controller';
import { NewsMapper } from '../mapper/news.mapper';
import { NewsUc } from '../uc/news.uc';
import {
	CreateNewsParams,
	FilterNewsParams,
	NewsListResponse,
	NewsResponse,
	NewsUrlParams,
	UpdateNewsParams,
} from './dto';

@ApiTags('News')
@JwtAuthentication()
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
		@Query() scope: FilterNewsParams,
		@Query() pagination: PaginationParams
	): Promise<NewsListResponse> {
		const [newsList, count] = await this.newsUc.findAllForUser(
			currentUser.userId,
			NewsMapper.mapNewsScopeToDomain(scope),
			{ pagination }
		);
		const dtoList = newsList.map((news) => NewsMapper.mapToResponse(news));
		const response = new NewsListResponse(dtoList, count);
		return response;
	}

	/**
	 * Retrieve a specific news entry by id.
	 * A user may only read news of scopes he has the read permission.
	 * The news entity has school and user names populated.
	 */
	@Get(':newsId')
	async findOne(@Param() urlParams: NewsUrlParams, @CurrentUser() currentUser: ICurrentUser): Promise<NewsResponse> {
		const news = await this.newsUc.findOneByIdForUser(urlParams.newsId, currentUser.userId);
		const dto = NewsMapper.mapToResponse(news);
		return dto;
	}

	/**
	 * Update properties of a news.
	 */
	@Patch(':newsId')
	async update(
		@Param() urlParams: NewsUrlParams,
		@CurrentUser() currentUser: ICurrentUser,
		@Body() params: UpdateNewsParams
	): Promise<NewsResponse> {
		const news = await this.newsUc.update(
			urlParams.newsId,
			currentUser.userId,
			NewsMapper.mapUpdateNewsToDomain(params)
		);
		const dto = NewsMapper.mapToResponse(news);
		return dto;
	}

	/**
	 * Delete a news.
	 */
	@Delete(':newsId')
	async delete(@Param() urlParams: NewsUrlParams, @CurrentUser() currentUser: ICurrentUser): Promise<string> {
		const deletedId = await this.newsUc.delete(urlParams.newsId, currentUser.userId);
		return deletedId;
	}
}
