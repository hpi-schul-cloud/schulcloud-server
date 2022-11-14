import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { SystemOauthResponse } from '@src/modules/system/controller/dto/system-oauth.response';
import { SystemFilterParams } from '@src/modules/system/controller/dto/system.filter.params';
import { SystemController } from '@src/modules/system/controller/system.controller';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { SystemUc } from '@src/modules/system/uc/system.uc';

describe('SystemController', () => {
	let module: TestingModule;
	let controller: SystemController;
	const mockResponse: SystemDto[] = [];
	let systemUc: DeepMocked<SystemUc>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SystemController,
				{
					provide: SystemUc,
					useValue: createMock<SystemUc>(),
				},
			],
		}).compile();
		controller = module.get(SystemController);
		systemUc = module.get(SystemUc);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('find', () => {
		beforeAll(() => {});
		it('should return oauthresponse', async () => {
			// Arrange
			systemUc.findByFilter.mockReturnValue(Promise.resolve(mockResponse));

			// Act
			const resultConfigs = await controller.find(new SystemFilterParams());

			// Assert
			expect(resultConfigs).toStrictEqual(new SystemOauthResponse([]));
		});
	});
});
