import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { ConsoleWriterService } from '@shared/infra/console';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { courseFactory } from '@shared/testing';
import { BoardManagementUc } from './board-management.uc';

describe(BoardManagementUc.name, () => {
	let module: TestingModule;
	let uc: BoardManagementUc;
	let em: EntityManager;
	let consoleWriter: DeepMocked<ConsoleWriterService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [
				BoardManagementUc,
				{
					provide: ConsoleWriterService,
					useValue: createMock<ConsoleWriterService>(),
				},
			],
		}).compile();

		uc = module.get(BoardManagementUc);
		consoleWriter = module.get(ConsoleWriterService);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	const setup = async () => {
		jest.clearAllMocks();
		const course = courseFactory.buildWithId();
		await em.persistAndFlush(course);

		return { course };
	};

	describe('createBoard', () => {
		describe('when course exists', () => {
			it('should call the service', async () => {
				const { course } = await setup();

				const boardId = await uc.createBoard(course.id);

				expect(boardId).toBeDefined();
			});
		});

		describe('when course does not exist', () => {
			it('should write an error message if courseId is not valid', async () => {
				const fakeId = new ObjectId().toHexString();

				await uc.createBoard(fakeId);

				expect(consoleWriter.info).toHaveBeenCalledWith(expect.stringContaining('Error: course does not exist'));
			});
		});
	});
});
