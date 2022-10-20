import { DeepPartial } from 'fishery';
import { ExternalTool, IExternalToolProperties } from '@shared/domain/entity/external-tool/external-tool.entity';
import { BasicConfig, Lti11Config, LtiMessageType, Oauth2Config, ToolConfigType } from '@shared/domain';
import { BaseFactory } from './base.factory';

export class ExternalToolFactory extends BaseFactory<ExternalTool, IExternalToolProperties> {
	withBasicConfig(): this {
		const params: DeepPartial<IExternalToolProperties> = {
			config: new BasicConfig({
				type: ToolConfigType.BASIC,
				baseUrl: 'mockBaseUrl',
			}),
		};
		return this.params(params);
	}

	withOauth2Config(): this {
		const params: DeepPartial<IExternalToolProperties> = {
			config: new Oauth2Config({
				type: ToolConfigType.OAUTH2,
				baseUrl: '',
				clientSecret: '',
				clientId: '',
				frontchannelLogoutUrl: '',
				skipConsent: false,
			}),
		};
		return this.params(params);
	}

	withLti11Config(): this {
		const params: DeepPartial<IExternalToolProperties> = {
			config: new Lti11Config({
				type: ToolConfigType.BASIC,
				baseUrl: 'mockBaseUrl',
				key: '',
				launch_presentation_document_target: '',
				launch_presentation_locale: '',
				lti_message_type: LtiMessageType.IDK,
				resource_link: '',
				secret: '',
				roles: [],
			}),
		};
		return this.params(params);
	}
}

export const externalToolFactory = ExternalToolFactory.define<ExternalTool, IExternalToolProperties>(
	ExternalTool,
	({ sequence }): IExternalToolProperties => {
		return {
			name: `external-tool-${sequence}`,
			url: '',
			logoUrl: '',
			config: new BasicConfig({
				type: ToolConfigType.BASIC,
				baseUrl: 'mockBaseUrl',
			}),
			parameters: [],
			isHidden: false,
			openNewTab: true,
			version: 0,
		};
	}
);
