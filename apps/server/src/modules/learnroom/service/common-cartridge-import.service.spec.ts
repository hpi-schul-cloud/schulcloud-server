import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities, userFactory } from '@shared/testing';
import { BoardNodeFactory, BoardNodeService } from '@src/modules/board';
import { readFile } from 'fs/promises';
import { CommonCartridgeImportMapper } from '../mapper/common-cartridge-import.mapper';
import { CommonCartridgeImportService } from './common-cartridge-import.service';
import { CourseService } from './course.service';

describe('CommonCartridgeImportService', () => {
	let orm: MikroORM;
	let moduleRef: TestingModule;
	let sut: CommonCartridgeImportService;
	let courseServiceMock: DeepMocked<CourseService>;
	let boardNodeFactoryMock: DeepMocked<BoardNodeFactory>;
	let boardNodeServiceMock: DeepMocked<BoardNodeService>;

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
					provide: BoardNodeFactory,
					useValue: createMock<BoardNodeFactory>(),
				},
				{
					provide: BoardNodeService,
					useValue: createMock<BoardNodeService>(),
				},
			],
		}).compile();

		sut = moduleRef.get(CommonCartridgeImportService);
		courseServiceMock = moduleRef.get(CourseService);
		boardNodeFactoryMock = moduleRef.get(BoardNodeFactory);
		boardNodeServiceMock = moduleRef.get(BoardNodeService);
	});

	afterAll(async () => {
		await moduleRef.close();
		await orm.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	const setupEnvironment = async (filePath: string) => {
		const user = userFactory.buildWithId();
		const buffer = await readFile(filePath);

		return { user, buffer };
	};

	describe('importFile', () => {
		describe('when the common cartridge is valid', () => {
			const setup = async () =>
				setupEnvironment('./apps/server/src/modules/common-cartridge/testing/assets/us_history_since_1877.imscc');

			it('should create a course', async () => {
				const { user, buffer } = await setup();

				await sut.importFile(user, buffer);

				expect(courseServiceMock.create).toHaveBeenCalledTimes(1);
			});

			it('should create a column board', async () => {
				const { user, buffer } = await setup();

				await sut.importFile(user, buffer);

				expect(boardNodeFactoryMock.buildColumnBoard).toHaveBeenCalledTimes(14);
				expect(boardNodeServiceMock.addRoot).toHaveBeenCalledTimes(14);
			});

			it('should create columns', async () => {
				const { user, buffer } = await setup();

				await sut.importFile(user, buffer);

				expect(boardNodeFactoryMock.buildColumn).toHaveBeenCalled();
				expect(boardNodeServiceMock.addToParent).toHaveBeenCalled();
			});

			it('should create cards', async () => {
				const { user, buffer } = await setup();

				await sut.importFile(user, buffer);

				expect(boardNodeFactoryMock.buildCard).toHaveBeenCalled();
				expect(boardNodeServiceMock.addToParent).toHaveBeenCalled();
			});

			it('should create elements', async () => {
				const { user, buffer } = await setup();

				await sut.importFile(user, buffer);

				expect(boardNodeFactoryMock.buildContentElement).toHaveBeenCalled();
				expect(boardNodeServiceMock.addToParent).toHaveBeenCalled();
				expect(boardNodeServiceMock.updateContent).toHaveBeenCalled();
			});
		});

		describe('when the common cartridge is a valid dbc course', () => {
			const setup = async () =>
				setupEnvironment('./apps/server/src/modules/common-cartridge/testing/assets/dbc_course.imscc');

			it('should create a course', async () => {
				const { user, buffer } = await setup();

				await sut.importFile(user, buffer);

				expect(courseServiceMock.create).toHaveBeenCalledTimes(1);
			});

			it('should create a column board', async () => {
				const { user, buffer } = await setup();

				await sut.importFile(user, buffer);

				expect(boardNodeFactoryMock.buildColumnBoard).toHaveBeenCalledTimes(3);
				expect(boardNodeServiceMock.addRoot).toHaveBeenCalledTimes(3);
			});

			it('should create columns', async () => {
				const { user, buffer } = await setup();

				await sut.importFile(user, buffer);

				expect(boardNodeFactoryMock.buildColumn).toHaveBeenCalled();
				expect(boardNodeServiceMock.addToParent).toHaveBeenCalled();
			});

			it('should create cards', async () => {
				const { user, buffer } = await setup();

				await sut.importFile(user, buffer);

				expect(boardNodeFactoryMock.buildCard).toHaveBeenCalled();
				expect(boardNodeServiceMock.addToParent).toHaveBeenCalled();
			});

			it('should create elements', async () => {
				const { user, buffer } = await setup();

				await sut.importFile(user, buffer);

				expect(boardNodeFactoryMock.buildContentElement).toHaveBeenCalled();
				expect(boardNodeServiceMock.addToParent).toHaveBeenCalled();
				expect(boardNodeServiceMock.updateContent).toHaveBeenCalled();
			});
		});
	});
});
