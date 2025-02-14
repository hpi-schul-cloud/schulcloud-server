import { EntityManager } from '@mikro-orm/mongodb';
import { schoolYearEntityFactory } from '@modules/school/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { SCHOOL_YEAR_REPO } from '../../domain';
import { SchoolYearEntityMapper } from './mapper';
import { SchoolYearEntity } from './school-year.entity';
import { SchoolYearMikroOrmRepo } from './school-year.repo';

describe('SchoolYearMikroOrmRepo', () => {
	let module: TestingModule;
	let repo: SchoolYearMikroOrmRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [SchoolYearEntity] })],
			providers: [{ provide: SCHOOL_YEAR_REPO, useClass: SchoolYearMikroOrmRepo }],
		}).compile();

		repo = module.get(SCHOOL_YEAR_REPO);
		em = module.get(EntityManager);
	});

	afterEach(async () => {
		await cleanupCollections(em);
		await em.nativeDelete(SchoolYearEntity, {});
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getAllSchoolYears', () => {
		const setup = async () => {
			const entities = schoolYearEntityFactory.buildList(3);
			await em.persistAndFlush(entities);
			em.clear();
			const schools = entities.map((entity) => SchoolYearEntityMapper.mapToDo(entity));

			return { schools };
		};

		it('should return all school years', async () => {
			const { schools } = await setup();

			const result = await repo.getAllSchoolYears();

			expect(result).toEqual(schools);
		});
	});
});
