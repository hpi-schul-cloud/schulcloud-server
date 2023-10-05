import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolService } from './school.service';

describe('SchoolService', () => {
	let module: TestingModule;
	let service: SchoolService;
	let configService: DeepMocked<ConfigService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [SchoolService, { provide: ConfigService, useValue: createMock<ConfigService>() }],
		}).compile();

		service = module.get(SchoolService);
		configService = module.get(ConfigService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getSchool', () => {
		it('should return the requested school', () => {
			await service.getSchool();
		});
	});
});
