import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { CoursesClientAdapter } from '@infra/courses-client';
import { Test, TestingModule } from '@nestjs/testing';
import { CommonCartridgeImportService } from './common-cartridge-import.service';

describe(CommonCartridgeImportService.name, () => {
	let module: TestingModule;
	let sut: CommonCartridgeImportService;
	let coursesClientAdapterMock: DeepMocked<CoursesClientAdapter>;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				CommonCartridgeImportService,
				{
					provide: CoursesClientAdapter,
					useValue: createMock<CoursesClientAdapter>(),
				},
			],
		}).compile();

		sut = module.get(CommonCartridgeImportService);
		coursesClientAdapterMock = module.get(CoursesClientAdapter);
	});

	afterEach(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('importFile', () => {
		describe('when importing a file', () => {
			it('should create a course', () => {
				throw new Error('Test not implemented');
			});
		});
	});
});
