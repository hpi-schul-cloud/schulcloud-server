import { createMock } from '@golevelup/ts-jest';
import { AuthorizationClientAdapter } from '@infra/authorization-client';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common/error';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import NodeClam from 'clamscan';
import { FileRecordParentType } from '../../../domain';
import { FilesStorageTestModule } from '../../../files-storage-test.module';
import { fileRecordEntityFactory } from '../../../testing';
import { FileRecordResponse } from '../../dto';

const baseRouteName = '/file/rename';

describe(`${baseRouteName} (api)`, () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [FilesStorageTestModule],
		})
			.overrideProvider(NodeClam)
			.useValue(createMock<NodeClam>())
			.overrideProvider(AuthorizationClientAdapter)
			.useValue(createMock<AuthorizationClientAdapter>())
			.compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		testApiClient = new TestApiClient(app, baseRouteName);
	});

	afterAll(async () => {
		await app.close();
	});

	const setup = async () => {
		const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

		const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser);

		const validId = new ObjectId().toHexString();

		const fileParams = {
			schoolId: validId,
			parentId: validId,
			parentType: FileRecordParentType.School,
		};
		const fileRecords = fileRecordEntityFactory.buildList(3, fileParams);
		const fileRecord = fileRecordEntityFactory.build({
			...fileParams,
			name: 'test.txt',
			creatorId: studentUser.id,
		});
		fileRecords.push(fileRecord);

		await em.persistAndFlush(fileRecords);
		em.clear();

		return { user: studentUser, fileRecord, loggedInClient };
	};

	describe('with not authenticated user', () => {
		it('should return status 401', async () => {
			const loggedInClient = new TestApiClient(app, baseRouteName);

			const result = await loggedInClient.patch(`invalid_id`, { fileName: 'test_new_name.txt' });

			expect(result.status).toEqual(401);
		});
	});

	describe('with bad request data', () => {
		it('should return status 400 for invalid fileRecordId', async () => {
			const { loggedInClient } = await setup();

			const result = await loggedInClient.patch(`invalid_id`, { fileName: 'test_new_name.txt' });
			const { validationErrors } = result.body as ApiValidationError;

			expect(validationErrors).toEqual([
				{
					errors: ['fileRecordId must be a mongodb id'],
					field: ['fileRecordId'],
				},
			]);
			expect(result.status).toEqual(400);
		});

		it('should return status 400 for empty filename', async () => {
			const { loggedInClient, fileRecord } = await setup();

			const result = await loggedInClient.patch(`${fileRecord.id}`, { fileName: undefined });
			const { validationErrors } = result.body as ApiValidationError;

			expect(validationErrors).toEqual([
				{
					errors: ['fileName should not be empty', 'fileName must be a string'],
					field: ['fileName'],
				},
			]);
			expect(result.status).toEqual(400);
		});

		it('should return status 409 if filename exists', async () => {
			const { loggedInClient, fileRecord } = await setup();

			const result = await loggedInClient.patch(`${fileRecord.id}`, { fileName: 'test.txt' });

			expect(result.body).toEqual({ code: 409, message: 'FILE_NAME_EXISTS', title: 'Conflict', type: 'CONFLICT' });
			expect(result.status).toEqual(409);
		});
	});

	describe(`with valid request data`, () => {
		it('should return status 200 for successful request', async () => {
			const { loggedInClient, fileRecord } = await setup();

			const result = await loggedInClient.patch(`${fileRecord.id}`, { fileName: 'test_1.txt' });
			const response = result.body as FileRecordResponse;

			expect(response.name).toEqual('test_1.txt');
			expect(result.status).toEqual(200);
		});
	});
});
