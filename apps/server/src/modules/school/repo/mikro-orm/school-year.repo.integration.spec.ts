import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolYearEntity } from '@shared/domain/entity/schoolyear.entity';
import { cleanupCollections, schoolYearFactory } from '@shared/testing';
import { MongoMemoryDatabaseModule } from '@src/infra/database';
import { SCHOOL_YEAR_REPO } from '../../domain';
import { SchoolYearEntityMapper } from './mapper';
import { SchoolYearMikroOrmRepo } from './school-year.repo';

describe('SchoolYearMikroOrmRepo', () => {
	let module: TestingModule;
	let repo: SchoolYearMikroOrmRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
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
			const entities = schoolYearFactory.buildList(3);
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
