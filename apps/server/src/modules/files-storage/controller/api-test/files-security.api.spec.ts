import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/mongodb';
import { ICurrentUser } from '@modules/authentication';
import { JwtAuthGuard } from '@modules/authentication/guard/jwt-auth.guard';
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
import NodeClam from 'clamscan';
import { Request } from 'express';
import request from 'supertest';
import { FileRecord } from '../../entity';
import { FilesStorageTestModule } from '../../files-storage-test.module';
import { FileRecordParentType, StorageLocation } from '../../interface';
import { FileRecordListResponse, ScanResultParams } from '../dto';

const baseRouteName = '/file-security';
const scanResult: ScanResultParams = { virus_detected: false };

class API {
	app: INestApplication;

	constructor(app: INestApplication) {
		this.app = app;
	}

	async put(requestString: string, body: ScanResultParams) {
		const response = await request(this.app.getHttpServer())
			.put(`${baseRouteName}${requestString}`)
			.set('Accept', 'application/json')
			.send(body);

		return {
			result: response.body as FileRecordListResponse,
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
	let validId: string;

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
		em.clear();

		currentUser = mapUserToCurrentUser(user);
		validId = user.school.id;
	});

	describe('with bad request data', () => {
		it('should return status 400 for invalid token', async () => {
			const fileRecord = fileRecordFactory.build({
				storageLocation: StorageLocation.SCHOOL,
				storageLocationId: validId,
				parentId: validId,
				parentType: FileRecordParentType.School,
			});
			await em.persistAndFlush(fileRecord);
			em.clear();

			const response = await api.put(`/update-status/wrong-token`, scanResult);

			expect(response.status).toEqual(404);
		});
	});

	describe(`with valid request data`, () => {
		it('should return right type of data', async () => {
			const fileRecord = fileRecordFactory.build({
				storageLocation: StorageLocation.SCHOOL,
				storageLocationId: validId,
				parentId: validId,
				parentType: FileRecordParentType.School,
			});
			const token = fileRecord.securityCheck.requestToken || '';
			await em.persistAndFlush(fileRecord);
			em.clear();

			const response = await api.put(`/update-status/${token}`, scanResult);
			const changedFileRecord = await em.findOneOrFail(FileRecord, fileRecord.id);

			expect(changedFileRecord.securityCheck.status).toStrictEqual('verified');
			expect(response.status).toEqual(200);
		});
	});
});
