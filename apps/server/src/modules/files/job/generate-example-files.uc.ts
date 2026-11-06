import {
	CreateBucketCommand,
	DeleteObjectCommand,
	HeadBucketCommand,
	PutObjectCommand,
	S3Client,
} from '@aws-sdk/client-s3';
import { LegacyLogger } from '@infra/logger';
import { EntityManager } from '@mikro-orm/mongodb';
import { CourseEntity } from '@modules/course/repo';
import { StorageProviderEntity, StorageProviderRepo } from '@modules/school/repo';
import { TeamEntity } from '@modules/team/repo';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';
import { TypeGuard } from '@shared/common/guards';
import { EntityId } from '@shared/domain/types';
import { randomInt } from 'node:crypto';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { v4 as uuid } from 'uuid';
import { FileOwnerModel, FilePermissionReferenceModel } from '../domain';
import { FileEntity, FilePermissionEntity } from '../entity';
import { FilesRepo } from '../repo';
import { ExampleFilesConfig, parseExampleFilesConfig } from './example-files.config';

const SAVE_BATCH_SIZE = 100;

const SAMPLE_FILES_DIR = './test/sample-files';
const GENERATED_FILES_COUNT = 10;
const MEGABYTE = 1024 * 1024;
const MIN_GENERATED_SIZE = 3 * MEGABYTE;
const MAX_GENERATED_SIZE = 8 * MEGABYTE;

export const INVALID_PROVIDER_ACCESS_KEY_ID = 'example-file-generator-invalid-credentials';

const MIME_TYPES: Record<string, string> = {
	'.txt': 'text/plain',
	'.pdf': 'application/pdf',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.svg': 'image/svg+xml',
	'.csv': 'text/csv',
	'.json': 'application/json',
	'.doc': 'application/msword',
	'.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	'.mp3': 'audio/mpeg',
	'.mp4': 'video/mp4',
	'.zip': 'application/zip',
};

type FileVariant =
	'valid' | 'noStorageProvider' | 'unknownStorageProvider' | 'nonExistingBucket' | 'markedDeleted' | 'directory';

interface OwnerTarget {
	ownerId: EntityId;
	schoolId: EntityId;
	memberIds: EntityId[];
	creatorId?: EntityId;
	label: string;
}

interface PlannedFile {
	model: FileOwnerModel;
	variant: FileVariant;
	target: OwnerTarget;
}

interface ExampleFile {
	name: string;
	path: string;
	size: number;
	type: string;
}

@Injectable()
export class GenerateExampleFilesUc {
	private readonly createdBuckets = new Set<string>();

	private readonly s3Clients = new Map<string, S3Client>();

	private readonly sampleFilesDir = resolve(process.cwd(), SAMPLE_FILES_DIR);

	constructor(
		private readonly filesRepo: FilesRepo,
		private readonly storageProviderRepo: StorageProviderRepo,
		private readonly em: EntityManager,
		private readonly logger: LegacyLogger
	) {
		this.logger.setContext(GenerateExampleFilesUc.name);
	}

	public async generate(configPath: string): Promise<void> {
		this.assertNotProduction();
		const config = await this.loadConfig(configPath);

		const exampleFiles = await this.prepareExampleFiles();
		const providers = await this.storageProviderRepo.findAll();
		const baseProvider = this.selectBaseProvider(providers, config);
		const planned = await this.planFiles(config);

		const invalidProvider = await this.getInvalidProviderIfNeeded(providers, baseProvider, config);

		const total = planned.length;
		let batch: FileEntity[] = [];
		let created = 0;
		for (const [index, item] of planned.entries()) {
			const file = await this.createFile(item, index, config, exampleFiles, baseProvider, invalidProvider);
			batch.push(file);

			if (batch.length >= SAVE_BATCH_SIZE || index === total - 1) {
				await this.filesRepo.save(batch);
				created += batch.length;
				batch = [];
			}

			this.logger.log(`${index + 1} / ${total}: ${item.model} | ${item.target.label} | ${item.variant} | ${file.name}`);
		}

		this.logger.log(`Generated ${created} / ${total} files.`);
	}

	public async remove(configPath: string): Promise<void> {
		this.assertNotProduction();
		const config = await this.loadConfig(configPath);

		const providers = await this.storageProviderRepo.findAll();
		providers.forEach((provider) => this.s3Clients.set(provider.id, this.createClient(provider)));

		const files = await this.filesRepo.findByNamePrefix(config.namePrefix);
		for (const file of files) {
			await this.deleteFromStorage(file);
		}
		await this.filesRepo.delete(files);

		const invalidProviders = providers.filter((provider) => provider.accessKeyId === INVALID_PROVIDER_ACCESS_KEY_ID);
		if (invalidProviders.length > 0) {
			await this.storageProviderRepo.delete(invalidProviders);
		}

		this.logger.log(`Removed ${files.length} files starting with '${config.namePrefix}'.`);
	}

	private assertNotProduction(): void {
		// eslint-disable-next-line no-process-env
		if (process.env.NODE_ENV === 'production') {
			throw new Error('The example file generator must not be used in production.');
		}
	}

	private async loadConfig(configPath: string): Promise<ExampleFilesConfig> {
		const content = await readFile(configPath, 'utf-8');
		const config = parseExampleFilesConfig(JSON.parse(content));

		return config;
	}

	private async prepareExampleFiles(): Promise<ExampleFile[]> {
		await mkdir(this.sampleFilesDir, { recursive: true });

		let files = await this.readExampleFiles(this.sampleFilesDir);
		if (files.length === 0) {
			this.logger.log(`No example files found in ${this.sampleFilesDir}, generating text files.`);
			for (let i = 0; i < GENERATED_FILES_COUNT; i += 1) {
				await this.createTextExampleFile(i);
			}
			files = await this.readExampleFiles(this.sampleFilesDir);
		}

		return files;
	}

	private async createTextExampleFile(index: number): Promise<void> {
		const size = randomInt(MIN_GENERATED_SIZE, MAX_GENERATED_SIZE + 1);
		const sizeInMB = (size / MEGABYTE).toFixed(2);
		const name = `example-file-${index + 1}-${sizeInMB}MByte.txt`;

		await writeFile(join(this.sampleFilesDir, name), this.buildTextContent(size, sizeInMB));
	}

	private buildTextContent(size: number, sizeInMB: string): Buffer {
		const header = 'Beispieldatei\n';
		const footer = `Gesamtgröße: ${sizeInMB} MByte`;
		const dots = '.'.repeat(100);
		const bodyLimit = size - Buffer.byteLength(footer);

		const parts: string[] = [header];
		let written = Buffer.byteLength(header);
		for (;;) {
			const total = this.nextTotal(written, dots.length);
			if (total > bodyLimit) break;
			parts.push(`${dots} ${total}\n`);
			written = total;
		}

		// the last line is filled with dots to reach the exact size
		const rest = bodyLimit - written;
		if (rest > 0) {
			parts.push(`${'.'.repeat(rest - 1)}\n`);
		}
		parts.push(footer);

		return Buffer.from(parts.join(''));
	}

	// the number printed after a line is the byte count including that line, so its digits are part of the line
	private nextTotal(written: number, dotCount: number): number {
		for (let digits = 1; digits <= 10; digits += 1) {
			const total = written + dotCount + 1 + digits + 1;
			if (String(total).length === digits) return total;
		}

		throw new Error('Unable to compute line length');
	}

	private async readExampleFiles(dir: string): Promise<ExampleFile[]> {
		const names = (await readdir(dir)).sort();
		const files: ExampleFile[] = [];

		for (const name of names) {
			const path = join(dir, name);
			const stats = await stat(path);
			if (stats.isFile() && stats.size > 0) {
				files.push({
					name,
					path,
					size: stats.size,
					type: MIME_TYPES[extname(name).toLowerCase()] ?? 'application/octet-stream',
				});
			}
		}

		return files;
	}

	private selectBaseProvider(providers: StorageProviderEntity[], config: ExampleFilesConfig): StorageProviderEntity {
		const valid = providers.filter((provider) => provider.accessKeyId !== INVALID_PROVIDER_ACCESS_KEY_ID);
		const provider = config.storageProviderId ? valid.find(({ id }) => id === config.storageProviderId) : valid[0];

		return TypeGuard.checkNotNullOrUndefined(provider, new Error('No usable storage provider found in the database.'));
	}

	private async getInvalidProviderIfNeeded(
		providers: StorageProviderEntity[],
		baseProvider: StorageProviderEntity,
		config: ExampleFilesConfig
	): Promise<StorageProviderEntity | undefined> {
		if (config.brokenTeamsFiles.unknownStorageProvider === 0) {
			return undefined;
		}

		let invalidProvider = providers.find((provider) => provider.accessKeyId === INVALID_PROVIDER_ACCESS_KEY_ID);
		if (!invalidProvider) {
			invalidProvider = new StorageProviderEntity({
				endpointUrl: baseProvider.endpointUrl,
				region: baseProvider.region,
				accessKeyId: INVALID_PROVIDER_ACCESS_KEY_ID,
				secretAccessKey: 'invalid-secret',
			});
			await this.storageProviderRepo.save(invalidProvider);
		}

		return invalidProvider;
	}

	private async planFiles(config: ExampleFilesConfig): Promise<PlannedFile[]> {
		const { counts, brokenTeamsFiles: broken } = config;
		const planned: PlannedFile[] = [];

		const addAll = (model: FileOwnerModel, variants: FileVariant[], targets: OwnerTarget[]): void => {
			variants.forEach((variant, index) => {
				planned.push({ model, variant, target: targets[index % targets.length] });
			});
		};

		if (counts.personal > 0) {
			const targets = await this.loadUserTargets(config.userIds);
			addAll(FileOwnerModel.USER, new Array<FileVariant>(counts.personal).fill('valid'), targets);
		}

		if (counts.course > 0) {
			const targets = await this.loadCourseTargets(config.userIds);
			addAll(FileOwnerModel.COURSE, new Array<FileVariant>(counts.course).fill('valid'), targets);
		}

		if (counts.teams > 0) {
			const targets = await this.loadTeamTargets(config.userIds);
			const brokenVariants: FileVariant[] = [
				...new Array<FileVariant>(broken.noStorageProvider).fill('noStorageProvider'),
				...new Array<FileVariant>(broken.unknownStorageProvider).fill('unknownStorageProvider'),
				...new Array<FileVariant>(broken.nonExistingBucket).fill('nonExistingBucket'),
				...new Array<FileVariant>(broken.markedDeleted).fill('markedDeleted'),
				...new Array<FileVariant>(broken.directories).fill('directory'),
			];
			const validCount = counts.teams - brokenVariants.length;
			addAll(FileOwnerModel.TEAMS, [...new Array<FileVariant>(validCount).fill('valid'), ...brokenVariants], targets);
		}

		return planned;
	}

	private async loadUserTargets(userIds?: EntityId[]): Promise<OwnerTarget[]> {
		const users = await this.findUsers(userIds);

		return users.map((user) => {
			return {
				ownerId: user.id,
				schoolId: user.school.id,
				memberIds: [user.id],
				creatorId: user.id,
				label: `user ${user.id} (${user.firstName} ${user.lastName})`,
			};
		});
	}

	private async findUsers(userIds?: EntityId[]): Promise<User[]> {
		const users = await this.em.find(User, userIds ? { id: { $in: userIds } } : {});

		if (users.length === 0 || (userIds && users.length !== userIds.length)) {
			throw new Error('Not all configured users were found (or no users exist). Load seed data first.');
		}

		return users;
	}

	private async loadCourseTargets(userIds?: EntityId[]): Promise<OwnerTarget[]> {
		const filter = userIds
			? {
					$or: [
						{ students: { $in: userIds } },
						{ teachers: { $in: userIds } },
						{ substitutionTeachers: { $in: userIds } },
					],
				}
			: {};
		const courses = await this.em.find(CourseEntity, filter, {
			populate: ['students', 'teachers', 'substitutionTeachers'] as never[],
		});

		if (courses.length === 0) {
			throw new Error('No matching courses found. Load seed data first.');
		}

		return courses.map((course) => {
			const teacherIds = course.teachers.getItems().map((user) => user.id);
			const memberIds = [
				...teacherIds,
				...course.substitutionTeachers.getItems().map((user) => user.id),
				...course.students.getItems().map((user) => user.id),
			];

			return {
				ownerId: course.id,
				schoolId: course.school.id,
				memberIds,
				creatorId: memberIds[0],
				label: `course ${course.id} (${course.name})`,
			};
		});
	}

	private async loadTeamTargets(userIds?: EntityId[]): Promise<OwnerTarget[]> {
		const teams = await this.em.find(TeamEntity, {});

		const targets = teams
			.filter((team) => team.teamUsers.length > 0)
			.filter((team) => !userIds || team.teamUsers.some((teamUser) => userIds.includes(teamUser.user.id)))
			.map((team) => {
				const memberIds = team.teamUsers.map((teamUser) => teamUser.user.id);

				return {
					ownerId: team.id,
					schoolId: team.teamUsers[0].school.id,
					memberIds,
					creatorId: memberIds[0],
					label: `team ${team.id} (${team.name})`,
				};
			});

		if (targets.length === 0) {
			throw new Error('No matching teams found. Load seed data first.');
		}

		return targets;
	}

	private async createFile(
		item: PlannedFile,
		index: number,
		config: ExampleFilesConfig,
		exampleFiles: ExampleFile[],
		baseProvider: StorageProviderEntity,
		invalidProvider?: StorageProviderEntity
	): Promise<FileEntity> {
		const { target, model, variant } = item;
		const permissions = target.memberIds.map(
			(refId) => new FilePermissionEntity({ refId, refPermModel: FilePermissionReferenceModel.USER })
		);
		const common = { ownerId: target.ownerId, refOwnerModel: model, creatorId: target.creatorId, permissions };

		if (variant === 'directory') {
			return new FileEntity({ ...common, name: `${config.namePrefix}folder-${index}`, isDirectory: true });
		}

		const example = exampleFiles[index % exampleFiles.length];
		const bucket = `bucket-${target.schoolId}`;
		const storageFileName = `${target.ownerId}/${uuid()}-${example.name}`;
		const provider =
			variant === 'unknownStorageProvider'
				? TypeGuard.checkNotNullOrUndefined(invalidProvider, new Error('Missing invalid provider.'))
				: baseProvider;

		const file = new FileEntity({
			...common,
			name: `${config.namePrefix}${example.name}`,
			size: example.size,
			type: example.type,
			storageFileName,
			bucket: variant === 'nonExistingBucket' ? `${bucket}-missing` : bucket,
			storageProvider: provider,
			...(variant === 'markedDeleted' ? { deleted: true, deletedAt: this.daysAgo(30) } : {}),
		});

		if (variant === 'noStorageProvider') {
			file.storageProvider = undefined;
		}

		if (variant === 'valid' || variant === 'markedDeleted') {
			await this.upload(baseProvider, bucket, storageFileName, example);
		}

		return file;
	}

	private daysAgo(days: number): Date {
		const date = new Date();
		date.setDate(date.getDate() - days);

		return date;
	}

	private getClient(provider: StorageProviderEntity): S3Client {
		let client = this.s3Clients.get(provider.id);
		if (!client) {
			client = this.createClient(provider);
			this.s3Clients.set(provider.id, client);
		}

		return client;
	}

	private createClient(provider: StorageProviderEntity): S3Client {
		return new S3Client({
			endpoint: provider.endpointUrl,
			forcePathStyle: true,
			region: provider.region,
			tls: true,
			credentials: { accessKeyId: provider.accessKeyId, secretAccessKey: provider.secretAccessKey },
		});
	}

	private async upload(
		provider: StorageProviderEntity,
		bucket: string,
		key: string,
		example: ExampleFile
	): Promise<void> {
		const client = this.getClient(provider);
		await this.ensureBucket(client, provider.id, bucket);

		const body = await readFile(example.path);
		await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: example.type }));
	}

	private async ensureBucket(client: S3Client, providerId: string, bucket: string): Promise<void> {
		const cacheKey = `${providerId}/${bucket}`;
		if (this.createdBuckets.has(cacheKey)) {
			return;
		}

		try {
			await client.send(new HeadBucketCommand({ Bucket: bucket }));
		} catch {
			await client.send(new CreateBucketCommand({ Bucket: bucket }));
		}
		this.createdBuckets.add(cacheKey);
	}

	private async deleteFromStorage(file: FileEntity): Promise<void> {
		if (file.isDirectory || !file.storageProvider) {
			return;
		}

		try {
			await this.getClient(file.storageProvider).send(
				new DeleteObjectCommand({ Bucket: file.bucket, Key: file.storageFileName })
			);
		} catch (error) {
			this.logger.warn(`Could not delete storage object of file ${file.id}: ${(error as Error).message}`);
		}
	}
}
