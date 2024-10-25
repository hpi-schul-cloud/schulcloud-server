import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ContextExternalToolUc } from '../uc';
import { ContextExternalToolIdParams, Lti11DeepLinkParams } from './dto';

@ApiTags('Tool')
@Controller('tools/context-external-tools')
export class ToolDeepLinkController {
	constructor(private readonly contextExternalToolUc: ContextExternalToolUc) {}

	@Post(':contextExternalToolId/lti11-deep-link-callback')
	async deepLink(): Promise<string> {
		return 'https://google.com';
	}
}
