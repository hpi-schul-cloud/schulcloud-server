import { Test, TestingModule } from '@nestjs/testing';
import { DeleteFilesUc } from './delete-files.uc';

describe('FilesService', () => {
	let service: DeleteFilesUc;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [DeleteFilesUc],
		}).compile();

		service = module.get<DeleteFilesUc>(DeleteFilesUc);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
