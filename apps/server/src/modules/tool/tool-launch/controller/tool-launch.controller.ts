import { Authenticate, CurrentUser, CurrentUserInterface } from '@modules/authentication';
import { Controller, Get, Param } from '@nestjs/common';
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
import { ToolLaunchParams, ToolLaunchRequestResponse } from './dto';

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
	async getToolLaunchRequest(
		@CurrentUser() currentUser: CurrentUserInterface,
		@Param() params: ToolLaunchParams
	): Promise<ToolLaunchRequestResponse> {
		const toolLaunchRequest: ToolLaunchRequest = await this.toolLaunchUc.getToolLaunchRequest(
			currentUser.userId,
			params.contextExternalToolId
		);

		const response: ToolLaunchRequestResponse = ToolLaunchMapper.mapToToolLaunchRequestResponse(toolLaunchRequest);
		return response;
	}
}
