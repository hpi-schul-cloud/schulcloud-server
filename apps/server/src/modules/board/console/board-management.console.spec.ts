import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConsoleWriterService } from '@shared/infra/console';
import { ObjectId } from 'bson';
import { BoardManagementUc } from '../uc';
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
		boarManagementUc.createBoards.mockResolvedValue(new ObjectId().toHexString());
	});

	afterAll(async () => {
		await module.close();
	});

	describe('createBoards', () => {
		it('should call the board use case', async () => {
			await service.createBoards();

			expect(boarManagementUc.createBoards).toHaveBeenCalled();
		});

		it('should log a report to the console', async () => {
			await service.createBoards();
			expect(consoleWriter.info).toHaveBeenCalled();
		});

		it('should return the report', async () => {
			let report = '';

			consoleWriter.info.mockImplementationOnce((text) => {
				report = text;
			});

			const output = await service.createBoards();

			expect(output).toEqual(report);
		});
	});
});
