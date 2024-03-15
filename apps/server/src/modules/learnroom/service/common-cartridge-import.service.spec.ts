import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities, userFactory } from '@shared/testing';
import { ColumnBoardService, ColumnService } from '@src/modules/board';
import { readFile } from 'fs/promises';
import { CommonCartridgeImportService } from './common-cartridge-import.service';
import { CourseService } from './course.service';

describe('CommonCartridgeImportService', () => {
	let orm: MikroORM;
	let moduleRef: TestingModule;
	let sut: CommonCartridgeImportService;
	let courseServiceMock: DeepMocked<CourseService>;
	let columnBoardServiceMock: DeepMocked<ColumnBoardService>;
	let columnServiceMock: DeepMocked<ColumnService>;

	beforeEach(async () => {
		orm = await setupEntities();
		moduleRef = await Test.createTestingModule({
			providers: [
				CommonCartridgeImportService,
				{
					provide: CourseService,
					useValue: createMock<CourseService>(),
				},
				{
					provide: ColumnBoardService,
					useValue: createMock<ColumnBoardService>(),
				},
				{
					provide: ColumnService,
					useValue: createMock<ColumnService>(),
				},
			],
		}).compile();

		sut = moduleRef.get<CommonCartridgeImportService>(CommonCartridgeImportService);
		courseServiceMock = moduleRef.get(CourseService);
		columnBoardServiceMock = moduleRef.get(ColumnBoardService);
		columnServiceMock = moduleRef.get(ColumnService);
	});

	afterAll(async () => {
		await moduleRef.close();
		await orm.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('importFile', () => {
		describe('when the common cartridge is valid', () => {
			const setup = async () => {
				const user = userFactory.buildWithId();
				const buffer = await readFile('./apps/server/test/assets/common-cartridge/us_history_since_1877.imscc');

				return { user, buffer };
			};

			it('should create a course', async () => {
				const { user, buffer } = await setup();

				await sut.importFile(user, buffer);

				expect(courseServiceMock.create).toHaveBeenCalledTimes(1);
			});

			it('should create a column board', async () => {
				const { user, buffer } = await setup();

				await sut.importFile(user, buffer);

				expect(columnBoardServiceMock.create).toHaveBeenCalledTimes(1);
			});

			it('should create columns', async () => {
				const { user, buffer } = await setup();

				await sut.importFile(user, buffer);

				expect(columnServiceMock.createMany).toHaveBeenCalledTimes(1);
			});
		});
	});
});
