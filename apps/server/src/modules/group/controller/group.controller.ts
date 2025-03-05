import { ErrorResponse } from '@core/error/dto';
import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Group } from '@modules/group';
import {
	Body,
	Controller,
	ForbiddenException,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	Query,
	UnauthorizedException,
} from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiNoContentResponse,
	ApiOperation,
	ApiResponse,
	ApiTags,
	ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common/error';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions } from '@shared/domain/interface';
import { ClassGroupUc, CourseSyncUc, GroupUc } from '../uc';
import { ClassInfoDto, ResolvedGroupDto } from '../uc/dto';
import {
	ClassFilterParams,
	ClassInfoSearchListResponse,
	ClassSortParams,
	CourseSyncBodyParams,
	CourseUrlParams,
	GroupIdParams,
	GroupListResponse,
	GroupPaginationParams,
	GroupParams,
	GroupResponse,
} from './dto';
import { GroupResponseMapper } from './mapper';

@ApiTags('Group')
@JwtAuthentication()
@Controller('groups')
export class GroupController {
	constructor(
		private readonly groupUc: GroupUc,
		private readonly classGroupUc: ClassGroupUc,
		private readonly courseSyncUc: CourseSyncUc
	) {}

	@ApiOperation({ summary: 'Get a list of classes and groups of type class for the current user.' })
	@ApiResponse({ status: HttpStatus.OK, type: ClassInfoSearchListResponse })
	@ApiResponse({ status: '4XX', type: ErrorResponse })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	@Get('/class')
	public async findClasses(
		@Query() pagination: GroupPaginationParams,
		@Query() sortingQuery: ClassSortParams,
		@Query() filterParams: ClassFilterParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<ClassInfoSearchListResponse> {
		const board: Page<ClassInfoDto> = await this.classGroupUc.findAllClasses(
			currentUser.userId,
			currentUser.schoolId,
			filterParams.type,
			pagination,
			sortingQuery.sortBy,
			sortingQuery.sortOrder
		);

		const response: ClassInfoSearchListResponse = GroupResponseMapper.mapToClassInfoSearchListResponse(
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
	@ApiResponse({ status: HttpStatus.OK, type: GroupListResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 401, type: UnauthorizedException })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	public async getAllGroups(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() pagination: GroupPaginationParams,
		@Query() params: GroupParams
	): Promise<GroupListResponse> {
		const options: IFindOptions<Group> = { pagination };

		const groups: Page<ResolvedGroupDto> = await this.groupUc.getAllGroups(
			currentUser.userId,
			currentUser.schoolId,
			options,
			params.nameQuery,
			params.availableGroupsForCourseSync
		);

		const response: GroupListResponse = GroupResponseMapper.mapToGroupListResponse(groups, pagination);

		return response;
	}

	@Post('/course/:courseId/stop-sync')
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Stop the synchronization of a course with a group.' })
	@ApiNoContentResponse({ description: 'The course was successfully disconnected from a group.' })
	@ApiUnprocessableEntityResponse({ description: 'The course is not synchronized with a group.' })
	public async stopSynchronization(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: CourseUrlParams
	): Promise<void> {
		await this.courseSyncUc.stopSynchronization(currentUser.userId, params.courseId);
	}

	@Post('/course/:courseId/start-sync/')
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Start the synchronization of a course with a group.' })
	@ApiNoContentResponse({ description: 'The course was successfully synchronized to a group.' })
	@ApiUnprocessableEntityResponse({ description: 'The course is already synchronized with a group.' })
	@ApiBadRequestResponse({ description: 'Request data has invalid format.' })
	public async startSynchronization(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: CourseUrlParams,
		@Body() bodyParams: CourseSyncBodyParams
	): Promise<void> {
		await this.courseSyncUc.startSynchronization(currentUser.userId, params.courseId, bodyParams.groupId);
	}
}
