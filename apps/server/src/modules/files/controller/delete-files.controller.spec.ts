import { Test, TestingModule } from '@nestjs/testing';
import { ConsoleModule } from 'nestjs-console';
import { LoggerModule } from '../../../core/logger/logger.module';
import { DeleteFilesController } from './delete-files.controller';
import { DeleteFilesUc } from '../uc';
import { FilesRepo, FileStorageRepo } from '../repo';

describe('DeleteFilesController', () => {
	let controller: DeleteFilesController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ConsoleModule, LoggerModule],
			controllers: [DeleteFilesController],
			providers: [
				DeleteFilesUc,
				{
					provide: FilesRepo,
					useValue: {},
				},
				{
					provide: FileStorageRepo,
					useValue: {},
				},
			],
		}).compile();

		controller = module.get<DeleteFilesController>(DeleteFilesController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
