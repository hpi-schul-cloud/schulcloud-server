import { Test, TestingModule } from '@nestjs/testing';
import { FileSystemAdapter } from './file-system.adapter';
import { FileSystemModule } from './file-system.module';

describe('FileSystemModule', () => {
	let module: TestingModule;
	let adapter: FileSystemAdapter;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [FileSystemModule],
		}).compile();
		adapter = module.get<FileSystemAdapter>(FileSystemAdapter);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should have defined file system adapter', () => {
		expect(adapter).toBeDefined();
	});
});
