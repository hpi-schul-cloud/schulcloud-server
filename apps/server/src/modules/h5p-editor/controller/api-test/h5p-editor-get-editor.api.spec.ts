import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import request from 'supertest';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
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

	async emptyEditor() {
		return request(this.app.getHttpServer()).get(`/h5p-editor/edit`);
	}

	async editH5pContent(contentId: string) {
		return request(this.app.getHttpServer()).get(`/h5p-editor/edit/${contentId}`);
	}
}

const setup = () => {
	const contentId = new ObjectId(0).toString();
	const notExistingContentId = new ObjectId(1).toString();
	const badContentId = '';

	const editorModel = {
		scripts: ['example.js'],
		styles: ['example.css'],
	};

	const exampleContent = {
		h5p: {},
		library: 'ExampleLib-1.0',
		params: {
			metadata: {},
			params: { anything: true },
		},
	};

	return { contentId, notExistingContentId, badContentId, editorModel, exampleContent };
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
			.overrideProvider('S3ClientAdapter_Content')
			.useValue(createMock<S3ClientAdapter>())
			.overrideProvider('S3ClientAdapter_Libraries')
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

	describe('get new h5p editor', () => {
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
				const { editorModel } = setup();
				// @ts-expect-error partial object
				h5PEditorUc.getEmptyH5pEditor.mockResolvedValueOnce(editorModel);
				const response = await api.emptyEditor();
				expect(response.status).toEqual(200);
			});
		});
		describe('with bad request params', () => {
			it('should return 500 status', async () => {
				h5PEditorUc.getEmptyH5pEditor.mockRejectedValueOnce(new Error('Could not get H5P editor'));
				const response = await api.emptyEditor();
				expect(response.status).toEqual(500);
			});
		});
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
				const { contentId, editorModel, exampleContent } = setup();
				// @ts-expect-error partial object
				h5PEditorUc.getH5pEditor.mockResolvedValueOnce({ editorModel, content: exampleContent });
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
