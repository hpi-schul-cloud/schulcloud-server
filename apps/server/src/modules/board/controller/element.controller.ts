import {
	Body,
	Controller,
	Delete,
	ForbiddenException,
	HttpCode,
	NotFoundException,
	Param,
	Patch,
	Post,
	Put,
} from '@nestjs/common';
import { ApiBody, ApiExtraModels, ApiOperation, ApiResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { CardUc } from '../uc';
import { ElementUc } from '../uc/element.uc';
import {
	AnySubElementResponse,
	ContentElementUrlParams,
	CreateSubElementBody,
	CreateSubmissionBodyParams,
	MoveContentElementBody,
	SubmissionResponse,
	SubmissionSubElementResponse,
} from './dto';
import {
	ElementContentUpdateBodyParams,
	FileElementContentBody,
	RichTextElementContentBody,
	TaskElementContentBody,
} from './dto/element/element-content-update.body.params';
import { SubmissionResponseMapper } from './mapper';
import { SubmissionSubElementResponseMapper } from './mapper/submission-subelement-response.mapper';

@ApiTags('Board Element')
@Authenticate('jwt')
@Controller('elements')
export class ElementController {
	constructor(private readonly cardUc: CardUc, private readonly elementUc: ElementUc) {}

	@ApiOperation({ summary: 'Move a single content element.' })
	@ApiResponse({ status: 204 })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@HttpCode(204)
	@Put(':contentElementId/position')
	async moveElement(
		@Param() urlParams: ContentElementUrlParams,
		@Body() bodyParams: MoveContentElementBody,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.cardUc.moveElement(
			currentUser.userId,
			urlParams.contentElementId,
			bodyParams.toCardId,
			bodyParams.toPosition
		);
	}

	@ApiOperation({ summary: 'Update a single content element.' })
	@ApiExtraModels(FileElementContentBody, RichTextElementContentBody, TaskElementContentBody)
	@ApiResponse({ status: 204 })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@HttpCode(204)
	@Patch(':contentElementId/content')
	async updateElement(
		@Param() urlParams: ContentElementUrlParams,
		@Body() bodyParams: ElementContentUpdateBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.elementUc.updateElementContent(currentUser.userId, urlParams.contentElementId, bodyParams.data.content);
	}

	@ApiOperation({ summary: 'Delete a single content element.' })
	@ApiResponse({ status: 204 })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@HttpCode(204)
	@Delete(':contentElementId')
	async deleteElement(
		@Param() urlParams: ContentElementUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.cardUc.deleteElement(currentUser.userId, urlParams.contentElementId);
	}

	// TODO: remove this
	@ApiOperation({ summary: 'Create a new subelement on an element.' })
	@ApiExtraModels(SubmissionSubElementResponse)
	@ApiResponse({
		status: 201,
		schema: {
			oneOf: [{ $ref: getSchemaPath(SubmissionSubElementResponse) }],
		},
	})
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@Post(':contentElementId/subelements')
	async createSubmissionElement(
		@Param() urlParams: ContentElementUrlParams,
		@Body() bodyParams: CreateSubElementBody,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<AnySubElementResponse> {
		const { type } = bodyParams;
		// TODO current user as userId
		const subElement = await this.elementUc.createSubElement(currentUser.userId, urlParams.contentElementId, type);
		const mapper = SubmissionSubElementResponseMapper.getInstance();
		const response = mapper.mapToResponse(subElement);

		return response;
	}

	@ApiOperation({ summary: 'Create a new submission on a submission container element.' })
	@ApiExtraModels(SubmissionResponse)
	@ApiResponse({ status: 201, type: SubmissionResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@ApiBody({ required: true, type: CreateSubmissionBodyParams })
	@Post(':contentElementId/submissions')
	async createSubmission(
		@Param() urlParams: ContentElementUrlParams,
		@Body() bodyParams: CreateSubmissionBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<SubmissionResponse> {
		// const { type } = bodyParams;
		// TODO current user as userId
		const submission = await this.elementUc.createSubmissionBoard(currentUser.userId, urlParams.contentElementId);
		const mapper = SubmissionResponseMapper.getInstance();
		const response = mapper.mapToResponse(submission);

		return response;
	}
}
