import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginationParams } from '@shared/controller';
import { Page } from '@shared/domain';
import { ErrorResponse } from '@src/core/error/dto';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { GroupUc } from '../uc';
import { ClassInfoDto } from '../uc/dto';
import { ClassInfoSearchListResponse, ClassSortParams } from './dto';
import { GroupResponseMapper } from './mapper';

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
