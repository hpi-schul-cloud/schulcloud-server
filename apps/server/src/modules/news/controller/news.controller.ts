import { Controller, Get, Post, Body, Param, Query, Patch, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ParseObjectIdPipe } from '@shared/controller/pipe';
import { PaginationQuery } from '@shared/controller';
import { PaginationResponse } from '@shared/controller/dto/pagination.response';
import { IFindOptions } from '@shared/domain';
import { NewsUc } from '../uc/news.uc';
import { Authenticate, CurrentUser } from '../../authentication/decorator/auth.decorator';
import { ICurrentUser } from '../../authentication/interface/jwt-payload';
import { CreateNewsParams, NewsFilterQuery, NewsResponse, UpdateNewsParams } from './dto';
import { NewsMapper } from '../mapper/news.mapper';
import { News } from '../entity';

@ApiTags('News')
@Authenticate('jwt')
@Controller('news')
export class NewsController {
	constructor(private readonly newsUc: NewsUc) {}

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

	@Get()
	async findAll(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() scope: NewsFilterQuery,
		@Query() pagination: PaginationQuery
	): Promise<PaginationResponse<NewsResponse[]>> {
		const newsResponse = await this.find(currentUser, scope, { pagination });
		return newsResponse;
	}

	@Get('/news/team/:teamId')
	async findAllForTeam(
		@Param('teamId', ParseObjectIdPipe) teamId: string,
		@CurrentUser() currentUser: ICurrentUser,
		@Query() scope: NewsFilterQuery,
		@Query() pagination: PaginationQuery
	): Promise<PaginationResponse<NewsResponse[]>> {
		// enforce filter by a given team, used in team tab
		scope.targetId = teamId;
		scope.targetModel = 'teams';
		const newsResponse = await this.find(currentUser, scope, { pagination });
		return newsResponse;
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

	@Delete(':id')
	async delete(
		@Param('id', ParseObjectIdPipe) newsId: string,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<string> {
		const deletedId = await this.newsUc.delete(newsId, currentUser.userId);
		return deletedId;
	}

	/** internal wrapper to be used in different controller actions taking care of use case mapping */
	private async find(currentUser: ICurrentUser, scope: NewsFilterQuery, options: IFindOptions<News>) {
		const [newsList, count] = await this.newsUc.findAllForUser(
			currentUser.userId,
			NewsMapper.mapNewsScopeToDomain(scope),
			options
		);
		const dtoList = newsList.map((news) => NewsMapper.mapToResponse(news));
		return new PaginationResponse(dtoList, count);
	}
}
