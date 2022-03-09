import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Request } from 'express';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';

import { FilesStorageTestModule } from '@src/modules/files-storage/files-storage.module';
import { FileRecordResponse, RenameFileDto } from '@src/modules/files-storage/controller/dto';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { FileRecord, FileRecordParentType, ICurrentUser } from '@shared/domain';
import {
	userFactory,
	roleFactory,
	cleanupCollections,
	mapUserToCurrentUser,
	fileRecordFactory,
	schoolFactory,
} from '@shared/testing';
import { ApiValidationError } from '@shared/common';

const baseRouteName = '/file/rename/';

class API {
	app: INestApplication;

	constructor(app: INestApplication) {
		this.app = app;
	}

	async patch(requestString: string, body?: RenameFileDto | Record<string, unknown>) {
		const response = await request(this.app.getHttpServer())
			.patch(`${baseRouteName}${requestString}`)
			.set('Accept', 'application/json')
			.send(body || {});

		return {
			result: response.body as FileRecordResponse,
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}
}

describe(`${baseRouteName} (api)`, () => {
	let app: INestApplication;
	let orm: MikroORM;
	let em: EntityManager;
	let currentUser: ICurrentUser;
	let api: API;
	let fileRecord: FileRecord;
	let fileRecords: FileRecord[];

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [FilesStorageTestModule],
		})
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
		await app.init();
		orm = app.get(MikroORM);
		em = module.get(EntityManager);
		api = new API(app);
	});

	afterAll(async () => {
		await orm.close();
		await app.close();
	});

	beforeEach(async () => {
		await cleanupCollections(em);
		const roles = roleFactory.buildList(1, { permissions: [] });
		const school = schoolFactory.build();
		const user = userFactory.build({ roles, school });

		currentUser = mapUserToCurrentUser(user);
		const fileParams = {
			schoolId: school.id,
			parentId: school.id,
			parentType: FileRecordParentType.School,
		};
		fileRecords = fileRecordFactory.buildList(3, fileParams);
		fileRecord = fileRecordFactory.build({ ...fileParams, name: 'test.txt' });
		fileRecords.push(fileRecord);

		await em.persistAndFlush([user, ...fileRecords]);
		em.clear();
	});

	describe('with bad request data', () => {
		it('should return status 400 for invalid fileRecordId', async () => {
			const response = await api.patch(`invalid_id`, { fileName: 'test_new_name.txt' });
			expect(response.error.validationErrors).toEqual([
				{
					errors: ['fileRecordId must be a mongodb id'],
					field: 'fileRecordId',
				},
			]);
			expect(response.status).toEqual(400);
		});

		it('should return status 400 for empty filename', async () => {
			const response = await api.patch(`${fileRecord.id}`, { fileName: undefined });
			expect(response.error.validationErrors).toEqual([
				{
					errors: ['fileName must be a string'],
					field: 'fileName',
				},
			]);
			expect(response.status).toEqual(400);
		});

		it('should return status 409 if filename exists', async () => {
			const response = await api.patch(`${fileRecord.id}`, { fileName: 'test.txt' });
			expect(response.error).toEqual({ code: 409, message: 'FILE_NAME_EXISTS', title: 'Conflict', type: 'CONFLICT' });
			expect(response.status).toEqual(409);
		});
	});

	describe(`with valid request data`, () => {
		it('should return status 200 for successful request', async () => {
			const response = await api.patch(`${fileRecord.id}`, { fileName: 'test_1.txt' });
			expect(response.result.name).toEqual('test_1.txt');
			expect(response.status).toEqual(200);
		});
	});
});
