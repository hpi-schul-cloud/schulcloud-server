import { Test, TestingModule } from '@nestjs/testing';
import { OauthProviderUc } from '@src/modules/oauth-provider/uc/oauth-provider.uc';
import { OauthProviderService } from '@shared/infra/oauth-provider/index';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { OauthClient } from '@shared/infra/oauth-provider/dto/index';

describe('OauthProviderUc', () => {
	let module: TestingModule;
	let uc: OauthProviderUc;

	let providerService: DeepMocked<OauthProviderService>;

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
		providerService = module.get(OauthProviderService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('Client Flow', () => {
		describe('listOAuth2Clients', () => {
			it('should list oauth2 clients when service is called with all parameters', async () => {
				const data: OauthClient[] = [{ client_id: 'clientId' }];
				providerService.listOAuth2Clients.mockResolvedValue(data);

				const result: OauthClient[] = await uc.listOAuth2Clients(1, 0, 'clientId', 'owner');

				expect(result).toEqual(data);
				expect(providerService.listOAuth2Clients).toHaveBeenCalledWith(1, 0, 'clientId', 'owner');
			});

			it('should list oauth2 clients when service is called without parameters', async () => {
				const data: OauthClient[] = [{ client_id: 'clientId' }];
				providerService.listOAuth2Clients.mockResolvedValue(data);

				const result: OauthClient[] = await uc.listOAuth2Clients();

				expect(result).toEqual(data);
				expect(providerService.listOAuth2Clients).toHaveBeenCalledWith(undefined, undefined, undefined, undefined);
			});
		});

		describe('getOAuth2Client', () => {
			it('should get oauth2 client', async () => {
				const data: OauthClient = { client_id: 'clientId' };
				providerService.getOAuth2Client.mockResolvedValue(data);

				const result: OauthClient = await uc.getOAuth2Client('clientId');

				expect(result).toEqual(data);
				expect(providerService.getOAuth2Client).toHaveBeenCalledWith('clientId');
			});
		});

		describe('createOAuth2Client', () => {
			it('should create oauth2 client', async () => {
				const data: OauthClient = { client_id: 'clientId' };
				providerService.createOAuth2Client.mockResolvedValue(data);

				const result: OauthClient = await uc.createOAuth2Client(data);

				expect(result).toEqual(data);
				expect(providerService.createOAuth2Client).toHaveBeenCalledWith(data);
			});
		});

		describe('updateOAuth2Client', () => {
			it('should update oauth2 client', async () => {
				const data: OauthClient = { client_id: 'clientId' };
				providerService.updateOAuth2Client.mockResolvedValue(data);

				const result: OauthClient = await uc.updateOAuth2Client('clientId', data);

				expect(result).toEqual(data);
				expect(providerService.updateOAuth2Client).toHaveBeenCalledWith('clientId', data);
			});
		});

		describe('deleteOAuth2Client', () => {
			it('should delete oauth2 client', async () => {
				await uc.deleteOAuth2Client('clientId');

				expect(providerService.deleteOAuth2Client).toHaveBeenCalledWith('clientId');
			});
		});
	});
});
