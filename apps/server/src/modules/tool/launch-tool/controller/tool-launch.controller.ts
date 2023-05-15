import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { LaunchRequestMethod, ToolLaunchRequestDO } from '@shared/domain';
import { Authenticate, CurrentUser } from '../../../authentication/decorator/auth.decorator';
import { ICurrentUser } from '../../../authentication';
import { ToolLaunchUc } from '../uc/tool-launch.uc';
import { ToolLaunchParams } from './dto/tool-launch.params';
import { ToolLaunchRequestResponse } from './dto/tool-launch-request.response';
import { ToolLaunchMapper } from '../mapper/tool-launch.mapper';

@ApiTags('Tool')
@Authenticate('jwt')
@Controller('tools')
export class ToolLaunchController {
	constructor(private readonly toolLaunchUc: ToolLaunchUc) {}

	// TODO: api test
	@Get('context/:contextExternalToolId/launch')
	@ApiOperation({ summary: 'Get tool launch request for a context external tool id' })
	@ApiOkResponse({ description: 'Tool launch request', type: ToolLaunchRequestResponse })
	@ApiUnauthorizedResponse({ description: 'Unauthorized' })
	async getToolLaunchRequest(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: ToolLaunchParams
	): Promise<ToolLaunchRequestResponse> {
		/* const toolLaunchRequest: ToolLaunchRequestDO = {
			method: LaunchRequestMethod.GET,
			url: 'https://www.google.com',
			payload: '',
		}; await this.toolLaunchUc.getToolLaunchRequest(
			currentUser.userId,
			params.contextExternalToolId
		); */
		const toolLaunchRequest: ToolLaunchRequestDO = {
			method: LaunchRequestMethod.GET,
			url: 'https://www.google.com/search?q=hello+world',
			payload: '',
			openNewTab: true,
		};
		const response: ToolLaunchRequestResponse = ToolLaunchMapper.mapToToolLaunchRequestResponse(toolLaunchRequest);
		return response;
	}
}
