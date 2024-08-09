import { createMock } from '@golevelup/ts-jest';
import { AuthorizationClientAdapter } from '@infra/authorization-client';
import { EntityManager } from '@mikro-orm/mongodb';
import { ICurrentUser } from '@modules/authentication';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import {
	cleanupCollections,
	fileRecordFactory,
	mapUserToCurrentUser,
	schoolEntityFactory,
	UserAndAccountTestFactory,
} from '@shared/testing';
import { JwtAuthGuard } from '@src/infra/auth-guard/guard/jwt-auth.guard';
import NodeClam from 'clamscan';
import { Request } from 'express';
import request from 'supertest';
import { FileRecord } from '../../entity';
import { FilesStorageTestModule } from '../../files-storage-test.module';
import { FileRecordParentType } from '../../interface';
import { FileRecordResponse, RenameFileParams } from '../dto';

const baseRouteName = '/file/rename/';

class API {
	app: INestApplication;

	constructor(app: INestApplication) {
		this.app = app;
	}

	async patch(requestString: string, body?: RenameFileParams | Record<string, unknown>) {
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
			.overrideProvider(NodeClam)
			.useValue(createMock<NodeClam>())
			.overrideProvider(AuthorizationClientAdapter)
			.useValue(createMock<AuthorizationClientAdapter>())
			.compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		api = new API(app);
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		await cleanupCollections(em);
		const school = schoolEntityFactory.build();
		const { studentUser: user, studentAccount: account } = UserAndAccountTestFactory.buildStudent({ school });

		await em.persistAndFlush([user, account]);

		const fileParams = {
			schoolId: school.id,
			parentId: school.id,
			parentType: FileRecordParentType.School,
		};
		fileRecords = fileRecordFactory.buildList(3, fileParams);
		fileRecord = fileRecordFactory.build({ ...fileParams, name: 'test.txt', creatorId: user.id });
		fileRecords.push(fileRecord);

		await em.persistAndFlush([user, ...fileRecords, school]);
		em.clear();
		currentUser = mapUserToCurrentUser(user);
	});

	describe('with bad request data', () => {
		it('should return status 400 for invalid fileRecordId', async () => {
			const response = await api.patch(`invalid_id`, { fileName: 'test_new_name.txt' });
			expect(response.error.validationErrors).toEqual([
				{
					errors: ['fileRecordId must be a mongodb id'],
					field: ['fileRecordId'],
				},
			]);
			expect(response.status).toEqual(400);
		});

		it('should return status 400 for empty filename', async () => {
			const response = await api.patch(`${fileRecord.id}`, { fileName: undefined });
			expect(response.error.validationErrors).toEqual([
				{
					errors: ['fileName should not be empty', 'fileName must be a string'],
					field: ['fileName'],
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
