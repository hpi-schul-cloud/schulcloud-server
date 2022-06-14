import { Test, TestingModule } from '@nestjs/testing';
import { SystemController } from '@src/modules/system/controller/system.controller';
import { SystemUc } from '@src/modules/system/uc/system.uc';
import { OauthResponse } from '@src/modules/system/controller/dto/oauth.response';

describe('system.controller', () => {
	let module: TestingModule;
	let controller: SystemController;
	const mockResponse: OauthResponse = new OauthResponse([]);

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SystemController,
				{
					provide: SystemUc,
					useValue: {
						findOauthConfigs: jest.fn().mockImplementation(() => Promise.resolve(mockResponse)),
					},
				},
			],
		}).compile();
		controller = module.get(SystemController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('findOauthConfigs', () => {
		it('should return oauthresponse', async () => {
			const resultConfigs = await controller.findOauthConfigs();
			expect(resultConfigs).toBe(mockResponse);
		});
	});
});
