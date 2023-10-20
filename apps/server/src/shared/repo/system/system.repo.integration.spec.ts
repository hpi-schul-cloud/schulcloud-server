import { NotFoundError } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { System, SystemTypeEnum } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { SystemRepo } from '@shared/repo';
import { systemFactory } from '@shared/testing/factory/system.factory';

describe('system repo', () => {
	let module: TestingModule;
	let repo: SystemRepo;
	let em: EntityManager;

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

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(System);
	});

	describe('findById', () => {
		afterEach(async () => {
			await em.nativeDelete(System, {});
		});

		it('should return right keys', async () => {
			const system = systemFactory.build();
			await em.persistAndFlush([system]);
			const result = await repo.findById(system.id);
			expect(Object.keys(result).sort()).toEqual(
				[
					'createdAt',
					'updatedAt',
					'type',
					'url',
					'alias',
					'displayName',
					'oauthConfig',
					'oidcConfig',
					'ldapConfig',
					'_id',
					'provisioningStrategy',
					'provisioningUrl',
				].sort()
			);
		});

		it('should return a System that matched by id', async () => {
			const system = systemFactory.build();
			await em.persistAndFlush([system]);
			const result = await repo.findById(system.id);
			expect(result).toEqual(system);
		});

		it('should throw an error if System by id doesnt exist', async () => {
			const idA = new ObjectId().toHexString();

			await expect(repo.findById(idA)).rejects.toThrow(NotFoundError);
		});
	});

	describe('findAll', () => {
		afterEach(async () => {
			await em.nativeDelete(System, {});
		});

		it('should return all systems', async () => {
			const systems = [systemFactory.build(), systemFactory.build({ oauthConfig: undefined })];
			await em.persistAndFlush(systems);

			const result = await repo.findAll();

			expect(result.length).toEqual(systems.length);
			expect(result).toEqual(systems);
		});
	});

	describe('findByFilter', () => {
		const ldapSystems = systemFactory.withLdapConfig().buildListWithId(2);
		const oauthSystems = systemFactory.withOauthConfig().buildListWithId(2);
		const oidcSystems = systemFactory.withOidcConfig().buildListWithId(2);

		beforeAll(async () => {
			await em.persistAndFlush([...ldapSystems, ...oauthSystems, ...oidcSystems]);
		});

		afterAll(async () => {
			await em.nativeDelete(System, {});
		});

		describe('when searching for a system type', () => {
			it('should return ldap systems', async () => {
				const result = await repo.findByFilter(SystemTypeEnum.LDAP);
				expect(result).toStrictEqual(ldapSystems);
			});

			it('should return oauth systems', async () => {
				const result = await repo.findByFilter(SystemTypeEnum.OAUTH);
				expect(result).toStrictEqual(oauthSystems);
			});

			it('should return oidc systems', async () => {
				const result = await repo.findByFilter(SystemTypeEnum.OIDC);
				expect(result).toStrictEqual(oidcSystems);
			});
		});

		describe('when system type is unknown', () => {
			it('should throw', async () => {
				await expect(repo.findByFilter('keycloak' as unknown as SystemTypeEnum)).rejects.toThrow(
					'system type keycloak unknown'
				);
			});
		});
	});
});
