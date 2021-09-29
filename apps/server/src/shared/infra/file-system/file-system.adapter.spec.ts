import { Test, TestingModule } from '@nestjs/testing';
import * as path from 'path';
import { FileSystemAdapter } from './file-system.adapter';

describe('FileSystemAdapter', () => {
	let service: FileSystemAdapter;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [FileSystemAdapter],
		}).compile();
		service = module.get<FileSystemAdapter>(FileSystemAdapter);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('When using a temporary folder', () => {
		it('should create and remove a temporary folder', () => {
			const tmpDirPath = service.createTmpDir('prefix');
			expect(tmpDirPath).toContain('prefix');
			expect(() => service.readDirSync(tmpDirPath)).not.toThrow();
			service.removeDirRecursive(tmpDirPath);
			expect(() => service.readDirSync(tmpDirPath)).toThrow();
		});
		it('should remove an directory containing files recursively', () => {
			const tmpDirPath = service.createTmpDir('prefix');
			service.writeFileSync(path.join(tmpDirPath, 'fileName1.txt'), '');
			expect(() => service.readDirSync(tmpDirPath)).not.toThrow();
			service.removeDirRecursive(tmpDirPath);
			expect(() => service.readDirSync(tmpDirPath)).toThrow();
		});
	});

	describe('Using a temp folder', () => {
		/**
		 * used for testing with filesystem actions
		 */
		let tempDir: string;

		beforeEach(() => {
			tempDir = service.createTmpDir('file-system-service-');
		});
		afterEach(() => {
			service.removeDirRecursive(tempDir);
		});

		describe('When reading files from folder', () => {
			it('should list nothing for emtpy folder, especially no . or ..', () => {
				const fileNames = service.readDirSync(tempDir);
				expect(fileNames).toEqual([]);
			});
			it('should list files from folder', () => {
				service.writeFileSync(path.join(tempDir, 'fileName1.txt'), '');
				service.writeFileSync(path.join(tempDir, 'fileName2.txt'), '');
				const fileNames = service.readDirSync(tempDir);
				expect(fileNames).toEqual(expect.arrayContaining(['fileName1.txt', 'fileName2.txt']));
			});
		});

		describe('When write and read text from file', () => {
			it('should write a file to existing folder', () => {
				service.writeFileSync(path.join(tempDir, 'fileName1.txt'), 'fileContent1');
			});
			it('should provide same text after read from write', () => {
				const fileName = 'file.txt';
				const testText = service.readFileSync(path.join(__dirname, 'utf-8-test-file.txt'));
				expect(testText.length).toEqual(7160);
				service.writeFileSync(path.join(tempDir, fileName), testText);
				const text = service.readFileSync(path.join(tempDir, fileName));
				expect(text).toEqual(testText);
			});

			it('should override existing files and replace existing content', () => {
				const fileName = 'fileName2.txt';
				service.writeFileSync(path.join(tempDir, fileName), 'fileContent1');
				const fileContent1 = service.readFileSync(path.join(tempDir, fileName));
				expect(fileContent1).toEqual('fileContent1');
				service.writeFileSync(path.join(tempDir, fileName), 'fileContent2');
				const fileContent2 = service.readFileSync(path.join(tempDir, fileName));
				expect(fileContent2).toEqual('fileContent2');
			});
		});
	});
});
