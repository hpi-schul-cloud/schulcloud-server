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
		it('should create and remove a temporary folder name', async () => {
			const tmpDirPath = await adapter.createTmpDir('prefix');
			expect(tmpDirPath).toContain('prefix');
			await expect(adapter.readDir(tmpDirPath)).rejects.not.toThrow();
			await adapter.removeDirRecursive(tmpDirPath);
			await expect(adapter.readDir(tmpDirPath)).rejects.toThrow();
		});
		it('should produce different folder names for same folder prefix', async () => {
			const namesSet = new Set<string>();
			for (let i = 0; i < 100; i += 1) {
				// eslint-disable-next-line no-await-in-loop
				const tmpDirPath = await adapter.createTmpDir('same-prefix');
				namesSet.add(tmpDirPath);
			}
			expect(namesSet.size).toEqual(100);
			await Promise.all(
				[...namesSet].map((folder) => {
					return adapter.removeDirRecursive(folder);
				})
			);
		});
		it('should remove an directory containing files recursively', async () => {
			const tmpDirPath = await adapter.createTmpDir('prefix');
			await adapter.writeFile(path.join(tmpDirPath, 'fileName1.txt'), '');
			await expect(adapter.readDir(tmpDirPath)).rejects.not.toThrow();
			await adapter.removeDirRecursive(tmpDirPath);
			await expect(adapter.readDir(tmpDirPath)).rejects.toThrow();
		});
	});

	describe('Using a temp folder', () => {
		/**
		 * used for testing with filesystem actions
		 */
		let tempDir: string;

		beforeEach(async () => {
			tempDir = await adapter.createTmpDir('file-system-service-');
		});
		afterEach(async () => {
			await adapter.removeDirRecursive(tempDir);
		});

		describe('When reading files from folder', () => {
			it('should list nothing for emtpy folder, especially no . or ..', async () => {
				const fileNames = await adapter.readDir(tempDir);
				expect(fileNames.length).toEqual(0);
			});
			it('should list files from folder', async () => {
				await adapter.writeFile(path.join(tempDir, 'fileName1.txt'), '');
				await adapter.writeFile(path.join(tempDir, 'fileName2.txt'), '');
				const fileNames = adapter.readDir(tempDir);
				expect(fileNames).toEqual(expect.arrayContaining(['fileName1.txt', 'fileName2.txt']));
			});
		});

		describe('When creating a folder', () => {
			it('should create folder in existing path', async () => {
				const folder = adapter.joinPath(tempDir, 'folderName');
				await adapter.createDir(folder);
			});
			it('should keep folder when already exists', async () => {
				const folder = adapter.joinPath(tempDir, 'folderName');
				await adapter.createDir(folder);
				await adapter.createDir(folder);
			});
		});

		describe('When write and read text from file', () => {
			it('should write a file to existing folder', async () => {
				await adapter.writeFile(path.join(tempDir, 'fileName1.txt'), 'fileContent1');
			});
			it('should not write a file to non-existing folder', async () => {
				await expect(
					adapter.writeFile(path.join(tempDir, 'new-folder', 'fileName1.txt'), 'fileContent1')
				).rejects.toThrow();
			});
			it('should provide same text after read from write', async () => {
				const fileName = 'file.txt';
				// use utf-8 test file content for comparison
				const testText = await adapter.readFile(path.join(__dirname, 'utf-8-test-file.txt'));
				expect(testText.length).toEqual(7160);
				await adapter.writeFile(path.join(tempDir, fileName), testText);
				const text = await adapter.readFile(path.join(tempDir, fileName));
				expect(text).toEqual(testText);
			});

			it('should override existing files and replace existing content', async () => {
				// create file in temp dir with sample content
				const fileName = 'fileName2.txt';
				await adapter.writeFile(path.join(tempDir, fileName), 'fileContent1');
				const fileContent1 = await adapter.readFile(path.join(tempDir, fileName));
				expect(fileContent1).toEqual('fileContent1');
				// override same file with new content
				await adapter.writeFile(path.join(tempDir, fileName), 'fileContent2');
				const fileContent2 = await adapter.readFile(path.join(tempDir, fileName));
				expect(fileContent2).toEqual('fileContent2');
			});
		});
	});
});
