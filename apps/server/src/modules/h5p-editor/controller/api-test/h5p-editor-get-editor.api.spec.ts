import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import request from 'supertest';
import { EntityManager } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Permission } from '@shared/domain';
import { cleanupCollections, mapUserToCurrentUser, roleFactory, schoolFactory, userFactory } from '@shared/testing';
import { ICurrentUser } from '@src/modules/authentication';
import { Request } from 'express';
import { DeepMocked, createMock } from '@golevelup/ts-jest/lib/mocks';
import { S3ClientAdapter } from '@src/modules/files-storage/client/s3-client.adapter';
import { H5PEditorTestModule } from '../../h5p-editor-test.module';
import { H5PEditorUc } from '../../uc/h5p.uc';

class API {
	constructor(private app: INestApplication) {
		this.app = app;
	}

	async editH5pContent(contentId: string) {
		return request(this.app.getHttpServer()).get(`/h5p-editor/edit/${contentId}`);
	}
}

const setup = () => {
	const contentId = '64c3ac73abadca6138edee47';
	const notExistingContentId = '04c3ac73abadca6138edee47';
	const badContentId = '';

	return { contentId, notExistingContentId, badContentId };
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
			.overrideProvider(S3ClientAdapter)
			.useValue(createMock<S3ClientAdapter>())
			.overrideProvider(H5PEditorUc)
			.useValue(createMock<H5PEditorUc>())
			.compile();

		app = module.createNestApplication();
		await app.init();
		h5PEditorUc = module.get(H5PEditorUc);

		api = new API(app);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('get h5p editor', () => {
		beforeEach(async () => {
			await cleanupCollections(em);
			const school = schoolFactory.build();
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
				const { contentId } = setup();
				h5PEditorUc.getH5pEditor.mockResolvedValueOnce('iFrame');
				const response = await api.editH5pContent(contentId);
				expect(response.status).toEqual(200);
			});
		});
		describe('with bad request params', () => {
			it('should return 500 status', async () => {
				const { notExistingContentId } = setup();
				h5PEditorUc.getH5pEditor.mockRejectedValueOnce(new Error('Could not get H5P editor'));
				const response = await api.editH5pContent(notExistingContentId);
				expect(response.status).toEqual(500);
			});
		});
	});
});
