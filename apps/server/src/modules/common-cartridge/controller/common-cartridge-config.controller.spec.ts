import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { ConfigurationModule } from '@infra/configuration';
import { Test, TestingModule } from '@nestjs/testing';
import { COMMON_CARTRIDGE_PUBLIC_API_CONFIG_TOKEN, CommonCartridgePublicApiConfig } from '../common-cartridge.config';
import { CommonCartridgeUc } from '../uc/common-cartridge.uc';
import { CommonCartridgeConfigController } from './common-cartridge-config.controller';
import { CommonCartridgeConfigResponse } from './dto/common-cartridge-config.response';

describe(CommonCartridgeConfigController, () => {
	let module: TestingModule;
	let sut: CommonCartridgeConfigController;
	let commonCartridgeUcMock: DeepMocked<CommonCartridgeUc>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [ConfigurationModule.register(COMMON_CARTRIDGE_PUBLIC_API_CONFIG_TOKEN, CommonCartridgePublicApiConfig)],
			controllers: [CommonCartridgeConfigController],
			providers: [
				{
					provide: CommonCartridgeUc,
					useValue: createMock<CommonCartridgeUc>(),
				},
			],
		}).compile();

		sut = module.get(CommonCartridgeConfigController);
		commonCartridgeUcMock = module.get(CommonCartridgeUc);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('publicConfig', () => {
		describe('when getting the config', () => {
			const setup = () => {
				const mockResponse: CommonCartridgeConfigResponse = {
					FEATURE_COMMON_CARTRIDGE_COURSE_EXPORT_ENABLED: true,
					FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_ENABLED: true,
					FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_MAX_FILE_SIZE: faker.number.int(),
				};
				commonCartridgeUcMock.getPublicConfig.mockReturnValueOnce(mockResponse);

				return { mockResponse };
			};

			it('should return CommonCartridgeConfigResponse', () => {
				const { mockResponse } = setup();

				const result = sut.publicConfig();

				expect(result).toBe(mockResponse);
			});
		});
	});
});
