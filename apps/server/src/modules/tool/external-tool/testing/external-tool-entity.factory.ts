import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { DeepPartial } from 'fishery';
import {
	CustomParameterLocation,
	CustomParameterScope,
	CustomParameterType,
	LtiMessageType,
	LtiPrivacyPermission,
	ToolConfigType,
} from '../../common/enum';
import {
	BasicToolConfigEntity,
	CustomParameterEntity,
	ExternalToolEntity,
	ExternalToolEntityProps,
	ExternalToolMediumEntity,
	Lti11ToolConfigEntity,
	Oauth2ToolConfigEntity,
} from '../repo';
import { base64TestLogo } from './base64-test-logo';

export const basicToolConfigEntityFactory = BaseFactory.define<BasicToolConfigEntity, BasicToolConfigEntity>(
	BasicToolConfigEntity,
	() => {
		return {
			type: ToolConfigType.BASIC,
			baseUrl: 'https://mock.de',
		};
	}
);

export const oauth2ToolConfigEntityFactory = BaseFactory.define<Oauth2ToolConfigEntity, Oauth2ToolConfigEntity>(
	Oauth2ToolConfigEntity,
	({ sequence }) => {
		return {
			type: ToolConfigType.OAUTH2,
			baseUrl: 'https://mock.de',
			clientId: `client-${sequence}`,
			skipConsent: false,
		};
	}
);

export const lti11ToolConfigEntityFactory = BaseFactory.define<Lti11ToolConfigEntity, Lti11ToolConfigEntity>(
	Lti11ToolConfigEntity,
	() => {
		return {
			type: ToolConfigType.LTI11,
			baseUrl: 'https://mock.de',
			key: 'key',
			secret: 'secret',
			lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
			privacy_permission: LtiPrivacyPermission.ANONYMOUS,
			launch_presentation_locale: 'de-DE',
		};
	}
);

export const mediumEntityFactory = BaseFactory.define<ExternalToolMediumEntity, ExternalToolMediumEntity>(
	ExternalToolMediumEntity,
	() => {
		return {
			mediumId: 'mediumId',
			publisher: 'publisher',
			mediaSourceId: 'mediaSourceId',
		};
	}
);

export class ExternalToolEntityFactory extends BaseFactory<ExternalToolEntity, ExternalToolEntityProps> {
	public withName(name: string): this {
		const params: DeepPartial<ExternalToolEntityProps> = {
			name,
		};
		return this.params(params);
	}

	public withBasicConfig(customParam?: DeepPartial<BasicToolConfigEntity>): this {
		const params: DeepPartial<ExternalToolEntityProps> = {
			config: basicToolConfigEntityFactory.build(customParam),
		};

		return this.params(params);
	}

	public withOauth2Config(customParam?: DeepPartial<Oauth2ToolConfigEntity>): this {
		const params: DeepPartial<ExternalToolEntityProps> = {
			config: oauth2ToolConfigEntityFactory.build(customParam),
		};

		return this.params(params);
	}

	public withLti11Config(customParam?: DeepPartial<Lti11ToolConfigEntity>): this {
		const params: DeepPartial<ExternalToolEntityProps> = {
			config: lti11ToolConfigEntityFactory.build(customParam),
		};

		return this.params(params);
	}

	public withBase64Logo(): this {
		const params: DeepPartial<ExternalToolEntityProps> = {
			logoBase64: `data:image/png;base64,${base64TestLogo}`,
		};

		return this.params(params);
	}

	public withMedium(medium?: DeepPartial<ExternalToolMediumEntity>): this {
		const params: DeepPartial<ExternalToolEntityProps> = {
			medium: mediumEntityFactory.build(medium),
		};

		return this.params(params);
	}
}

export const customParameterEntityFactory = BaseFactory.define<CustomParameterEntity, CustomParameterEntity>(
	CustomParameterEntity,
	({ sequence }) => {
		return {
			name: `name${sequence}`,
			displayName: `User Friendly Name ${sequence}`,
			description: 'This is a mock parameter.',
			default: 'default',
			location: CustomParameterLocation.PATH,
			scope: CustomParameterScope.SCHOOL,
			type: CustomParameterType.STRING,
			isOptional: false,
			isProtected: false,
		};
	}
);

export const externalToolEntityFactory = ExternalToolEntityFactory.define(
	ExternalToolEntity,
	({ sequence }): ExternalToolEntityProps => {
		return {
			id: new ObjectId().toHexString(),
			name: `external-tool-${sequence}`,
			description: 'This is a tool description',
			url: '',
			logoUrl: 'https://logourl.com',
			config: basicToolConfigEntityFactory.build(),
			parameters: [customParameterEntityFactory.build()],
			isHidden: false,
			isDeactivated: false,
			openNewTab: true,
			thumbnail: {
				uploadUrl: 'https://uploadurl.com',
				fileRecord: new ObjectId(),
				fileName: 'file-a.png',
			},
			isPreferred: false,
		};
	}
);
