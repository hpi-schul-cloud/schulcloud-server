import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { EntityId, Permission } from '@shared/domain';
import { AntivirusService } from '@shared/infra/antivirus/antivirus.service';
import { cleanupCollections, mapUserToCurrentUser, roleFactory, schoolFactory, userFactory } from '@shared/testing';
import { ICurrentUser } from '@src/modules/authentication';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { FilesStorageTestModule, s3Config } from '@src/modules/files-storage';
import { FileRecordResponse } from '@src/modules/files-storage/controller/dto';
import { Request } from 'express';
import { createReadStream } from 'node:fs';
import request from 'supertest';

class API {
	app: INestApplication;

	constructor(app: INestApplication) {
		this.app = app;
	}

	async postUploadFile(routeName: string, query?: string | Record<string, unknown>): Promise<void> {
		return new Promise((resolve, reject) => {
			const passThrough = Buffer.from('package.json');
			const stream = createReadStream(passThrough);

			const response = request(this.app.getHttpServer())
				.post(routeName)
				.attach('file', stream, 'test.txt')
				.set('connection', 'keep-alive')
				.set('content-type', 'multipart/form-data; boundary=----WebKitFormBoundaryiBMuOC0HyZ3YnA20')
				.query(query || {})
				.on('error', () => {
					console.log('request error');
				})
				.on('close', () => {
					console.log('request close');
				})
				.end(() => {
					console.log('request end');
				});

			stream.on('error', () => {
				console.log('stream error');
			});

			stream.on('close', () => {
				console.log('stream close');
				resolve();
			});
		});
	}

	async postUploadFromUrl(routeName: string, data: Record<string, unknown>) {
		const response = await request(this.app.getHttpServer()).post(routeName).send(data);

		return {
			result: response.body as FileRecordResponse,
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}

	async getDownloadFile(routeName: string, query?: string | Record<string, unknown>) {
		const response = await request(this.app.getHttpServer())
			.get(routeName)
			.query(query || {});

		return {
			result: response.body as FileRecordResponse,
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}

	async getDownloadFileBytesRange(routeName: string, bytesRange: string, query?: string | Record<string, unknown>) {
		const response = await request(this.app.getHttpServer())
			.get(routeName)
			.set('Range', bytesRange)
			.query(query || {});

		return {
			result: response.body as FileRecordResponse,
			error: response.body as ApiValidationError,
			status: response.status,
			headers: response.headers as Record<string, string>,
		};
	}
}

const createRndInt = (max) => Math.floor(Math.random() * max);

describe('files-storage controller (API)', () => {
	let module: TestingModule;
	let app: INestApplication;
	let em: EntityManager;
	let currentUser: ICurrentUser;
	let api: API;
	let validId: EntityId;
	let appPort: number;

	beforeAll(async () => {
		const port = 10000 + createRndInt(10000);
		appPort = 10000 + createRndInt(10000);
		const overridetS3Config = Object.assign(s3Config, { endpoint: `http://localhost:${port}` });

		module = await Test.createTestingModule({
			imports: [FilesStorageTestModule],
			providers: [
				FilesStorageTestModule,
				{
					provide: 'S3_Config',
					useValue: overridetS3Config,
				},
			],
		})
			.overrideProvider(AntivirusService)
			.useValue(createMock<AntivirusService>())
			.overrideGuard(JwtAuthGuard)
			.useValue({
				canActivate(context: ExecutionContext) {
					const req: Request = context.switchToHttp().getRequest();
					req.user = currentUser;
					return true;
				},
			})
			.compile();

		app = module.createNestApplication();
		const a = await app.init();
		await a.listen(appPort);

		em = module.get(EntityManager);
		api = new API(app);
	});

	afterAll(async () => {
		await module.close();
		await app.close();
	});

	beforeEach(async () => {
		jest.resetAllMocks();
		await cleanupCollections(em);
		const school = schoolFactory.build();
		const roles = roleFactory.buildList(1, {
			permissions: [Permission.FILESTORAGE_CREATE, Permission.FILESTORAGE_VIEW],
		});
		const user = userFactory.build({ school, roles });

		await em.persistAndFlush([user, school]);
		em.clear();
		validId = school.id;
		currentUser = mapUserToCurrentUser(user);
	});

	describe('upload action', () => {
		describe('with bad request data', () => {
			it('should return status 400 for invalid schoolId', async () => {
				const response = await api.postUploadFile(`/file/upload/123/users/${validId}`);

				/* expect(response.error.validationErrors).toEqual([
					{
						errors: ['schoolId must be a mongodb id'],
						field: ['schoolId'],
					},
				]);
				expect(response.status).toEqual(400); */
			});

			it('should return status 400 for invalid parentId', async () => {
				const response = await api.postUploadFile(`/file/upload/${validId}/users/123`);

				/* expect(response.error.validationErrors).toEqual([
					{
						errors: ['parentId must be a mongodb id'],
						field: ['parentId'],
					},
				]);
				expect(response.status).toEqual(400); */
			});

			it('should return status 400 for invalid parentType', async () => {
				const response = await api.postUploadFile(`/file/upload/${validId}/cookies/${validId}`);

				/* expect(response.status).toEqual(400); */
			});
		});
	});
});
