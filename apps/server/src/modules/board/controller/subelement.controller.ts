import {
	Body,
	Controller,
	Delete,
	ForbiddenException,
	HttpCode,
	NotFoundException,
	Param,
	Patch,
} from '@nestjs/common';
import { ApiExtraModels, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import {
	ContentElementUrlParams,
	SubElementContentUpdateBodyParams,
	SubmissionSubElementContentBody,
} from '@src/modules/board/controller/dto';
import { ElementUc, SubElementUc } from '../uc';

@ApiTags('Submission SubElement')
@Authenticate('jwt')
@Controller('board/submissions')
export class SubElementController {
	constructor(private readonly elementUc: ElementUc, private readonly subElementUc: SubElementUc) {}

	@ApiOperation({ summary: 'Update a single content subelement.' })
	@ApiExtraModels(SubmissionSubElementContentBody)
	@ApiResponse({ status: 204 })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@HttpCode(204)
	@Patch(':contentElementId/content')
	async updateSubElement(
		@Param() urlParams: ContentElementUrlParams,
		@Body() bodyParams: SubElementContentUpdateBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.subElementUc.updateSubElementContent(
			currentUser.userId,
			urlParams.contentElementId,
			bodyParams.data.content
		);
	}

	@Delete(':contentElementId')
	async deleteSubElement(
		@Param() urlParams: ContentElementUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.elementUc.deleteSubElement(currentUser.userId, urlParams.contentElementId);
	}
}
