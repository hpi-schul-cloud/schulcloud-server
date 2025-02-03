import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { CoursesClientAdapter } from '@infra/courses-client';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardsClientAdapter } from '@infra/boards-client';
import type { CommonCartridgeFileParser } from '../import/common-cartridge-file-parser';
import { CommonCartridgeImportService } from './common-cartridge-import.service';

jest.mock('../import/common-cartridge-file-parser', () => {
	const fileParserMock = createMock<CommonCartridgeFileParser>();

	fileParserMock.getTitle.mockReturnValue(faker.lorem.words());
	fileParserMock.getOrganizations.mockReturnValue([
		{
			pathDepth: 0,
			title: faker.lorem.words(),
			path: faker.system.filePath(),
			identifier: faker.string.uuid(),
			isInlined: true,
			isResource: false,
			resourcePath: faker.system.filePath(),
			resourceType: faker.lorem.word(),
		},
	]);

	return {
		CommonCartridgeFileParser: jest.fn(() => fileParserMock),
	};
});

describe(CommonCartridgeImportService.name, () => {
	let module: TestingModule;
	let sut: CommonCartridgeImportService;
	let coursesClientAdapterMock: DeepMocked<CoursesClientAdapter>;
	let boardsClientAdapterMock: DeepMocked<BoardsClientAdapter>;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				CommonCartridgeImportService,
				{
					provide: CoursesClientAdapter,
					useValue: createMock<CoursesClientAdapter>(),
				},
				{
					provide: BoardsClientAdapter,
					useValue: createMock<BoardsClientAdapter>(),
				},
			],
		}).compile();

		sut = module.get(CommonCartridgeImportService);
		coursesClientAdapterMock = module.get(CoursesClientAdapter);
		boardsClientAdapterMock = module.get(BoardsClientAdapter);
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
			const setup = () => {
				const file = Buffer.from('');

				return { file };
			};

			it('should create a course', async () => {
				const { file } = setup();

				await sut.importFile(file);

				expect(coursesClientAdapterMock.createCourse).toHaveBeenCalledWith({ title: expect.any(String) });
			});

			it('should create boards', async () => {
				const { file } = setup();

				await sut.importFile(file);

				expect(boardsClientAdapterMock.createBoard).toHaveBeenCalledTimes(1);
			});
		});
	});
});
