import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConsoleWriterService } from '@shared/infra/console';
import { ObjectId } from 'bson';
import { BoardManagementUc } from '../uc/board-management.uc';
import { BoardManagementConsole } from './board-management.console';

describe(BoardManagementConsole.name, () => {
	let service: BoardManagementConsole;
	let module: TestingModule;
	let consoleWriter: DeepMocked<ConsoleWriterService>;
	let boarManagementUc: DeepMocked<BoardManagementUc>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardManagementConsole,
				{
					provide: BoardManagementUc,
					useValue: createMock<BoardManagementUc>(),
				},
				{
					provide: ConsoleWriterService,
					useValue: createMock<ConsoleWriterService>(),
				},
			],
		}).compile();

		service = module.get(BoardManagementConsole);
		consoleWriter = module.get(ConsoleWriterService);
		boarManagementUc = module.get(BoardManagementUc);
		boarManagementUc.createBoard.mockResolvedValue(new ObjectId().toHexString());
	});

	afterAll(async () => {
		await module.close();
	});

	describe('createBoard', () => {
		it('should call the board use case', async () => {
			const fakeEntityId = new ObjectId().toHexString();
			await service.createBoard(fakeEntityId);

			expect(boarManagementUc.createBoard).toHaveBeenCalled();
		});

		it('should log a report to the console', async () => {
			const fakeEntityId = new ObjectId().toHexString();
			await service.createBoard(fakeEntityId);

			expect(consoleWriter.info).toHaveBeenCalled();
		});

		it('should return the report', async () => {
			const fakeEntityId = new ObjectId().toHexString();
			await service.createBoard(fakeEntityId);

			expect(consoleWriter.info).toHaveBeenCalledWith(expect.stringContaining('Success'));
		});

		it('should fail if no valid courseId was provided', async () => {
			await service.createBoard('123');

			expect(consoleWriter.info).toHaveBeenCalledWith(
				expect.stringContaining('Error: please provide a valid courseId')
			);
		});
	});
});
