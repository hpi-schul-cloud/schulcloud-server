import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities, userFactory } from '@shared/testing';
import { CardService, ColumnBoardService, ColumnService, ContentElementService } from '@src/modules/board';
import { readFile } from 'fs/promises';
import { CommonCartridgeImportMapper } from '../mapper/common-cartridge-import.mapper';
import { CommonCartridgeImportService } from './common-cartridge-import.service';
import { CourseService } from './course.service';

describe('CommonCartridgeImportService', () => {
	let orm: MikroORM;
	let moduleRef: TestingModule;
	let sut: CommonCartridgeImportService;
	let courseServiceMock: DeepMocked<CourseService>;
	let columnBoardServiceMock: DeepMocked<ColumnBoardService>;
	let columnServiceMock: DeepMocked<ColumnService>;
	let cardServiceMock: DeepMocked<CardService>;
	let contentElementServiceMock: DeepMocked<ContentElementService>;

	beforeEach(async () => {
		orm = await setupEntities();
		moduleRef = await Test.createTestingModule({
			providers: [
				CommonCartridgeImportService,
				CommonCartridgeImportMapper,
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
				{
					provide: CardService,
					useValue: createMock<CardService>(),
				},
				{
					provide: ContentElementService,
					useValue: createMock<ContentElementService>(),
				},
			],
		}).compile();

		sut = moduleRef.get(CommonCartridgeImportService);
		courseServiceMock = moduleRef.get(CourseService);
		columnBoardServiceMock = moduleRef.get(ColumnBoardService);
		columnServiceMock = moduleRef.get(ColumnService);
		cardServiceMock = moduleRef.get(CardService);
		contentElementServiceMock = moduleRef.get(ContentElementService);
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
				const buffer = await readFile(
					'./apps/server/src/modules/common-cartridge/testing/assets/us_history_since_1877.imscc'
				);

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

				expect(columnServiceMock.create).toHaveBeenCalledTimes(14);
			});

			it('should create cards', async () => {
				const { user, buffer } = await setup();

				await sut.importFile(user, buffer);

				expect(cardServiceMock.create).toHaveBeenCalled();
			});

			it('should create elements', async () => {
				const { user, buffer } = await setup();

				await sut.importFile(user, buffer);

				expect(contentElementServiceMock.create).toHaveBeenCalled();
			});
		});
	});
});
