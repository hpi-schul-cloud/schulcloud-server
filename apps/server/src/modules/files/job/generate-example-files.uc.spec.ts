import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { LegacyLogger } from '@infra/logger';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { StorageProviderRepo } from '@modules/school/repo';
import { storageProviderFactory } from '@modules/school/testing';
import { Test, type TestingModule } from '@nestjs/testing';
import { mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FileOwnerModel } from '../domain';
import type { FileEntity } from '../entity';
import { FilesRepo } from '../repo';
import { GenerateExampleFilesUc, INVALID_PROVIDER_ACCESS_KEY_ID } from './generate-example-files.uc';

jest.mock('@aws-sdk/client-s3', () => {
	const actual = jest.requireActual<object>('@aws-sdk/client-s3');

	return {
		...actual,
		S3Client: class {
			public send = jest.fn().mockResolvedValue({});
		},
	};
});

describe(GenerateExampleFilesUc.name, () => {
	let module: TestingModule;
	let uc: GenerateExampleFilesUc;
	let filesRepo: DeepMocked<FilesRepo>;
	let storageProviderRepo: DeepMocked<StorageProviderRepo>;
	let em: DeepMocked<EntityManager>;
	let tmpDir: string;

	const userId = new ObjectId().toHexString();
	const schoolId = new ObjectId().toHexString();
	const user = { id: userId, firstName: 'A', lastName: 'B', school: { id: schoolId } };
	const team = {
		id: new ObjectId().toHexString(),
		name: 'team',
		teamUsers: [{ user: { id: userId }, school: { id: schoolId } }],
	};
	const course = {
		id: new ObjectId().toHexString(),
		name: 'course',
		school: { id: schoolId },
		teachers: { getItems: () => [{ id: userId }] },
		students: { getItems: () => [{ id: new ObjectId().toHexString() }] },
		substitutionTeachers: { getItems: () => [{ id: new ObjectId().toHexString() }] },
	};

	const writeConfig = async (config: object): Promise<string> => {
		const path = join(tmpDir, 'config.json');
		await writeFile(path, JSON.stringify(config));

		return path;
	};

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				GenerateExampleFilesUc,
				{ provide: FilesRepo, useValue: createMock<FilesRepo>() },
				{ provide: StorageProviderRepo, useValue: createMock<StorageProviderRepo>() },
				{ provide: EntityManager, useValue: createMock<EntityManager>() },
				{ provide: LegacyLogger, useValue: createMock<LegacyLogger>() },
			],
		}).compile();

		uc = module.get(GenerateExampleFilesUc);
		filesRepo = module.get(FilesRepo);
		storageProviderRepo = module.get(StorageProviderRepo);
		em = module.get(EntityManager);

		tmpDir = await mkdtemp(join(tmpdir(), 'example-files-'));
		await writeFile(join(tmpDir, 'example.txt'), 'hello');
		Object.assign(uc, { sampleFilesDir: tmpDir });
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
		storageProviderRepo.findAll.mockResolvedValue([storageProviderFactory.buildWithId()]);
		em.find.mockImplementation((entity: unknown) => {
			const { name } = entity as { name: string };
			const data: Record<string, unknown[]> = { User: [user], CourseEntity: [course], TeamEntity: [team] };

			return Promise.resolve(data[name] ?? []) as never;
		});
	});

	describe('generate', () => {
		it('should create text example files if the sample directory is empty', async () => {
			const emptyDir = await mkdtemp(join(tmpdir(), 'example-files-empty-'));
			const target = join(emptyDir, 'sub');
			Object.assign(uc, { sampleFilesDir: target });
			const path = await writeConfig({ counts: { personal: 1 } });

			await uc.generate(path);

			const names = await readdir(target);
			expect(names).toHaveLength(10);
			for (const name of names) {
				const { size } = await stat(join(target, name));
				const content = await readFile(join(target, name), 'utf-8');
				expect(size).toBeGreaterThanOrEqual(3 * 1024 * 1024);
				expect(size).toBeLessThanOrEqual(8 * 1024 * 1024);
				expect(content.startsWith('Beispieldatei\n')).toBe(true);
				expect(name).toContain(`${(size / 1024 / 1024).toFixed(2)}MByte.txt`);
				expect(content.endsWith(`Gesamtgröße: ${(size / 1024 / 1024).toFixed(2)} MByte`)).toBe(true);
				expect(content.split('\n')[1]).toBe(`${'.'.repeat(100)} 119`);
			}

			Object.assign(uc, { sampleFilesDir: tmpDir });
			await rm(emptyDir, { recursive: true });
		});

		it('should refuse to run in production', async () => {
			/* eslint-disable no-process-env */
			const { NODE_ENV: env } = process.env;
			process.env.NODE_ENV = 'production';
			await expect(uc.generate('x')).rejects.toThrow('production');
			process.env.NODE_ENV = env;
			/* eslint-enable no-process-env */
		});

		it('should create files of all kinds and broken variants', async () => {
			const path = await writeConfig({
				counts: { personal: 2, course: 1, teams: 6 },
				brokenTeamsFiles: {
					noStorageProvider: 1,
					unknownStorageProvider: 1,
					nonExistingBucket: 1,
					markedDeleted: 1,
					directories: 1,
				},
			});

			await uc.generate(path);

			const saved = filesRepo.save.mock.calls[0][0] as FileEntity[];
			const byModel = (model: FileOwnerModel): FileEntity[] => saved.filter((f) => f.refOwnerModel === model);
			const teams = byModel(FileOwnerModel.TEAMS);

			expect(byModel(FileOwnerModel.USER)).toHaveLength(2);
			expect(byModel(FileOwnerModel.COURSE)).toHaveLength(1);
			expect(teams).toHaveLength(6);
			expect(byModel(FileOwnerModel.USER)[0].ownerId).toBe(userId);
			expect(teams.filter((f) => f.isDirectory)).toHaveLength(1);
			expect(teams.filter((f) => !f.isDirectory && !f.storageProvider)).toHaveLength(1);
			expect(teams.filter((f) => f.isMarkedForDeletion())).toHaveLength(1);
			expect(teams.filter((f) => f.bucket?.endsWith('-missing'))).toHaveLength(1);
			expect(teams.filter((f) => f.storageProvider?.accessKeyId === INVALID_PROVIDER_ACCESS_KEY_ID)).toHaveLength(1);
			expect(storageProviderRepo.save).toHaveBeenCalledTimes(1);
		});

		it('should fail if a requested owner kind has no entities', async () => {
			em.find.mockResolvedValue([] as never);
			const path = await writeConfig({ counts: { personal: 1 } });

			await expect(uc.generate(path)).rejects.toThrow();
		});
	});

	describe('generate with missing owners', () => {
		it('should fail if no courses are found', async () => {
			em.find.mockResolvedValue([] as never);
			const path = await writeConfig({ counts: { course: 1 } });

			await expect(uc.generate(path)).rejects.toThrow('No matching courses found');
		});

		it('should fail if no teams are found', async () => {
			em.find.mockResolvedValue([] as never);
			const path = await writeConfig({ counts: { teams: 1 } });

			await expect(uc.generate(path)).rejects.toThrow('No matching teams found');
		});

		it('should filter courses and teams by configured userIds', async () => {
			const path = await writeConfig({ userIds: [userId], counts: { course: 1, teams: 1 } });

			await uc.generate(path);

			const saved = filesRepo.save.mock.calls[0][0] as FileEntity[];
			expect(saved).toHaveLength(2);
		});
	});

	describe('generate with missing bucket', () => {
		it('should create the bucket if it does not exist', async () => {
			const provider = storageProviderFactory.buildWithId();
			storageProviderRepo.findAll.mockResolvedValue([provider]);
			const send = jest.fn().mockImplementation((command: object) => {
				if (command.constructor.name === 'HeadBucketCommand') return Promise.reject(new Error('missing'));

				return Promise.resolve({});
			});
			(uc as unknown as { s3Clients: Map<string, unknown> }).s3Clients.set(provider.id, { send });
			const path = await writeConfig({ counts: { personal: 1 } });

			await uc.generate(path);

			const commandNames = send.mock.calls.map(([command]: [object]) => command.constructor.name);
			expect(commandNames).toContain('CreateBucketCommand');
		});
	});

	describe('generate with provider and user selection', () => {
		it('should use the configured storage provider', async () => {
			const first = storageProviderFactory.buildWithId();
			const second = storageProviderFactory.buildWithId();
			storageProviderRepo.findAll.mockResolvedValue([first, second]);
			const path = await writeConfig({ storageProviderId: second.id, counts: { personal: 1 } });

			await uc.generate(path);

			const saved = filesRepo.save.mock.calls[0][0] as FileEntity[];
			expect(saved[0].storageProvider?.id).toBe(second.id);
		});

		it('should fail if no usable storage provider exists', async () => {
			storageProviderRepo.findAll.mockResolvedValue([]);
			const path = await writeConfig({ counts: { personal: 1 } });

			await expect(uc.generate(path)).rejects.toThrow('No usable storage provider');
		});

		it('should fail if not all configured users are found', async () => {
			const path = await writeConfig({ userIds: [userId, new ObjectId().toHexString()], counts: { personal: 1 } });

			await expect(uc.generate(path)).rejects.toThrow('Not all configured users were found');
		});

		it('should ignore empty sample files', async () => {
			await writeFile(join(tmpDir, 'empty.txt'), '');
			const path = await writeConfig({ counts: { personal: 1 } });

			await expect(uc.generate(path)).resolves.toBeUndefined();
			await rm(join(tmpDir, 'empty.txt'));
		});
	});

	describe('nextTotal', () => {
		it('should not append a filler line if the content already has the exact size', () => {
			const { buildTextContent } = uc as unknown as { buildTextContent: (size: number, mb: string) => Buffer };
			const footer = 'Gesamtgröße: 1.00 MByte';
			const size = Buffer.byteLength('Beispieldatei\n') + Buffer.byteLength(footer);

			const result = buildTextContent.call(uc, size, '1.00');

			expect(result.toString()).toBe(`Beispieldatei\n${footer}`);
		});

		it('should use a generic mime type for unknown file extensions', async () => {
			await writeFile(join(tmpDir, 'data.unknownext'), 'x');
			const send = jest.fn().mockResolvedValue({});
			const provider = storageProviderFactory.buildWithId();
			storageProviderRepo.findAll.mockResolvedValue([provider]);
			(uc as unknown as { s3Clients: Map<string, unknown> }).s3Clients.set(provider.id, { send });
			const path = await writeConfig({ counts: { personal: 2 } });

			await uc.generate(path);

			const types = send.mock.calls.map(
				([command]: [{ input: { ContentType?: string } }]) => command.input.ContentType
			);
			expect(types).toContain('application/octet-stream');
			await rm(join(tmpDir, 'data.unknownext'));
		});

		it('should reuse an existing invalid provider', async () => {
			const valid = storageProviderFactory.buildWithId();
			const invalid = storageProviderFactory.buildWithId({ accessKeyId: INVALID_PROVIDER_ACCESS_KEY_ID });
			storageProviderRepo.findAll.mockResolvedValue([valid, invalid]);
			const path = await writeConfig({ counts: { teams: 1 }, brokenTeamsFiles: { unknownStorageProvider: 1 } });

			await uc.generate(path);

			expect(storageProviderRepo.save).not.toHaveBeenCalled();
		});

		it('should throw if the line length cannot be computed', () => {
			const { nextTotal } = uc as unknown as { nextTotal: (written: number, dotCount: number) => number };

			expect(() => nextTotal.call(uc, 1e12, 100)).toThrow('Unable to compute line length');
		});
	});

	describe('remove', () => {
		it('should delete generated files and the invalid provider', async () => {
			const invalid = storageProviderFactory.buildWithId({ accessKeyId: INVALID_PROVIDER_ACCESS_KEY_ID });
			storageProviderRepo.findAll.mockResolvedValue([invalid]);
			const file = { id: 'f', isDirectory: false, storageProvider: invalid, bucket: 'b', storageFileName: 'k' };
			filesRepo.findByNamePrefix.mockResolvedValue([file as unknown as FileEntity]);
			const path = await writeConfig({ counts: {} });

			await uc.remove(path);

			expect(filesRepo.delete).toHaveBeenCalledWith([file]);
			expect(storageProviderRepo.delete).toHaveBeenCalledWith([invalid]);
		});

		it('should skip storage deletion for directories and files without provider', async () => {
			const send = jest.fn();
			const provider = storageProviderFactory.buildWithId();
			(uc as unknown as { s3Clients: Map<string, unknown> }).s3Clients.set(provider.id, { send });
			const directory = { id: 'd', isDirectory: true, storageProvider: provider };
			const noProvider = { id: 'n', isDirectory: false };
			filesRepo.findByNamePrefix.mockResolvedValue([directory, noProvider] as unknown as FileEntity[]);
			const path = await writeConfig({ counts: {} });

			await uc.remove(path);

			expect(send).not.toHaveBeenCalled();
		});

		it('should log a warning if deleting the storage object fails', async () => {
			const logger = module.get<DeepMocked<LegacyLogger>>(LegacyLogger);
			const provider = storageProviderFactory.buildWithId();
			const send = jest.fn().mockRejectedValue(new Error('boom'));
			(uc as unknown as { s3Clients: Map<string, unknown> }).s3Clients.set(provider.id, { send });
			const file = { id: 'f', isDirectory: false, storageProvider: provider, bucket: 'b', storageFileName: 'k' };
			filesRepo.findByNamePrefix.mockResolvedValue([file] as unknown as FileEntity[]);
			const path = await writeConfig({ counts: {} });

			await uc.remove(path);

			expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('boom'));
		});
	});
});
