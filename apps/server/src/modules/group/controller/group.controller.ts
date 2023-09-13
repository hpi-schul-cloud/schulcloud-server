import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { GroupUc } from '../uc';
import { ClassInfoSearchListResponse } from './dto';
import { GroupResponseMapper } from './mapper';

@ApiTags('Group')
@Authenticate('jwt')
@Controller('groups')
export class GroupController {
	constructor(private readonly groupUc: GroupUc) {}

	@ApiOperation({ summary: 'Get the skeleton of a a board.' })
	@Get('/class')
	public async getClassesForSchool(
		@Param() urlParams: BoardUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<ClassInfoSearchListResponse> {
		const board = await this.groupUc.findClassesForSchool(currentUser.userId, urlParams.boardId);

		const response = GroupResponseMapper.mapToClassInfosToListResponse(board);

		return response;
	}
}
