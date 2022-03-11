import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Request } from 'express';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import S3rver from 's3rver';

import { FilesStorageTestModule, config } from '@src/modules/files-storage/files-storage.module';
import { FileRecordListResponse, FileRecordResponse } from '@src/modules/files-storage/controller/dto';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { EntityId, FileRecordParentType, ICurrentUser } from '@shared/domain';
import {
	userFactory,
	roleFactory,
	cleanupCollections,
	mapUserToCurrentUser,
	fileRecordFactory,
	schoolFactory,
} from '@shared/testing';
import { ApiValidationError } from '@shared/common';

const baseRouteName = '/file/delete';

class API {
	app: INestApplication;

	constructor(app: INestApplication) {
		this.app = app;
	}

	async deleteFile(requestString: string, query?: string | Record<string, unknown>) {
		const response = await request(this.app.getHttpServer())
			.delete(`${baseRouteName}${requestString}`)
			.set('Accept', 'application/json')
			.query(query || {});

		return {
			result: response.body as FileRecordResponse,
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}

	async delete(requestString: string, query?: string | Record<string, unknown>) {
		const response = await request(this.app.getHttpServer())
			.delete(`${baseRouteName}${requestString}`)
			.set('Accept', 'application/json')
			.query(query || {});

		return {
			result: response.body as FileRecordListResponse,
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}
}

const createRndInt = (max) => Math.floor(Math.random() * max);

describe(`${baseRouteName} (api)`, () => {
	let app: INestApplication;
	let orm: MikroORM;
	let em: EntityManager;
	let currentUser: ICurrentUser;
	let api: API;
	let s3instance: S3rver;

	beforeAll(async () => {
		const port = 10000 + createRndInt(10000);
		const overridetS3Config = Object.assign(config, { endpoint: `http://localhost:${port}` });

		s3instance = new S3rver({
			directory: `/tmp/s3rver_test_directory`,
			resetOnClose: true,
			port,
		});
		await s3instance.run();
		const module: TestingModule = await Test.createTestingModule({
			imports: [FilesStorageTestModule],
			providers: [
				FilesStorageTestModule,
				{
					provide: 'S3_Config',
					useValue: overridetS3Config,
				},
			],
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
		await s3instance.close();
	});

	describe('delete files of parent', () => {
		describe('with bad request data', () => {
			let validId: string;

			beforeEach(async () => {
				await cleanupCollections(em);
				const roles = roleFactory.buildList(1, { permissions: [] });
				const school = schoolFactory.build();
				const user = userFactory.build({ roles, school });

				await em.persistAndFlush([user]);
				em.clear();

				currentUser = mapUserToCurrentUser(user);
				validId = user.school.id;
			});

			it('should return status 400 for invalid schoolId', async () => {
				const response = await api.delete(`/123/users/${validId}`);
				expect(response.error.validationErrors).toEqual([
					{
						errors: ['schoolId must be a mongodb id'],
						field: 'schoolId',
					},
				]);
				expect(response.status).toEqual(400);
			});

			it('should return status 400 for invalid parentId', async () => {
				const response = await api.delete(`/${validId}/users/123`);
				expect(response.error.validationErrors).toEqual([
					{
						errors: ['parentId must be a mongodb id'],
						field: 'parentId',
					},
				]);
				expect(response.status).toEqual(400);
			});

			it('should return status 400 for invalid parentType', async () => {
				const response = await api.delete(`/${validId}/cookies/${validId}`);
				expect(response.error.validationErrors).toEqual([
					{
						errors: ['parentType must be a valid enum value'],
						field: 'parentType',
					},
				]);
				expect(response.status).toEqual(400);
			});
		});

		describe(`with valid request data`, () => {
			let validId: string;

			beforeEach(async () => {
				await cleanupCollections(em);
				const roles = roleFactory.buildList(1, { permissions: [] });
				const school = schoolFactory.build();
				const user = userFactory.build({ roles, school });

				await em.persistAndFlush([user]);
				em.clear();

				currentUser = mapUserToCurrentUser(user);
				validId = user.school.id;
			});

			it('should return status 200 for successful request', async () => {
				const response = await api.delete(`/${validId}/schools/${validId}`);

				expect(response.status).toEqual(200);
			});

			it('should return right type of data', async () => {
				const fileRecords = fileRecordFactory.buildList(1, {
					schoolId: validId,
					parentId: validId,
					parentType: FileRecordParentType.School,
				});

				await em.persistAndFlush(fileRecords);
				em.clear();

				const { result } = await api.delete(`/${validId}/schools/${validId}`);

				expect(Array.isArray(result.data)).toBe(true);
				expect(result.data[0]).toBeDefined();
				expect(result.data[0]).toStrictEqual({
					creatorId: expect.any(String) as string,
					id: expect.any(String) as string,
					name: expect.any(String) as string,
					parentId: expect.any(String) as string,
					parentType: 'schools',
					type: 'application/octet-stream', // fuh why ???
					expires: expect.any(String) as string,
				});
			});

			it('should return elements of requested scope', async () => {
				const fileRecords = fileRecordFactory.buildList(3, {
					schoolId: validId,
					parentId: validId,
					parentType: FileRecordParentType.School,
				});
				const otherFileRecords = fileRecordFactory.buildList(3, {
					schoolId: validId,
					parentType: FileRecordParentType.School,
				});

				await em.persistAndFlush([...otherFileRecords, ...fileRecords]);
				em.clear();

				const { result } = await api.delete(`/${validId}/schools/${validId}`);

				const resultData: FileRecordResponse[] = result.data;
				const ids: EntityId[] = resultData.map((o) => o.id);

				expect(result.total).toEqual(3);
				expect(ids.sort()).toEqual([fileRecords[0].id, fileRecords[1].id, fileRecords[2].id].sort());
			});
		});

		describe('with querys', () => {
			let validId: EntityId;

			beforeEach(async () => {
				await cleanupCollections(em);
				const roles = roleFactory.buildList(1, { permissions: [] });
				const school = schoolFactory.build();
				const user = userFactory.build({ roles, school });

				await em.persistAndFlush([user]);
				em.clear();

				currentUser = mapUserToCurrentUser(user);
				validId = user.school.id;

				const fileRecords = fileRecordFactory.buildList(1, {
					schoolId: validId,
					parentId: validId,
					parentType: FileRecordParentType.School,
				});

				await em.persistAndFlush(fileRecords);
				em.clear();
			});

			it('should modified the expires date over daysUntilExpiration query', async () => {
				const { result } = await api.delete(`/${validId}/schools/${validId}`, { daysUntilExpiration: 14 });
				const day = new Date(result.data[0]?.expires || '').getDate();
				const dayNow = new Date().getDate();

				expect(dayNow + 14).toEqual(day);
			});

			it('should throw an error if daysUntilExpiration query value is less then 1 (day)', async () => {
				const response = await api.delete(`/${validId}/schools/${validId}`, { daysUntilExpiration: 0 });

				expect(response.error.validationErrors).toEqual([
					{
						errors: ['daysUntilExpiration must not be less than 1'],
						field: 'daysUntilExpiration',
					},
				]);
				expect(response.status).toEqual(400);
			});

			it('should throw an error if daysUntilExpiration query value is greater then 30 (days)', async () => {
				const response = await api.delete(`/${validId}/schools/${validId}`, { daysUntilExpiration: 31 });

				expect(response.error.validationErrors).toEqual([
					{
						errors: ['daysUntilExpiration must not be greater than 30'],
						field: 'daysUntilExpiration',
					},
				]);
				expect(response.status).toEqual(400);
			});
		});
	});

	describe('delete single file', () => {
		describe('with bad request data', () => {
			beforeEach(async () => {
				await cleanupCollections(em);
				const roles = roleFactory.buildList(1, { permissions: [] });
				const school = schoolFactory.build();
				const user = userFactory.build({ roles, school });

				await em.persistAndFlush([user]);
				em.clear();
			});

			it('should return status 400 for invalid fileRecordId', async () => {
				const response = await api.deleteFile(`/123`);
				expect(response.error.validationErrors).toEqual([
					{
						errors: ['fileRecordId must be a mongodb id'],
						field: 'fileRecordId',
					},
				]);
				expect(response.status).toEqual(400);
			});
		});

		describe(`with valid request data`, () => {
			let fileRecordId: string;

			beforeEach(async () => {
				await cleanupCollections(em);
				const roles = roleFactory.buildList(1, { permissions: [] });
				const school = schoolFactory.build();
				const user = userFactory.build({ roles, school });

				await em.persistAndFlush([user]);
				em.clear();

				currentUser = mapUserToCurrentUser(user);

				const fileRecord = fileRecordFactory.build({
					schoolId: user.school.id,
					parentId: user.school.id,
					parentType: FileRecordParentType.School,
				});

				await em.persistAndFlush([fileRecord]);
				em.clear();

				fileRecordId = fileRecord.id;
			});

			it('should return status 200 for successful request', async () => {
				const response = await api.deleteFile(`/${fileRecordId}`);

				expect(response.status).toEqual(200);
			});

			it('should return right type of data', async () => {
				const { result } = await api.deleteFile(`/${fileRecordId}`);

				expect(result).toStrictEqual({
					creatorId: expect.any(String) as string,
					id: expect.any(String) as string,
					name: expect.any(String) as string,
					parentId: expect.any(String) as string,
					parentType: 'schools',
					type: 'application/octet-stream',
					expires: expect.any(String) as string,
				});
			});

			it('should return elements of requested scope', async () => {
				const otherFileRecords = fileRecordFactory.buildList(3, {
					schoolId: new ObjectId().toHexString(),
					parentType: FileRecordParentType.School,
				});

				await em.persistAndFlush(otherFileRecords);
				em.clear();

				const { result } = await api.deleteFile(`/${fileRecordId}`);

				expect(result.id).toEqual(fileRecordId);
			});
		});

		describe('with querys', () => {
			let fileRecordId: EntityId;

			beforeEach(async () => {
				await cleanupCollections(em);
				const roles = roleFactory.buildList(1, { permissions: [] });
				const school = schoolFactory.build();
				const user = userFactory.build({ roles, school });

				await em.persistAndFlush([user]);
				em.clear();

				currentUser = mapUserToCurrentUser(user);

				const fileRecord = fileRecordFactory.build({
					schoolId: user.school.id,
					parentId: user.school.id,
					parentType: FileRecordParentType.School,
				});

				await em.persistAndFlush([fileRecord]);
				em.clear();

				fileRecordId = fileRecord.id;
			});

			it('should modified the expires date over daysUntilExpiration query', async () => {
				const { result } = await api.deleteFile(`/${fileRecordId}`, { daysUntilExpiration: 14 });
				const day = new Date(result?.expires || '').getDate();
				const dayNow = new Date().getDate();

				expect(dayNow + 14).toEqual(day);
			});

			it('should throw an error if daysUntilExpiration query value is less then 1 (day)', async () => {
				const response = await api.deleteFile(`/${fileRecordId}`, { daysUntilExpiration: 0 });

				expect(response.error.validationErrors).toEqual([
					{
						errors: ['daysUntilExpiration must not be less than 1'],
						field: 'daysUntilExpiration',
					},
				]);
				expect(response.status).toEqual(400);
			});

			it('should throw an error if daysUntilExpiration query value is greater then 30 (days)', async () => {
				const response = await api.deleteFile(`/${fileRecordId}`, { daysUntilExpiration: 31 });

				expect(response.error.validationErrors).toEqual([
					{
						errors: ['daysUntilExpiration must not be greater than 30'],
						field: 'daysUntilExpiration',
					},
				]);
				expect(response.status).toEqual(400);
			});
		});
	});
});
