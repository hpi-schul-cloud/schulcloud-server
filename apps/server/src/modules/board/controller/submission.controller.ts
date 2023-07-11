import { Controller, Delete, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ElementUc, SubElementUc } from '../uc';
import { ContentElementUrlParams } from './dto';

@ApiTags('Board submissions')
@Authenticate('jwt')
@Controller('elements/submissions')
export class SubmissionBoardController {
	constructor(private readonly elementUc: ElementUc, private readonly subElementUc: SubElementUc) {}

	@Delete(':contentElementId')
	async deleteSubElement(
		@Param() urlParams: ContentElementUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.elementUc.deleteSubmissionBoard(currentUser.userId, urlParams.contentElementId);
	}
}
