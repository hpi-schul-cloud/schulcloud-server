import { ObjectId } from '@mikro-orm/mongodb';
import { Class } from '../../domain';
import { ClassSourceOptions } from '../../domain/class-source-options.do';
import { classFactory } from '../../domain/testing/factory/class.factory';
import { ClassEntity } from '../../entity';
import { classEntityFactory } from '../../entity/testing';
import { ClassMapper } from './class.mapper';

describe(ClassMapper.name, () => {
	describe('mapToDOs', () => {
		describe('When empty entities array is mapped for an empty domainObjects array', () => {
			it('should return empty domain objects array for an empty entities array', () => {
				const domainObjects = ClassMapper.mapToDOs([]);

				expect(domainObjects).toEqual([]);
			});
		});

		describe('When entities array is mapped for domainObjects array', () => {
			it('should properly map the entities to the domain objects', () => {
				const entities = [classEntityFactory.build()];

				const domainObjects = ClassMapper.mapToDOs(entities);

				const expectedDomainObjects = entities.map(
					(entity) =>
						new Class({
							id: entity.id,
							name: entity.name,
							schoolId: entity.schoolId.toHexString(),
							invitationLink: entity.invitationLink,
							ldapDN: entity.ldapDN,
							source: entity.source,
							sourceOptions: new ClassSourceOptions({
								tspUid: entity.sourceOptions?.tspUid,
							}),
							userIds: entity.userIds?.map((userId) => userId.toHexString()) || [],
							successor: entity.successor?.toHexString(),
							teacherIds: entity.teacherIds.map((teacherId) => teacherId.toHexString()),
							gradeLevel: entity.gradeLevel,
							year: entity.year?.toHexString(),
							createdAt: entity.createdAt,
							updatedAt: entity.updatedAt,
						})
				);

				expect(domainObjects).toEqual(expectedDomainObjects);
			});
		});
	});

	describe('mapToEntities', () => {
		describe('When empty domainObjects array is mapped for an entities array', () => {
			it('should return empty entities array for an empty domain objects array', () => {
				const entities = ClassMapper.mapToEntities([]);

				expect(entities).toEqual([]);
			});
		});
		describe('When domainObjects array is mapped for entities array', () => {
			beforeAll(() => {
				jest.useFakeTimers();
				jest.setSystemTime(new Date());
			});

			afterAll(() => {
				jest.useRealTimers();
			});

			it('should properly map the domainObjects to the entities', () => {
				const domainObjects = [classFactory.build()];

				const entities = ClassMapper.mapToEntities(domainObjects);

				const expectedEntities = domainObjects.map((domainObject) => {
					const entity = new ClassEntity({
						id: domainObject.id,
						name: domainObject.name,
						schoolId: new ObjectId(domainObject.schoolId),
						teacherIds: domainObject.teacherIds.map((teacherId) => new ObjectId(teacherId)),
						invitationLink: domainObject.invitationLink,
						ldapDN: domainObject.ldapDN,
						source: domainObject.source,
						gradeLevel: domainObject.gradeLevel,
						sourceOptions: domainObject.sourceOptions,
						successor: new ObjectId(domainObject.successor),
						userIds: domainObject.userIds?.map((userId) => new ObjectId(userId)),
						year: new ObjectId(domainObject.year),
					});

					return entity;
				});

				expect(entities).toEqual(expectedEntities);
			});
		});
	});
});
