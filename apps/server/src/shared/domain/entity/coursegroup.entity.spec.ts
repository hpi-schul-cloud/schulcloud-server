import { MikroORM } from '@mikro-orm/core';
import { InternalServerErrorException } from '@nestjs/common';
import { courseFactory, courseGroupFactory, setupEntities } from '@shared/testing';
import { CourseGroup } from './coursegroup.entity';

describe('CourseEntity', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('constructor', () => {
		it('should throw an error if constructor is called without arguments', () => {
			// @ts-expect-error: Test case
			const test = () => new CourseGroup();

			expect(test).toThrow();
		});

		it('should create a courseGroup when passing required properties', () => {
			const name = 'someName';
			const course = courseFactory.build();

			const courseGroup = new CourseGroup({ name, course });

			expect(courseGroup instanceof CourseGroup).toEqual(true);
		});
	});

	describe('getStudentIds is called', () => {
		describe('when students exists', () => {
			const setup = () => {
				const courseGroup = courseGroupFactory.studentsWithId(3).build();

				return { courseGroup };
			};

			it('should be return the userIds of the students', () => {
				const { courseGroup } = setup();

				const result = courseGroup.getStudentIds();

				expect(result.length).toEqual(3);
			});
		});

		describe('when course is not populated', () => {
			const setup = () => {
				const courseGroup = courseGroupFactory.build();
				Object.assign(courseGroup, { students: undefined });

				return { courseGroup };
			};

			it('should be return the userIds of the students', () => {
				const { courseGroup } = setup();

				expect(() => {
					courseGroup.getStudentIds();
				}).toThrowError(InternalServerErrorException);
			});
		});
	});
});
