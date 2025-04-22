import { EntityData } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { courseSynchronizationHistoryEntityFactory, courseSynchronizationHistoryFactory } from '../../testing';
import { CourseSynchronizationHistory, CourseSynchronizationHistoryProps } from '../../domain';
import { CourseSynchronizationHistoryEntity } from '../entity';
import { CourseSynchronizationHistoryMapper } from './course-synchronization-history.mapper';

describe(CourseSynchronizationHistoryMapper.name, () => {
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [CourseSynchronizationHistoryEntity] })],
		}).compile();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('mapEntityToDO', () => {
		it('should return the correct domain object', () => {
			const entity: CourseSynchronizationHistoryEntity = courseSynchronizationHistoryEntityFactory.build();

			const result = CourseSynchronizationHistoryMapper.mapEntityToDO(entity);

			expect(result.getProps()).toEqual<CourseSynchronizationHistoryProps>({
				id: entity.id,
				externalGroupId: entity.externalGroupId,
				synchronizedCourse: entity.synchronizedCourse.toHexString(),
				expiresAt: entity.expiresAt,
				excludeFromSync: entity.excludeFromSync,
			});
		});
	});

	describe('mapDOToEntityProperties', () => {
		it('should return the correct entity properties', () => {
			const domainObject: CourseSynchronizationHistory = courseSynchronizationHistoryFactory.build();

			const result = CourseSynchronizationHistoryMapper.mapDOToEntityProperties(domainObject);

			expect(result).toEqual<EntityData<CourseSynchronizationHistoryEntity>>({
				externalGroupId: domainObject.externalGroupId,
				synchronizedCourse: new ObjectId(domainObject.synchronizedCourse),
				expiresAt: domainObject.expiresAt,
				excludeFromSync: domainObject.excludeFromSync,
			});
		});
	});
});
