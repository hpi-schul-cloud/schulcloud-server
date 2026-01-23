import { Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { TOOL_CONFIG_TOKEN, ToolConfig } from '../../tool-config';

@Injectable()
export class LtiDeepLinkingService {
	constructor(@Inject(TOOL_CONFIG_TOKEN) private readonly config: ToolConfig) {}

	public getCallbackUrl(contextExternalToolId: EntityId): string {
		const { publicBackendUrl } = this.config;

		const callbackUrl = new URL(
			`${publicBackendUrl}/v3/tools/context-external-tools/${contextExternalToolId}/lti11-deep-link-callback`
		);

		return callbackUrl.toString();
	}
}
