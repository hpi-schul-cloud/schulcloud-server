import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { TOOL_CONFIG_TOKEN, ToolConfig } from '../../tool-config';
import { LtiDeepLinkToken } from '../domain';
import { LTI_DEEP_LINK_TOKEN_REPO, LtiDeepLinkTokenRepo } from '../repo';
import { ltiDeepLinkTokenFactory } from '../testing';
import { LtiDeepLinkTokenService } from './lti-deep-link-token.service';

describe(LtiDeepLinkTokenService.name, () => {
	let module: TestingModule;
	let service: LtiDeepLinkTokenService;

	let ltiDeepLinkTokenRepo: DeepMocked<LtiDeepLinkTokenRepo>;
	let config: ToolConfig;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				LtiDeepLinkTokenService,
				{
					provide: LTI_DEEP_LINK_TOKEN_REPO,
					useValue: createMock<LtiDeepLinkTokenRepo>(),
				},
				{
					provide: TOOL_CONFIG_TOKEN,
					useValue: {
						ctlToolsReloadTimeMs: 2000,
					},
				},
			],
		}).compile();

		service = module.get(LtiDeepLinkTokenService);
		ltiDeepLinkTokenRepo = module.get(LTI_DEEP_LINK_TOKEN_REPO);
		config = module.get<ToolConfig>(TOOL_CONFIG_TOKEN);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('generateToken', () => {
		describe('when generating a token', () => {
			const setup = () => {
				jest.useFakeTimers().setSystemTime(new Date('2024-01-01'));
				const tokenDuration = config.ctlToolsReloadTimeMs;

				const ltiDeepLinkToken = ltiDeepLinkTokenFactory.build({
					expiresAt: new Date(Date.now() + tokenDuration),
				});

				ltiDeepLinkTokenRepo.save.mockResolvedValueOnce(ltiDeepLinkToken);

				return {
					ltiDeepLinkToken,
				};
			};

			it('should save a token', async () => {
				const { ltiDeepLinkToken } = setup();

				await service.generateToken(ltiDeepLinkToken.userId);

				expect(ltiDeepLinkTokenRepo.save).toHaveBeenCalledWith(
					new LtiDeepLinkToken({
						...ltiDeepLinkToken.getProps(),
						id: expect.any(String),
						state: expect.any(String),
					})
				);
			});

			it('should return a token', async () => {
				const { ltiDeepLinkToken } = setup();

				const result = await service.generateToken(ltiDeepLinkToken.userId);

				expect(result).toEqual(ltiDeepLinkToken);
			});
		});
	});

	describe('findByState', () => {
		describe('when searching a token by state', () => {
			const setup = () => {
				const ltiDeepLinkToken = ltiDeepLinkTokenFactory.build();

				ltiDeepLinkTokenRepo.findByState.mockResolvedValueOnce(ltiDeepLinkToken);

				return {
					ltiDeepLinkToken,
				};
			};

			it('should return the token', async () => {
				const { ltiDeepLinkToken } = setup();

				const result = await service.findByState(ltiDeepLinkToken.state);

				expect(result).toEqual(ltiDeepLinkToken);
			});
		});
	});
});
