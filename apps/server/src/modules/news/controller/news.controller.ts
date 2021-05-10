import { Controller, Get, Post, Body, Param, UseInterceptors, ClassSerializerInterceptor, Query } from '@nestjs/common';
import { NewsUc } from '../uc/news.uc';
import { ApiTags } from '@nestjs/swagger';
import { Authenticate, CurrentUser } from '../../authentication/decorator/auth.decorator';
import { ICurrentUser } from '../../authentication/interface/jwt-payload';
import { ParseObjectIdPipe } from '../../../shared/core/pipe/parse-object-id.pipe';
import { CreateNewsRequestDto, NewsResponseDto } from './dto';
import { PaginationQueryDto } from '../../../shared/core/controller/dto/pagination.query.dto';
import { NewsMapper } from '../mapper/news.mapper';

@ApiTags('News')
@Authenticate('jwt')
@Controller('news')
@UseInterceptors(ClassSerializerInterceptor) // works only for class instances, default object are not covered!
export class NewsController {
	constructor(private readonly newsUc: NewsUc) {}

	@Post()
	async create(@Body() createNewsDto: CreateNewsRequestDto): Promise<NewsResponseDto> {
		const news = await this.newsUc.create(NewsMapper.mapCreateNewsToDomain(createNewsDto));
		const dto = NewsMapper.mapToResponse(news);
		return dto;
	}

	@Get()
	async findAll(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() pagination: PaginationQueryDto
	): Promise<NewsResponseDto[]> {
		const newsList = await this.newsUc.findAllForUser(currentUser.userId, pagination);
		const dtoList = newsList.map((news) => NewsMapper.mapToResponse(news));
		return dtoList;
	}

	/** Retrieve a specific news entry by id. A user may only read news of scopes he has the read permission. The news entity has school and user names populated. */
	@Get(':id')
	async findOne(
		// A parameter pipe like ParseObjectIdPipe gives us the guarantee of typesafety for @Param
		@Param('id', ParseObjectIdPipe) newsId: string,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<NewsResponseDto> {
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
