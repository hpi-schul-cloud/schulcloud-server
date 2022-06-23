import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '../../testing';
import { NameCopyService } from './name-copy.service';

describe('name copy service', () => {
	let module: TestingModule;
	let nameCopyService: NameCopyService;

	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [NameCopyService],
		}).compile();

		nameCopyService = module.get(NameCopyService);
	});
	describe('handle name of copy', () => {
		it('should get name of element and extend it by number in brackets', () => {
			const originalName = 'Test';
			const nameCopy = nameCopyService.deriveCopyName(originalName);

			expect(nameCopy).toEqual(`${originalName} (1)`);
		});
		it('should get name of element and increase an existing number in brackets', () => {
			let originalName = 'Test';
			const basename = originalName;
			originalName += ' (12)';

			const nameCopy = nameCopyService.deriveCopyName(originalName);

			expect(nameCopy).toEqual(`${basename} (13)`);
		});
	});
});
