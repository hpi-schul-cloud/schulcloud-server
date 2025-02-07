import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { CoursesClientAdapter } from '@infra/courses-client';
import { Test, TestingModule } from '@nestjs/testing';
import type { CommonCartridgeFileParser } from '../import/common-cartridge-file-parser';
import { CommonCartridgeImportService } from './common-cartridge-import.service';

jest.mock('../import/common-cartridge-file-parser', () => {
	const fileParserMock = createMock<CommonCartridgeFileParser>();

	fileParserMock.getTitle.mockReturnValue(faker.lorem.words());

	return {
		CommonCartridgeFileParser: jest.fn(() => fileParserMock),
	};
});

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
			it('should create a course', async () => {
				await sut.importManifestFile(Buffer.from(''));

				expect(coursesClientAdapterMock.createCourse).toHaveBeenCalledWith({ title: expect.any(String) });
			});
		});
	});
});
