import { Authenticate, CurrentUser, ICurrentUser } from '@modules/authentication';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiForbiddenResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ToolLaunchMapper } from '../mapper';
import { ToolLaunchRequest } from '../types';
import { ToolLaunchUc } from '../uc';
import {
	ContextExternalToolBodyParams,
	ContextExternalToolLaunchParams,
	SchoolExternalToolLaunchParams,
	ToolLaunchRequestResponse,
} from './dto';

@ApiTags('Tool')
@Authenticate('jwt')
@Controller('tools')
export class ToolLaunchController {
	constructor(private readonly toolLaunchUc: ToolLaunchUc) {}

	@Get('context/:contextExternalToolId/launch')
	@ApiOperation({ summary: 'Get tool launch request for a context external tool id' })
	@ApiOkResponse({ description: 'Tool launch request', type: ToolLaunchRequestResponse })
	@ApiUnauthorizedResponse({ description: 'Unauthorized' })
	@ApiForbiddenResponse({ description: 'Forbidden' })
	@ApiBadRequestResponse({ description: 'Outdated tools cannot be launched' })
	async getContextExternalToolLaunchRequest(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: ContextExternalToolLaunchParams
	): Promise<ToolLaunchRequestResponse> {
		const toolLaunchRequest: ToolLaunchRequest = await this.toolLaunchUc.getContextExternalToolLaunchRequest(
			currentUser.userId,
			params.contextExternalToolId
		);

		const response: ToolLaunchRequestResponse = ToolLaunchMapper.mapToToolLaunchRequestResponse(toolLaunchRequest);
		return response;
	}

	@Post('school/:schoolExternalToolId/launch')
	@ApiOperation({ summary: 'Get tool launch request for a context external tool id' })
	@ApiOkResponse({ description: 'Tool launch request', type: ToolLaunchRequestResponse })
	@ApiUnauthorizedResponse({ description: 'Unauthorized' })
	@ApiForbiddenResponse({ description: 'Forbidden' })
	@ApiBadRequestResponse({ description: 'Outdated tools cannot be launched' })
	async getSchoolExternalToolLaunchRequest(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: SchoolExternalToolLaunchParams,
		@Body() body: ContextExternalToolBodyParams
	): Promise<ToolLaunchRequestResponse> {
		const toolLaunchRequest: ToolLaunchRequest = await this.toolLaunchUc.getSchoolExternalToolLaunchRequest(
			currentUser.userId,
			{
				schoolToolRef: {
					schoolToolId: params.schoolExternalToolId,
				},
				contextRef: {
					type: body.contextType,
					id: body.contextId,
				},
				parameters: [],
			}
		);

		const response: ToolLaunchRequestResponse = ToolLaunchMapper.mapToToolLaunchRequestResponse(toolLaunchRequest);
		return response;
	}
}
