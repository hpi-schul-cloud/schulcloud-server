/* eslint-disable no-new */
import { setupEntities } from '@shared/testing';
import { classEntityFactory } from '@src/modules/classes/entity/testing/factory/class.entity.factory';
import { ObjectId } from '@mikro-orm/mongodb';
import { ClassEntity } from '../class.entity';

describe(ClassEntity.name, () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('constructor', () => {
		describe('When wrong gradeLevel value is passed', () => {
			it('should throw an error by wrong gradeLevel value', () => {
				expect(() => {
					new ClassEntity({
						name: 'classTest',
						schoolId: new ObjectId(),
						teacherIds: [new ObjectId()],
						gradeLevel: 0,
					});
				}).toThrow();

				expect(() => {
					new ClassEntity({
						name: 'classTest',
						schoolId: new ObjectId(),
						teacherIds: [new ObjectId()],
						gradeLevel: 14,
					});
				}).toThrow();
			});
		});

		describe('When constructor is called', () => {
			it('should create a class by passing required properties', () => {
				const entity: ClassEntity = classEntityFactory.build();

				expect(entity instanceof ClassEntity).toEqual(true);
			});
		});

		describe('when passed undefined id', () => {
			const setup = () => {
				const entity: ClassEntity = classEntityFactory.build();

				return { entity };
			};

			it('should not set the id', () => {
				const { entity } = setup();

				const classEntity = new ClassEntity(entity);

				expect(classEntity.id).toBeNull();
			});
		});

		describe('when passed a valid id', () => {
			const setup = () => {
				const entity: ClassEntity = classEntityFactory.build({ id: new ObjectId().toHexString() });

				return { entity };
			};

			it('should set the id', () => {
				const { entity } = setup();

				const classEntity: ClassEntity = new ClassEntity(entity);

				expect(classEntity.id).toEqual(entity.id);
			});
		});
	});
});
