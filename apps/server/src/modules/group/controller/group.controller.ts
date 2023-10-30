import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginationParams } from '@shared/controller/dto/pagination.params';
import { Page } from '@shared/domain/domainobject/page';
import { ErrorResponse } from '@src/core/error/dto/error.response';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ICurrentUser } from '@src/modules/authentication/interface/user';
import { ClassInfoDto } from '../uc/dto/class-info.dto';
import { GroupUc } from '../uc/group.uc';
import { ClassSortParams } from './dto/request/class-sort-params';
import { ClassInfoSearchListResponse } from './dto/response/class-info-search-list.response';
import { GroupResponseMapper } from './mapper/group-response.mapper';

@ApiTags('Group')
@Authenticate('jwt')
@Controller('groups')
export class GroupController {
	constructor(private readonly groupUc: GroupUc) {}

	@ApiOperation({ summary: 'Get a list of classes and groups of type class for the current users school.' })
	@ApiResponse({ status: HttpStatus.OK, type: ClassInfoSearchListResponse })
	@ApiResponse({ status: '4XX', type: ErrorResponse })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	@Get('/class')
	public async findClassesForSchool(
		@Query() pagination: PaginationParams,
		@Query() sortingQuery: ClassSortParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<ClassInfoSearchListResponse> {
		const board: Page<ClassInfoDto> = await this.groupUc.findAllClassesForSchool(
			currentUser.userId,
			currentUser.schoolId,
			pagination.skip,
			pagination.limit,
			sortingQuery.sortBy,
			sortingQuery.sortOrder
		);

		const response: ClassInfoSearchListResponse = GroupResponseMapper.mapToClassInfosToListResponse(
			board,
			pagination.skip,
			pagination.limit
		);

		return response;
	}
}
