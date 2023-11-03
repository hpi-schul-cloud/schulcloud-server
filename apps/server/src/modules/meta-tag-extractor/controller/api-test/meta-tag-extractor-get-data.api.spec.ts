import { EntityManager } from '@mikro-orm/mongodb';
import { ICurrentUser } from '@modules/authentication';
import { JwtAuthGuard } from '@modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@modules/server/server.module';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { cleanupCollections, courseFactory, mapUserToCurrentUser, userFactory } from '@shared/testing';
import { Request } from 'express';
import request from 'supertest';
import { MetaTagExtractorService } from '../../service';
import { MetaTagExtractorResponse } from '../dto';

const baseRouteName = '/meta-tag-extractor';

class API {
	app: INestApplication;

	constructor(app: INestApplication) {
		this.app = app;
	}

	async post(columnId: string, requestBody?: object) {
		const response = await request(this.app.getHttpServer())
			.post(`${baseRouteName}/${columnId}/cards`)
			.set('Accept', 'application/json')
			.send(requestBody);

		return {
			result: response.body as MetaTagExtractorResponse,
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}
}

describe(`get data (api)`, () => {
	let app: INestApplication;
	let em: EntityManager;
	let currentUser: ICurrentUser;
	let api: API;
	// const metaTagExtractorServiceMock = createMock<MetaTagExtractorService>();

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({
				canActivate(context: ExecutionContext) {
					const req: Request = context.switchToHttp().getRequest();
					req.user = currentUser;
					return true;
				},
			})
			.overrideProvider(MetaTagExtractorService)
			.useValue({
				fetchMetaData: () => {
					return { url: 'https://test.de', title: '', description: '' };
				},
			})
			.compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		api = new API(app);
	});

	afterAll(async () => {
		await app.close();
	});

	const setup = async () => {
		await cleanupCollections(em);
		const user = userFactory.build();
		const course = courseFactory.build({ teachers: [user] });
		await em.persistAndFlush([user, course]);

		em.clear();

		return { user };
	};

	// const URL = 'https://www.myexample.com/mocked-article-url';
	const URL = 'https://default-bc-5434-meta-data-endpoint.cd.dbildungscloud.dev/rooms-overview/';

	describe('with valid user', () => {
		it('should return status 201', async () => {
			const { user } = await setup();
			currentUser = mapUserToCurrentUser(user);

			// metaTagExtractorServiceMock.fetchMetaData.mockResolvedValueOnce({ url: URL, title: '', description: '' });

			const response = await api.post(URL);

			expect(response.status).toEqual(201);
		});

		it('should return the meta tags of the external page', async () => {
			const { user } = await setup();
			currentUser = mapUserToCurrentUser(user);

			const { result } = await api.post(URL);
			console.log(result);
			expect(result.title).toBeDefined();
		});
	});

	describe('with invalid user', () => {
		it.skip('should return status 404', async () => {});
	});
});
