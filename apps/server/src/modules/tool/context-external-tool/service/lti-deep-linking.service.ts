import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityId } from '@shared/domain/types';
import { ToolConfig } from '../../tool-config';

@Injectable()
export class LtiDeepLinkingService {
	constructor(private readonly configService: ConfigService<ToolConfig, true>) {}

	public getCallbackUrl(contextExternalToolId: EntityId): string {
		const publicBackendUrl: string = this.configService.get<string>('PUBLIC_BACKEND_URL');

		const callbackUrl = new URL(
			`${publicBackendUrl}/v3/tools/context-external-tools/${contextExternalToolId}/lti11-deep-link-callback`
		);

		return callbackUrl.toString();
	}
}
