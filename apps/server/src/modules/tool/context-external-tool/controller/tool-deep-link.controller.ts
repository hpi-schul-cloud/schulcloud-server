import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Authorization } from 'oauth-1.0a';
import { LtiDeepLink } from '../domain';
import { LtiDeepLinkRequestMapper } from '../mapper';
import { ContextExternalToolUc } from '../uc';
import { ContextExternalToolIdParams, Lti11DeepLinkParams } from './dto';

@ApiTags('Tool')
@Controller('tools/context-external-tools')
export class ToolDeepLinkController {
	constructor(private readonly contextExternalToolUc: ContextExternalToolUc) {}

	@Post(':contextExternalToolId/lti11-deep-link-callback')
	public async deepLink(
		@Req() req: Request,
		@Param() params: ContextExternalToolIdParams,
		@Body() body: Lti11DeepLinkParams
	): Promise<string> {
		const deepLink: LtiDeepLink | undefined = LtiDeepLinkRequestMapper.mapRequestToDO(body);
		const originalBody: Authorization = req.body as Authorization;

		await this.contextExternalToolUc.updateLtiDeepLink(params.contextExternalToolId, originalBody, body.data, deepLink);

		return '<!DOCTYPE html><head><title>Window can be closed</title><script>window.close();</script></head><body><span>This window can be closed</span></body>';
	}
}
