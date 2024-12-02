import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LtiDeepLink } from '../domain';
import { LtiDeepLinkRequestMapper } from '../mapper';
import { ContextExternalToolUc } from '../uc';
import { ContextExternalToolIdParams, Lti11DeepLinkParams } from './dto';
import { Lti11DeepLinkParamsRaw } from './dto/lti11-deep-link/lti11-deep-link-raw.params';

@ApiTags('Tool')
@Controller('tools/context-external-tools')
export class ToolDeepLinkController {
	constructor(private readonly contextExternalToolUc: ContextExternalToolUc) {}

	@Post(':contextExternalToolId/lti11-deep-link-callback')
	public async deepLink(
		@Param() params: ContextExternalToolIdParams,
		@Body() rawBody: Lti11DeepLinkParamsRaw,
		@Body() body: Lti11DeepLinkParams
	): Promise<string> {
		const deepLink: LtiDeepLink | undefined = LtiDeepLinkRequestMapper.mapRequestToDO(body);

		await this.contextExternalToolUc.updateLtiDeepLink(params.contextExternalToolId, rawBody, body.data, deepLink);

		return '<!DOCTYPE html><head><title>Window can be closed</title><script>window.close();</script></head><body><span>This window can be closed</span></body>';
	}
}
