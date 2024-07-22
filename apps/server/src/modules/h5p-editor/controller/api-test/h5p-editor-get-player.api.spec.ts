import { createMock, DeepMocked } from '@golevelup/ts-jest/lib/mocks';
import { S3ClientAdapter } from '@infra/s3-client';
import { IPlayerModel } from '@lumieducation/h5p-server';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import {
	cleanupCollections,
	mapUserToCurrentUser,
	roleFactory,
	schoolEntityFactory,
	userFactory,
} from '@shared/testing';
import { ICurrentUser } from '@src/modules/authentication';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { Request } from 'express';
import request from 'supertest';
import { H5PEditorTestModule } from '../../h5p-editor-test.module';
import { H5P_CONTENT_S3_CONNECTION, H5P_LIBRARIES_S3_CONNECTION } from '../../h5p-editor.config';
import { H5PEditorUc } from '../../uc/h5p.uc';

class API {
	constructor(private app: INestApplication) {
		this.app = app;
	}

	async getPlayer(contentId: string) {
		return request(this.app.getHttpServer()).get(`/h5p-editor/play/${contentId}`);
	}
}

const setup = () => {
	const contentId = new ObjectId(0).toString();
	const notExistingContentId = new ObjectId(1).toString();

	// @ts-expect-error partial object
	const playerResult: IPlayerModel = {
		contentId,
		dependencies: [],
		downloadPath: '',
		embedTypes: ['iframe'],
		scripts: ['example.js'],
		styles: ['example.css'],
	};

	return { contentId, notExistingContentId, playerResult };
};

describe('H5PEditor Controller (api)', () => {
	let app: INestApplication;
	let api: API;
	let em: EntityManager;
	let currentUser: ICurrentUser;
	let h5PEditorUc: DeepMocked<H5PEditorUc>;

	beforeAll(async () => {
		const module = await Test.createTestingModule({
			imports: [H5PEditorTestModule],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({
				canActivate(context: ExecutionContext) {
					const req: Request = context.switchToHttp().getRequest();
					req.user = currentUser;
					return true;
				},
			})
			.overrideProvider(H5P_CONTENT_S3_CONNECTION)
			.useValue(createMock<S3ClientAdapter>())
			.overrideProvider(H5P_LIBRARIES_S3_CONNECTION)
			.useValue(createMock<S3ClientAdapter>())
			.overrideProvider(H5PEditorUc)
			.useValue(createMock<H5PEditorUc>())
			.compile();

		app = module.createNestApplication();
		h5PEditorUc = module.get(H5PEditorUc);
		await app.init();

		api = new API(app);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('get h5p player', () => {
		beforeEach(async () => {
			await cleanupCollections(em);
			const school = schoolEntityFactory.build();
			const roles = roleFactory.buildList(1, {
				permissions: [Permission.FILESTORAGE_CREATE, Permission.FILESTORAGE_VIEW],
			});
			const user = userFactory.build({ school, roles });

			await em.persistAndFlush([user, school]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);
		});
		describe('with valid request params', () => {
			it('should return 200 status', async () => {
				const { contentId, playerResult } = setup();
				h5PEditorUc.getH5pPlayer.mockResolvedValueOnce(playerResult);
				const response = await api.getPlayer(contentId);
				expect(response.status).toEqual(200);
			});
		});
		describe('with bad request params', () => {
			it('should return 500 status', async () => {
				const { notExistingContentId } = setup();
				h5PEditorUc.getH5pPlayer.mockRejectedValueOnce(new Error('Could not get H5P player'));
				const response = await api.getPlayer(notExistingContentId);
				expect(response.status).toEqual(500);
			});
		});
	});
});
