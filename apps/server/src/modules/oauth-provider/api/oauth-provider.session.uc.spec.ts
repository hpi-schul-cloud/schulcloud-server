import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { ProviderConsentSessionResponse } from '../domain';
import { OauthProviderService } from '../domain/service/oauth-provider.service';
import { providerConsentSessionResponseFactory } from '../testing';
import { OauthProviderSessionUc } from './oauth-provider.session.uc';

describe(OauthProviderSessionUc.name, () => {
	let module: TestingModule;
	let uc: OauthProviderSessionUc;

	let providerService: DeepMocked<OauthProviderService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				OauthProviderSessionUc,
				{
					provide: OauthProviderService,
					useValue: createMock<OauthProviderService>(),
				},
			],
		}).compile();

		uc = module.get(OauthProviderSessionUc);
		providerService = module.get(OauthProviderService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('listConsentSessions', () => {
		describe('when listing a users consent sessions', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const sessions: ProviderConsentSessionResponse[] = providerConsentSessionResponseFactory.buildList(2);

				providerService.listConsentSessions.mockResolvedValueOnce(sessions);

				return {
					userId,
					sessions,
				};
			};

			it('should call the external provider', async () => {
				const { userId } = setup();

				await uc.listConsentSessions(userId);

				expect(providerService.listConsentSessions).toHaveBeenCalledWith(userId);
			});

			it('should list all consent sessions', async () => {
				const { userId, sessions } = setup();

				const result: ProviderConsentSessionResponse[] = await uc.listConsentSessions(userId);

				expect(result).toEqual(sessions);
			});
		});
	});

	describe('revokeConsentSession', () => {
		describe('when revoking a users consent session', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const clientId = 'clientId';

				return {
					userId,
					clientId,
				};
			};

			it('should revoke all consent sessions', async () => {
				const { userId, clientId } = setup();

				await uc.revokeConsentSession(userId, clientId);

				expect(providerService.revokeConsentSession).toHaveBeenCalledWith(userId, clientId);
			});
		});
	});
});
