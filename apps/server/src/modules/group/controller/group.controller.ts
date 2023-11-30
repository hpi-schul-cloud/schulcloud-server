import { Authenticate, CurrentUser, ICurrentUser } from '@modules/authentication';
import { Controller, Get, HttpStatus, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginationParams } from '@shared/controller';
import { Page } from '@shared/domain/domainobject';
import { ErrorResponse } from '@src/core/error/dto';
import { GroupUc } from '../uc';
import { ClassInfoDto, ResolvedGroupDto } from '../uc/dto';
import { ClassFilterParams, ClassInfoSearchListResponse, ClassSortParams, GroupIdParams, GroupResponse } from './dto';
import { GroupResponseMapper } from './mapper';

@ApiTags('Group')
@Authenticate('jwt')
@Controller('groups')
export class GroupController {
	constructor(private readonly groupUc: GroupUc) {}

	@ApiOperation({ summary: 'Get a list of classes and groups of type class for the current user.' })
	@ApiResponse({ status: HttpStatus.OK, type: ClassInfoSearchListResponse })
	@ApiResponse({ status: '4XX', type: ErrorResponse })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	@Get('/class')
	public async findClasses(
		@Query() pagination: PaginationParams,
		@Query() sortingQuery: ClassSortParams,
		@Query() filterParams: ClassFilterParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<ClassInfoSearchListResponse> {
		const board: Page<ClassInfoDto> = await this.groupUc.findAllClasses(
			currentUser.userId,
			currentUser.schoolId,
			filterParams.type,
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

	@Get('/:groupId')
	@ApiOperation({ summary: 'Get a group by id.' })
	@ApiResponse({ status: HttpStatus.OK, type: GroupResponse })
	@ApiResponse({ status: '4XX', type: ErrorResponse })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	public async getGroup(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: GroupIdParams
	): Promise<GroupResponse> {
		const group: ResolvedGroupDto = await this.groupUc.getGroup(currentUser.userId, params.groupId);

		const response: GroupResponse = GroupResponseMapper.mapToGroupResponse(group);

		return response;
	}
}
