import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { TOOL_CONFIG_TOKEN, ToolConfig } from '../../tool-config';
import { LtiDeepLinkingService } from './lti-deep-linking.service';

describe(LtiDeepLinkingService.name, () => {
	let module: TestingModule;
	let service: LtiDeepLinkingService;

	let config: ToolConfig;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				LtiDeepLinkingService,

				{
					provide: TOOL_CONFIG_TOKEN,
					useValue: { publicBackendUrl: '' },
				},
			],
		}).compile();

		service = module.get(LtiDeepLinkingService);
		config = module.get<ToolConfig>(TOOL_CONFIG_TOKEN);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getCallbackUrl', () => {
		describe('when requesting the callback url for lti 1.1 deep linking', () => {
			const setup = () => {
				const contextExternalToolId = new ObjectId().toHexString();
				const publicBackendUrl = 'https://test.com/api';

				config.publicBackendUrl = publicBackendUrl;

				return {
					contextExternalToolId,
					publicBackendUrl,
				};
			};

			it('should return the callback url', () => {
				const { contextExternalToolId, publicBackendUrl } = setup();

				const result = service.getCallbackUrl(contextExternalToolId);

				expect(result).toEqual(
					`${publicBackendUrl}/v3/tools/context-external-tools/${contextExternalToolId}/lti11-deep-link-callback`
				);
			});
		});
	});
});
