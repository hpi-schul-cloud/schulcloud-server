import { Test, TestingModule } from '@nestjs/testing';
import { OauthProviderUc } from '@src/modules/oauth-provider/uc/oauth-provider.uc';
import { OauthProviderService } from '@shared/infra/oauth-provider/index';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AcceptQuery, ConsentRequestBody } from '@src/modules/oauth-provider/controller/dto';
import { RejectRequestBody } from '@shared/infra/oauth-provider/dto';
import resetAllMocks = jest.resetAllMocks;

describe('OauthProviderUc', () => {
	let module: TestingModule;
	let uc: OauthProviderUc;
	let service: DeepMocked<OauthProviderService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				OauthProviderUc,
				{
					provide: OauthProviderService,
					useValue: createMock<OauthProviderService>(),
				},
			],
		}).compile();

		uc = module.get(OauthProviderUc);
		service = module.get(OauthProviderService);
	});

	afterAll(async () => {
		await module.close();
	});

	// TODO remove after implementation
	it('should be defined', () => {
		expect(uc).toBeDefined();
	});

	describe('consent', () => {
		let challenge: string;

		beforeEach(() => {
			challenge = 'challengexyz';
		});

		afterEach(() => {
			resetAllMocks();
		});

		it('getConsentRequest: should call service', async () => {
			// Act
			await uc.getConsentRequest(challenge);

			// Assert
			expect(service.getConsentRequest).toHaveBeenCalledWith(challenge);
		});

		it('patchConsentRequest: should call acceptConsentRequest', async () => {
			// Arrange
			const acceptQuery: AcceptQuery = { accept: true };
			const body: ConsentRequestBody = {
				grant_scope: ['openid', 'offline'],
				remember: false,
				remember_for: 0,
			};

			// Act
			await uc.patchConsentRequest(challenge, acceptQuery, body);

			// Assert
			expect(service.acceptConsentRequest).toHaveBeenCalledWith(challenge, body);
			expect(service.rejectConsentRequest).not.toHaveBeenCalled();
		});

		it('patchConsentRequest: should call rejectConsentRequest', async () => {
			// Arrange
			const acceptQuery: AcceptQuery = { accept: false };
			const body: RejectRequestBody = {
				status_code: '500',
			};

			// Act
			await uc.patchConsentRequest(challenge, acceptQuery, body);

			// Assert
			expect(service.rejectConsentRequest).toHaveBeenCalledWith(challenge, body);
			expect(service.acceptConsentRequest).not.toHaveBeenCalled();
		});
	});
});
