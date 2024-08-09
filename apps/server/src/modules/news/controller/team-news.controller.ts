import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationParams } from '@shared/controller';
import { NewsMapper } from '../mapper/news.mapper';
import { NewsUc } from '../uc';
import { FilterNewsParams, NewsListResponse, TeamUrlParams } from './dto';

@ApiTags('News')
@JwtAuthentication()
@Controller('team')
export class TeamNewsController {
	constructor(private readonly newsUc: NewsUc) {}

	/**
	 * Responds with news of a given team for a user.
	 */
	@Get(':teamId/news')
	async findAllForTeam(
		@Param() urlParams: TeamUrlParams,
		@CurrentUser() currentUser: ICurrentUser,
		@Query() scope: FilterNewsParams,
		@Query() pagination: PaginationParams
	): Promise<NewsListResponse> {
		// enforce filter by a given team, used in team tab
		scope.targetId = urlParams.teamId;
		scope.targetModel = 'teams';
		const [newsList, count] = await this.newsUc.findAllForUser(
			currentUser.userId,
			NewsMapper.mapNewsScopeToDomain(scope),
			{ pagination }
		);
		const dtoList = newsList.map((news) => NewsMapper.mapToResponse(news));
		const response = new NewsListResponse(dtoList, count);
		return response;
	}
}
