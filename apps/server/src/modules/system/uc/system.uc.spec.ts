import { Test, TestingModule } from '@nestjs/testing';
import { systemFactory } from '@shared/testing';
import { SystemUc } from '@src/modules/system/uc/system.uc';
import { SystemService } from '@src/modules/system/service/system.service';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { createMock, DeepMocked } from '@golevelup/ts-jest';

describe('SystemUc', () => {
	let module: TestingModule;
	let systemUc: SystemUc;
	let mockSystems: SystemDto[];

	let systemService: DeepMocked<SystemService>;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SystemUc,
				{
					provide: SystemService,
					useValue: createMock<SystemService>(),
				},
			],
		}).compile();
		systemUc = module.get(SystemUc);
		systemService = module.get(SystemService);
	});

	beforeEach(() => {
		mockSystems = [];

		systemService.find.mockResolvedValue(mockSystems);
	});

	describe('findByFilter', () => {
		it('should return oauthResponse with data', async () => {
			mockSystems.push(systemFactory.build());
			mockSystems.push(systemFactory.build());

			const resultResponse: SystemDto[] = await systemUc.findByFilter();

			expect(resultResponse.length).toEqual(mockSystems.length);
			expect(resultResponse[0].oauthConfig?.clientId).toEqual(mockSystems[0].oauthConfig?.clientId);
			expect(resultResponse[1].oauthConfig?.clientId).toEqual(mockSystems[1].oauthConfig?.clientId);
		});

		it('should return empty oauthResponse', async () => {
			const resultResponse = await systemUc.findByFilter();
			expect(resultResponse).toEqual([]);
		});
	});
});
