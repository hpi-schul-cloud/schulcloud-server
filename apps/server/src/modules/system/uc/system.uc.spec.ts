import { Test, TestingModule } from '@nestjs/testing';
import { systemFactory } from '@shared/testing';
import { SystemUc } from '@src/modules/system/uc/system.uc';
import { SystemService } from '@src/modules/system/service/system.service';
import { OauthConfigDto } from '@src/modules/system/service/dto/oauth-config.dto';

describe('SystemUc', () => {
	let module: TestingModule;
	let systemUc: SystemUc;
	let systemService: SystemService;
	let mockConfigs: OauthConfigDto[];

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SystemUc,
				{
					provide: SystemService,
					useValue: {
						findOauthConfigs: jest.fn().mockImplementation(() => Promise.resolve(mockConfigs))
					}
				}
			]
		}).compile();
		systemUc = module.get(SystemUc);
		systemService = module.get(SystemService);
	});

	beforeEach(async () => {
		mockConfigs = [];
	});

	describe('findOauthConfigs', () => {
		it('should return oauthResponse with data', async () => {
			mockConfigs.push(systemFactory.build().oauthConfig);
			mockConfigs.push(systemFactory.build().oauthConfig);

			const resultResponse = await systemUc.findOauthConfigs();

			expect(resultResponse.data.length).toEqual(mockConfigs.length);
			expect(resultResponse.data[0]).toEqual(mockConfigs[0]);
			expect(resultResponse.data[1]).toEqual(mockConfigs[1]);
		});

		it('should return empty oauthResponse', async () => {
			const resultResponse = await systemUc.findOauthConfigs();
			expect(resultResponse.data).toEqual([]);
		});
	});
});
