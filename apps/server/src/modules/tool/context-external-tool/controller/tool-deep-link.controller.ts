import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LtiDeepLink, LtiDeepLinkAuthorizable } from '../domain';
import { LtiDeepLinkRequestMapper } from '../mapper';
import { ContextExternalToolUc } from '../uc';
import { ContextExternalToolIdParams, Lti11DeepLinkParams } from './dto';

@ApiTags('Tool')
@Controller('tools/context-external-tools')
export class ToolDeepLinkController {
	constructor(private readonly contextExternalToolUc: ContextExternalToolUc) {}

	@Post(':contextExternalToolId/lti11-deep-link-callback')
	async deepLink(@Param() params: ContextExternalToolIdParams, @Body() body: Lti11DeepLinkParams): Promise<string> {
		const deepLink: LtiDeepLink | undefined = LtiDeepLinkRequestMapper.mapRequestToDO(body);
		const authorizable: LtiDeepLinkAuthorizable = LtiDeepLinkRequestMapper.mapRequestToAuthorizable(body);

		await this.contextExternalToolUc.updateLtiDeepLink(params.contextExternalToolId, authorizable, deepLink);

		return '<!DOCTYPE html><head><title>Window can be closed</title><script>window.close();</script></head><body><span>This window can be closed</span></body>';
	}
}
