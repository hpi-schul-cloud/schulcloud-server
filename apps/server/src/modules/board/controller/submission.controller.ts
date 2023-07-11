import { Controller, Delete, ForbiddenException, HttpCode, NotFoundException, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ElementUc, SubElementUc } from '../uc';
import { ContentElementUrlParams } from './dto';

@ApiTags('Board submissions')
@Authenticate('jwt')
@Controller('elements/submissions')
export class SubmissionBoardController {
	constructor(private readonly elementUc: ElementUc, private readonly subElementUc: SubElementUc) {}

	@ApiOperation({ summary: 'Delete a single submission from a task in board.' })
	@ApiResponse({ status: 204 })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@HttpCode(204)
	@Delete(':contentElementId')
	async deleteSubmissionBoard(
		@Param() urlParams: ContentElementUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.elementUc.deleteSubmissionBoard(currentUser.userId, urlParams.contentElementId);
	}
}
