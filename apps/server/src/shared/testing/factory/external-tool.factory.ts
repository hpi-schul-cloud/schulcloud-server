import { DeepPartial } from 'fishery';
import {
	ExternalTool,
	IExternalToolProperties,
} from '@shared/domain/entity/external-tools/external-tool/external-tool.entity';
import {
	BasicToolConfig,
	CustomParameter,
	CustomParameterLocation,
	CustomParameterScope,
	CustomParameterType,
	Lti11ToolConfig,
	LtiMessageType,
	LtiPrivacyPermission,
	Oauth2ToolConfig,
	ToolConfigType,
} from '@shared/domain';
import { BaseFactory } from './base.factory';

export class ExternalToolFactory extends BaseFactory<ExternalTool, IExternalToolProperties> {
	withBasicConfig(): this {
		const params: DeepPartial<IExternalToolProperties> = {
			config: new BasicToolConfig({
				type: ToolConfigType.BASIC,
				baseUrl: 'mockBaseUrl',
			}),
		};
		return this.params(params);
	}

	withOauth2Config(clientId: string): this {
		const params: DeepPartial<IExternalToolProperties> = {
			config: new Oauth2ToolConfig({
				type: ToolConfigType.OAUTH2,
				baseUrl: 'mockBaseUrl',
				clientId,
				skipConsent: false,
			}),
		};
		return this.params(params);
	}

	withLti11Config(): this {
		const params: DeepPartial<IExternalToolProperties> = {
			config: new Lti11ToolConfig({
				type: ToolConfigType.BASIC,
				baseUrl: 'mockBaseUrl',
				key: 'key',
				lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
				resource_link_id: 'resource_link_id',
				secret: 'secret',
				privacy_permission: LtiPrivacyPermission.ANONYMOUS,
			}),
		};
		return this.params(params);
	}
}

export const externalToolFactory = ExternalToolFactory.define(ExternalTool, ({ sequence }): IExternalToolProperties => {
	return {
		name: `external-tool-${sequence}`,
		url: '',
		logoUrl: '',
		config: new BasicToolConfig({
			type: ToolConfigType.BASIC,
			baseUrl: 'mockBaseUrl',
		}),
		parameters: [
			new CustomParameter({
				name: 'name',
				default: 'default',
				location: CustomParameterLocation.PATH,
				regex: 'regex',
				scope: CustomParameterScope.SCHOOL,
				type: CustomParameterType.STRING,
			}),
		],
		isHidden: false,
		openNewTab: true,
		version: 0,
	};
});
