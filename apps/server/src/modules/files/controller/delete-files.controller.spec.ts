import { Test, TestingModule } from '@nestjs/testing';
import { DeleteFilesController } from './delete-files.controller';

describe('DeleteFilesController', () => {
	let controller: DeleteFilesController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [DeleteFilesController],
		}).compile();

		controller = module.get<DeleteFilesController>(DeleteFilesController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
