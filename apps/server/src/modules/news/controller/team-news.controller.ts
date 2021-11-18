import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '@shared/domain';

import { PaginationQuery, ParseObjectIdPipe } from '@shared/controller';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';

import { NewsMapper } from '../mapper/news.mapper';
import { NewsUc } from '../uc';
import { NewsFilterQuery, NewsListResponse } from './dto';

@ApiTags('News')
@Authenticate('jwt')
@Controller('team')
export class TeamNewsController {
	constructor(private readonly newsUc: NewsUc) {}

	/**
	 * Responds with news of a given team for a user.
	 */
	@Get(':teamId/news')
	async findAllForTeam(
		@Param('teamId', ParseObjectIdPipe) teamId: string,
		@CurrentUser() currentUser: ICurrentUser,
		@Query() scope: NewsFilterQuery,
		@Query() pagination: PaginationQuery
	): Promise<NewsListResponse> {
		// enforce filter by a given team, used in team tab
		scope.targetId = teamId;
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
