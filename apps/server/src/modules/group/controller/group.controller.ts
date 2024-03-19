import { Authenticate, CurrentUser, ICurrentUser } from '@modules/authentication';
import { GroupDto } from '@modules/group/uc/dto/group.dto';
import { Controller, Get, HttpStatus, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Page } from '@shared/domain/domainobject';
import { ErrorResponse } from '@src/core/error/dto';
import { GroupUc } from '../uc';
import { ClassInfoDto, ResolvedGroupDto } from '../uc/dto';
import {
	ClassCallerParams,
	ClassFilterParams,
	ClassInfoSearchListResponse,
	ClassSortParams,
	GroupEntryResponse,
	GroupIdParams,
	GroupPaginationParams,
	GroupParams,
	GroupResponse,
} from './dto';
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
		@Query() pagination: GroupPaginationParams,
		@Query() sortingQuery: ClassSortParams,
		@Query() filterParams: ClassFilterParams,
		@Query() callerParams: ClassCallerParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<ClassInfoSearchListResponse> {
		const board: Page<ClassInfoDto> = await this.groupUc.findAllClasses(
			currentUser.userId,
			currentUser.schoolId,
			filterParams.type,
			callerParams.calledFrom,
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

	@Get()
	@ApiOperation({ summary: 'Get a list of all groups.' })
	@ApiResponse({ status: HttpStatus.OK, type: [GroupEntryResponse] })
	@ApiResponse({ status: '4XX', type: ErrorResponse })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	public async getAllGroups(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() params: GroupParams
	): Promise<GroupEntryResponse[]> {
		const groups: GroupDto[] = await this.groupUc.getAllGroups(
			currentUser.userId,
			currentUser.schoolId,
			params.availableGroupsForCourseSync
		);
		const response: GroupEntryResponse[] = GroupResponseMapper.mapToGroupListResponse(groups);

		return response;
	}
}
