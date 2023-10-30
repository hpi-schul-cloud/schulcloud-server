import { Controller, Get, Param } from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiForbiddenResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ICurrentUser } from '@src/modules/authentication/interface/user';
import { ToolLaunchMapper } from '../mapper/tool-launch.mapper';
import { ToolLaunchRequest } from '../types/tool-launch-request';
import { ToolLaunchUc } from '../uc/tool-launch.uc';
import { ToolLaunchRequestResponse } from './dto/tool-launch-request.response';
import { ToolLaunchParams } from './dto/tool-launch.params';

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
		@CurrentUser() currentUser: ICurrentUser,
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
