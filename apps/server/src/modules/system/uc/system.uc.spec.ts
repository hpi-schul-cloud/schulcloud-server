import { Test, TestingModule } from '@nestjs/testing';
import { systemFactory } from '@shared/testing';
import { SystemUc } from '@src/modules/system/uc/system.uc';
import { SystemService } from '@src/modules/system/service/system.service';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';

describe('SystemUc', () => {
	let module: TestingModule;
	let systemUc: SystemUc;
	let systemService: SystemService;
	let mockSystems: SystemDto[];

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
						find: jest.fn().mockImplementation(() => Promise.resolve(mockSystems)),
					},
				},
			],
		}).compile();
		systemUc = module.get(SystemUc);
		systemService = module.get(SystemService);
	});

	beforeEach(() => {
		mockSystems = [];
	});

	describe('findByFilter', () => {
		it('should return oauthResponse with data', async () => {
			mockSystems.push(systemFactory.build());
			mockSystems.push(systemFactory.build());

			const resultResponse = await systemUc.findByFilter();

			expect(resultResponse.data.length).toEqual(mockSystems.length);
			expect(resultResponse.data[0].oauthConfig!.clientId).toEqual(mockSystems[0].oauthConfig!.clientId);
			expect(resultResponse.data[1].oauthConfig!.clientId).toEqual(mockSystems[1].oauthConfig!.clientId);
		});

		it('should return empty oauthResponse', async () => {
			const resultResponse = await systemUc.findByFilter();
			expect(resultResponse.data).toEqual([]);
		});
	});
});
