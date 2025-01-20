import { createMock } from '@golevelup/ts-jest';
import { AuthorizationClientAdapter } from '@infra/authorization-client';
import { EntityManager } from '@mikro-orm/mongodb';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { cleanupCollections } from '@testing/cleanup-collections';
import { fileRecordFactory } from '@testing/factory/filerecord.factory';
import { JwtAuthenticationFactory } from '@testing/factory/jwt-authentication.factory';
import { schoolEntityFactory } from '@testing/factory/school-entity.factory';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import NodeClam from 'clamscan';
import { FilesStorageTestModule } from '../../files-storage-test.module';
import { FileRecordParentType } from '../../interface';
import { FileRecordResponse } from '../dto';

const baseRouteName = '/file/rename';

describe(`${baseRouteName} (api)`, () => {
	let app: INestApplication;
	let em: EntityManager;

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
	});

	afterAll(async () => {
		await app.close();
	});

	const setup = async () => {
		await cleanupCollections(em);
		const school = schoolEntityFactory.build();
		const { studentUser: user, studentAccount: account } = UserAndAccountTestFactory.buildStudent({ school });

		await em.persistAndFlush([user, account]);

		const fileParams = {
			schoolId: school.id,
			parentId: school.id,
			parentType: FileRecordParentType.School,
		};
		const fileRecords = fileRecordFactory.buildList(3, fileParams);
		const fileRecord = fileRecordFactory.build({ ...fileParams, name: 'test.txt', creatorId: user.id });
		fileRecords.push(fileRecord);

		await em.persistAndFlush([user, ...fileRecords, school]);
		em.clear();

		const authValue = JwtAuthenticationFactory.createJwt({
			accountId: account.id,
			userId: user.id,
			schoolId: user.school.id,
			roles: [user.roles[0].id],
			support: false,
			isExternalUser: false,
		});
		const apiClient = new TestApiClient(app, baseRouteName, authValue);

		return { user, fileRecord, apiClient };
	};

	describe('with not authenticated user', () => {
		it('should return status 401', async () => {
			const apiClient = new TestApiClient(app, baseRouteName);

			const result = await apiClient.patch(`invalid_id`, { fileName: 'test_new_name.txt' });

			expect(result.status).toEqual(401);
		});
	});

	describe('with bad request data', () => {
		it('should return status 400 for invalid fileRecordId', async () => {
			const { apiClient } = await setup();

			const result = await apiClient.patch(`invalid_id`, { fileName: 'test_new_name.txt' });
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
			const { apiClient, fileRecord } = await setup();

			const result = await apiClient.patch(`${fileRecord.id}`, { fileName: undefined });
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
			const { apiClient, fileRecord } = await setup();

			const result = await apiClient.patch(`${fileRecord.id}`, { fileName: 'test.txt' });

			expect(result.body).toEqual({ code: 409, message: 'FILE_NAME_EXISTS', title: 'Conflict', type: 'CONFLICT' });
			expect(result.status).toEqual(409);
		});
	});

	describe(`with valid request data`, () => {
		it('should return status 200 for successful request', async () => {
			const { apiClient, fileRecord } = await setup();

			const result = await apiClient.patch(`${fileRecord.id}`, { fileName: 'test_1.txt' });
			const response = result.body as FileRecordResponse;

			expect(response.name).toEqual('test_1.txt');
			expect(result.status).toEqual(200);
		});
	});
});
