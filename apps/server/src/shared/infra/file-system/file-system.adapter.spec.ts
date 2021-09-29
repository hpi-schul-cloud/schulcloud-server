import { Test, TestingModule } from '@nestjs/testing';
import * as path from 'path';
import { FileSystemAdapter } from './file-system.adapter';

describe('FileSystemAdapter', () => {
	let adapter: FileSystemAdapter;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [FileSystemAdapter],
		}).compile();
		adapter = module.get<FileSystemAdapter>(FileSystemAdapter);
	});

	it('should be defined', () => {
		expect(adapter).toBeDefined();
	});

	describe('When using a temporary folder', () => {
		it('should create and remove a temporary folder name', () => {
			const tmpDirPath = adapter.createTmpDir('prefix');
			expect(tmpDirPath).toContain('prefix');
			expect(() => adapter.readDirSync(tmpDirPath)).not.toThrow();
			adapter.removeDirRecursive(tmpDirPath);
			expect(() => adapter.readDirSync(tmpDirPath)).toThrow();
		});
		it('should produce different folder names for same folder prefix', () => {
			const namesSet = new Set<string>();
			for (let i = 0; i < 100; i += 1) {
				const tmpDirPath = adapter.createTmpDir('same-prefix');
				namesSet.add(tmpDirPath);
			}
			expect(namesSet.size).toEqual(100);
			namesSet.forEach((folder) => {
				adapter.removeDirRecursive(folder);
			});
		});
		it('should remove an directory containing files recursively', () => {
			const tmpDirPath = adapter.createTmpDir('prefix');
			adapter.writeFileSync(path.join(tmpDirPath, 'fileName1.txt'), '');
			expect(() => adapter.readDirSync(tmpDirPath)).not.toThrow();
			adapter.removeDirRecursive(tmpDirPath);
			expect(() => adapter.readDirSync(tmpDirPath)).toThrow();
		});
	});

	describe('Using a temp folder', () => {
		/**
		 * used for testing with filesystem actions
		 */
		let tempDir: string;

		beforeEach(() => {
			tempDir = adapter.createTmpDir('file-system-service-');
		});
		afterEach(() => {
			adapter.removeDirRecursive(tempDir);
		});

		describe('When reading files from folder', () => {
			it('should list nothing for emtpy folder, especially no . or ..', () => {
				const fileNames = adapter.readDirSync(tempDir);
				expect(fileNames.length).toEqual(0);
			});
			it('should list files from folder', () => {
				adapter.writeFileSync(path.join(tempDir, 'fileName1.txt'), '');
				adapter.writeFileSync(path.join(tempDir, 'fileName2.txt'), '');
				const fileNames = adapter.readDirSync(tempDir);
				expect(fileNames).toEqual(expect.arrayContaining(['fileName1.txt', 'fileName2.txt']));
			});
		});

		describe('When write and read text from file', () => {
			it('should write a file to existing folder', () => {
				adapter.writeFileSync(path.join(tempDir, 'fileName1.txt'), 'fileContent1');
			});
			it('should not write a file to non-existing folder', () => {
				expect(() =>
					adapter.writeFileSync(path.join(tempDir, 'new-folder', 'fileName1.txt'), 'fileContent1')
				).toThrow();
			});
			it('should provide same text after read from write', () => {
				const fileName = 'file.txt';
				// use utf-8 test file content for comparison
				const testText = adapter.readFileSync(path.join(__dirname, 'utf-8-test-file.txt'));
				expect(testText.length).toEqual(7160);
				adapter.writeFileSync(path.join(tempDir, fileName), testText);
				const text = adapter.readFileSync(path.join(tempDir, fileName));
				expect(text).toEqual(testText);
			});

			it('should override existing files and replace existing content', () => {
				// create file in temp dir with sample content
				const fileName = 'fileName2.txt';
				adapter.writeFileSync(path.join(tempDir, fileName), 'fileContent1');
				const fileContent1 = adapter.readFileSync(path.join(tempDir, fileName));
				expect(fileContent1).toEqual('fileContent1');
				// override same file with new content
				adapter.writeFileSync(path.join(tempDir, fileName), 'fileContent2');
				const fileContent2 = adapter.readFileSync(path.join(tempDir, fileName));
				expect(fileContent2).toEqual('fileContent2');
			});
		});
	});
});
