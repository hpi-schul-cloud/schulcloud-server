import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ToolConfig } from '../../tool-config';
import { LtiDeepLinkingService } from './lti-deep-linking.service';

describe(LtiDeepLinkingService.name, () => {
	let module: TestingModule;
	let service: LtiDeepLinkingService;

	let configService: DeepMocked<ConfigService<ToolConfig, true>>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				LtiDeepLinkingService,
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
			],
		}).compile();

		service = module.get(LtiDeepLinkingService);
		configService = module.get(ConfigService);
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

				configService.get.mockReturnValueOnce(publicBackendUrl);

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
