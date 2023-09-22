import { NotFoundError } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolEntity } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections, schoolFactory } from '@shared/testing';
import { SCHOOL_REPO } from '../domain';
import { SchoolMapper } from './mapper';
import { SchoolMikroOrmRepo } from './school.repo';

describe('SchoolMikroOrmRepo', () => {
	let module: TestingModule;
	let repo: SchoolMikroOrmRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [{ provide: SCHOOL_REPO, useClass: SchoolMikroOrmRepo }],
		}).compile();

		repo = module.get(SCHOOL_REPO);
		em = module.get(EntityManager);
	});

	afterEach(async () => {
		await cleanupCollections(em);
		await em.nativeDelete(SchoolEntity, {});
	});

	afterAll(async () => {
		await module.close();
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(SchoolEntity);
	});

	describe('getAllSchools', () => {});

	describe('getSchool', () => {
		it('should throw NotFound if entity is not found', async () => {
			const someId = new ObjectId().toString();

			await expect(() => repo.getSchool(someId)).rejects.toThrow(NotFoundError);
		});

		it('should return school', async () => {
			const entity = schoolFactory.build();
			await em.persistAndFlush([entity]);
			const school = SchoolMapper.mapToDo(entity);

			const result = await repo.getSchool(entity.id);

			expect(result).toEqual(school);
		});
	});
});
