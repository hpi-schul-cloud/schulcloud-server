import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ICurrentUser } from '@src/modules/authentication';
import { ToolLaunchRequestDO } from '@shared/domain';
import { ToolLaunchUc } from './tool-launch.uc';
import { ToolLaunchParams } from './tool-launch.params';
import { ToolLaunchRequestResponse } from './tool-launch-request.response';
import { ToolLaunchMapper } from './tool-launch.mapper';

@ApiTags('Tool')
@Authenticate('jwt')
@Controller('tools')
export class ToolLaunchController {
	constructor(private readonly toolLaunchUc: ToolLaunchUc) {}

	// TODO: api test
	@Get('launch-request/:contextExternalToolId')
	@ApiOperation({ summary: 'Get tool launch request for a context external tool id' })
	@ApiOkResponse({ description: 'Tool launch request', type: ToolLaunchRequestResponse })
	@ApiUnauthorizedResponse({ description: 'Unauthorized' })
	async getToolLaunchRequest(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: ToolLaunchParams
	): Promise<ToolLaunchRequestResponse> {
		const toolLaunchRequest: ToolLaunchRequestDO = await this.toolLaunchUc.getToolLaunchRequest(
			currentUser.userId,
			params.contextExternalToolId
		);
		const response: ToolLaunchRequestResponse = ToolLaunchMapper.mapToToolLaunchRequestResponse(toolLaunchRequest);
		return response;
	}
}
