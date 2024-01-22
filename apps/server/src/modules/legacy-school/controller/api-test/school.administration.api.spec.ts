import { EntityManager } from '@mikro-orm/mongodb';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { TestXApiKeyClient } from '@shared/testing';
import { XApiKeyStrategy } from '@src/modules/authentication/strategy/x-api-key.strategy';
import { ServerTestModule } from '@src/modules/server';

const baseRouteName = '/admin/schools';

describe('Admin API - Schools (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testXApiKeyClient: TestXApiKeyClient;
	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		})
			.overrideGuard(AuthGuard('api-key'))
			.useValue(
				new XApiKeyStrategy(
					new ConfigService(() => {
						return {
							ADMIN_API__ALLOWED_API_KEYS: ['dsfsdfl5sdhflkjsdfsdfs'],
						};
					})
				)
			)
			.compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		testXApiKeyClient = new TestXApiKeyClient(app, baseRouteName, 'dsfsdfl5sdhflkjsdfsdfs');
	});

	afterAll(async () => {
		await app.close();
	});

	describe('create a school', () => {
		describe('without token', () => {
			it.todo('should refuse');
		});

		describe('with api token', () => {
			it('should return school', async () => {
				const response = await testXApiKeyClient
					.post('')
					// .set('authorization', this.formattedJwt)
					.send({});
				expect(response.status).toEqual(204);
			});

			it.todo('should have persisted the school');
		});
	});
});
