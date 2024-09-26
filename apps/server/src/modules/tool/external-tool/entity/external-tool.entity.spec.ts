import { ObjectId } from '@mikro-orm/mongodb';
import { setupEntities } from '@shared/testing';
import {
	CustomParameterLocation,
	CustomParameterScope,
	CustomParameterType,
	LtiMessageType,
	LtiPrivacyPermission,
	ToolConfigType,
} from '../../common/enum';
import { BasicToolConfigEntity, Lti11ToolConfigEntity, Oauth2ToolConfigEntity } from './config';
import { CustomParameterEntity } from './custom-parameter';
import { ExternalToolEntity } from './external-tool.entity';

describe('ExternalToolEntity', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('constructor', () => {
		const setup = () => {
			const basicToolConfig: BasicToolConfigEntity = new BasicToolConfigEntity({
				type: ToolConfigType.BASIC,
				baseUrl: 'mockBaseUrl',
			});
			const oauth2ToolConfig: Oauth2ToolConfigEntity = new Oauth2ToolConfigEntity({
				type: ToolConfigType.OAUTH2,
				baseUrl: 'mockBaseUrl',
				clientId: 'mockClientId',
				skipConsent: true,
			});
			const lti11ToolConfig: Lti11ToolConfigEntity = new Lti11ToolConfigEntity({
				type: ToolConfigType.LTI11,
				baseUrl: 'mockBaseUrl',
				key: 'mockKey',
				secret: 'mockSecret',
				lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
				privacy_permission: LtiPrivacyPermission.ANONYMOUS,
				launch_presentation_locale: 'de-DE',
			});
			const customParameter: CustomParameterEntity = new CustomParameterEntity({
				name: 'parameterName',
				displayName: 'User Friendly Name',
				default: 'mock',
				location: CustomParameterLocation.PATH,
				scope: CustomParameterScope.SCHOOL,
				type: CustomParameterType.STRING,
				regex: 'mockRegex',
				regexComment: 'mockComment',
				isOptional: false,
				isProtected: false,
			});
			const externalToolEntity: ExternalToolEntity = new ExternalToolEntity({
				id: new ObjectId().toHexString(),
				name: 'toolName',
				url: 'mockUrl',
				logoUrl: 'mockLogoUrl',
				config: basicToolConfig,
				parameters: [customParameter],
				isHidden: true,
				isDeactivated: false,
				openNewTab: true,
				isPreferred: true,
				iconName: 'mdiAlert',
			});
			return {
				externalToolEntity,
				oauth2ToolConfig,
				lti11ToolConfig,
			};
		};

		it('should throw an error by empty constructor', () => {
			// @ts-expect-error: Test case
			const test = () => new ExternalToolEntity();
			expect(test).toThrow();
		});

		it('should create an external Tool by passing required properties', () => {
			const { externalToolEntity } = setup();

			expect(externalToolEntity instanceof ExternalToolEntity).toEqual(true);
		});

		it('should create an external Tool with basic configuration by passing required properties', () => {
			const { externalToolEntity } = setup();

			expect(externalToolEntity.config instanceof BasicToolConfigEntity).toEqual(true);
		});

		it('should create an external Tool with oauth2 configuration by passing required properties', () => {
			const { externalToolEntity, oauth2ToolConfig } = setup();
			externalToolEntity.config = oauth2ToolConfig;

			expect(externalToolEntity.config instanceof Oauth2ToolConfigEntity).toEqual(true);
		});

		it('should create an external Tool with LTI 1.1 configuration by passing required properties', () => {
			const { externalToolEntity, lti11ToolConfig } = setup();
			externalToolEntity.config = lti11ToolConfig;

			expect(externalToolEntity.config instanceof Lti11ToolConfigEntity).toEqual(true);
		});
	});
});
