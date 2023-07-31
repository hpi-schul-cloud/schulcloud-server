import {
	CustomParameterLocation,
	CustomParameterScope,
	CustomParameterType,
	LtiMessageType,
	LtiPrivacyPermission,
	ToolConfigType,
} from '@src/modules/tool/common/enum';
import {
	BasicToolConfigEntity,
	CustomParameterEntity,
	ExternalToolEntity,
	IExternalToolProperties,
	Lti11ToolConfigEntity,
	Oauth2ToolConfigEntity,
} from '@src/modules/tool/external-tool/entity';
import { DeepPartial } from 'fishery';
import { BaseFactory } from './base.factory';

export class ExternalToolFactory extends BaseFactory<ExternalToolEntity, IExternalToolProperties> {
	withName(name: string): this {
		const params: DeepPartial<IExternalToolProperties> = {
			name,
		};
		return this.params(params);
	}

	withBasicConfig(): this {
		const params: DeepPartial<IExternalToolProperties> = {
			config: new BasicToolConfigEntity({
				type: ToolConfigType.BASIC,
				baseUrl: 'mockBaseUrl',
			}),
		};
		return this.params(params);
	}

	withOauth2Config(clientId: string): this {
		const params: DeepPartial<IExternalToolProperties> = {
			config: new Oauth2ToolConfigEntity({
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
			config: new Lti11ToolConfigEntity({
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

export const externalToolFactory = ExternalToolFactory.define(
	ExternalToolEntity,
	({ sequence }): IExternalToolProperties => {
		return {
			name: `external-tool-${sequence}`,
			url: '',
			logoUrl: '',
			config: new BasicToolConfigEntity({
				type: ToolConfigType.BASIC,
				baseUrl: 'mockBaseUrl',
			}),
			parameters: [
				new CustomParameterEntity({
					name: 'name',
					displayName: 'User Friendly Name',
					description: 'This is a mock parameter.',
					default: 'default',
					location: CustomParameterLocation.PATH,
					regex: 'regex',
					regexComment: 'mockComment',
					scope: CustomParameterScope.SCHOOL,
					type: CustomParameterType.STRING,
					isOptional: false,
				}),
			],
			isHidden: false,
			openNewTab: true,
			version: 1,
		};
	}
);
