import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TestApiClient, UserAndAccountTestFactory, cleanupCollections, schoolEntityFactory } from '@shared/testing';
import { ServerTestModule } from '@src/modules/server';

describe('School Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'school');
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('PATCH /:id', () => {
		describe('when user is an admin', () => {
			const setup = async () => {
				const school = schoolEntityFactory.build();
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

				await em.persistAndFlush([adminAccount, adminUser, school]);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return { loggedInClient, school };
			};

			it('should update school', async () => {
				const { loggedInClient, school } = await setup();

				const response = await loggedInClient.patch(school.id).send({
					name: 'new name',
				});

				expect(response.status).toEqual(HttpStatus.OK);
				expect(response.body).toContain({
					id: school.id,
					name: 'new name',
				});
			});

			it('should return 404 if school does not exist', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.patch(new ObjectId().toHexString()).send({
					name: 'new name',
				});

				expect(response.status).toEqual(HttpStatus.NOT_FOUND);
			});
		});
	});
});
