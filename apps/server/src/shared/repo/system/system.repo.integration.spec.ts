import { NotFoundError } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { OauthConfig, System } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { SystemRepo } from './system.repo';

describe('system repo', () => {
	let module: TestingModule;
	let repo: SystemRepo;
	let em: EntityManager;

	const defaultOauthConfig: OauthConfig = {
		client_id: '12345',
		client_secret: 'mocksecret',
		token_endpoint: 'http://mock.de/mock/auth/public/mockToken',
		grant_type: 'authorization_code',
		token_redirect_uri: 'http://mockhost:3030/api/v3/oauth/testsystemId/token',
		scope: 'openid uuid',
		response_type: 'code',
		auth_endpoint: 'mock_auth_endpoint',
		auth_redirect_uri: '',
	};
	const defaultSystem: System = {
		type: 'iserv',
		oauthconfig: defaultOauthConfig,
		id: '222',
		_id: new ObjectId(),
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [SystemRepo],
		}).compile();
		repo = module.get(SystemRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(repo).toBeDefined();
		expect(typeof repo.findById).toEqual('function');
	});

	describe('findById', () => {
		afterEach(async () => {
			await em.nativeDelete(System, {});
		});

		// it('should return right keys', async () => {
		// 	await em.persistAndFlush([defaultSystem]);
		// 	const result = await repo.findById(defaultSystem.id);
		// 	expect(Object.keys(result).sort()).toEqual(
		// 		['createdAt', 'updatedAt', 'type', 'url', 'alias', 'oauthconfig', '_id'].sort()
		// 	);
		// });

		// it('should return a System that matched by id', async () => {
		// 	await em.persistAndFlush([defaultSystem]);
		// 	const result = await repo.findById(defaultSystem.id);
		// 	expect(result).toEqual(defaultSystem);
		// });

		it('should throw an error if System by id doesnt exist', async () => {
			const idA = new ObjectId().toHexString();

			await expect(repo.findById(idA)).rejects.toThrow(NotFoundError);
		});

		// it() -> design test that does something with a Systementity, so that we know, that System has been loaded correctly

		// it() -> should throw error if it loaded incorrectly
	});
});
