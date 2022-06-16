import { Test, TestingModule } from '@nestjs/testing';
import { SystemController } from '@src/modules/system/controller/system.controller';
import { SystemUc } from '@src/modules/system/uc/system.uc';
import { SystemOauthResponse } from '@src/modules/system/controller/dto/system-oauth.response';

describe('system.controller', () => {
	let module: TestingModule;
	let controller: SystemController;
	const mockResponse: SystemOauthResponse = new SystemOauthResponse([]);

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SystemController,
				{
					provide: SystemUc,
					useValue: {
						findByFilter: jest.fn().mockImplementation(() => Promise.resolve(mockResponse)),
					},
				},
			],
		}).compile();
		controller = module.get(SystemController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('find', () => {
		it('should return oauthresponse', async () => {
			const resultConfigs = await controller.find('');
			expect(resultConfigs).toBe(mockResponse);
		});
	});
});
