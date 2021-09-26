import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@src/modules/database';
import { userFactory } from '../factory';
import { courseFactory } from '../factory/course.factory';
import { schoolFactory } from '../factory/school.factory';
import { Course } from './course.entity';

const DEFAULT = {
	color: '#ACACAC',
	name: 'Kurse',
	description: '',
};

describe('CourseEntity', () => {
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
		}).compile();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('constructor', () => {
		it('should throw an error by empty constructor', () => {
			// @ts-expect-error: Test case
			const test = () => new Course();
			expect(test).toThrow();
		});

		it('should create a course by passing required properties', () => {
			const course = courseFactory.build();
			expect(course instanceof Course).toEqual(true);
		});
	});

	describe('getDescriptions', () => {
		it('should return the right properties', () => {
			const course = courseFactory.build();

			const result = course.getDescriptions();

			expect(result).toHaveProperty('color');
			expect(result).toHaveProperty('id');
			expect(result).toHaveProperty('description');
			expect(result).toHaveProperty('name');
			expect(Object.keys(result).length).toEqual(4);
		});

		it('should work and passing default informations if only required values exist', () => {
			const course = new Course({ school: schoolFactory.build() });

			const result = course.getDescriptions();

			expect(result).toEqual({
				description: DEFAULT.description,
				name: DEFAULT.name,
				color: DEFAULT.color,
				id: course.id,
			});
		});

		it('should return values if they are set', () => {
			const name = 'A1';
			const description = 'Happy hour.';
			const color = 'FFFFFF';

			const course = courseFactory.build({ name, description, color });

			const result = course.getDescriptions();

			expect(result).toEqual({
				name,
				description,
				color,
				id: course.id,
			});
		});
	});

	describe('getStudents', () => {
		it('should count the number of assigned students', () => {
			const student1 = userFactory.build({ firstName: 'John', lastName: 'Doe' });
			const student2 = userFactory.build({ firstName: 'Marla', lastName: 'Mathe' });
			const course = courseFactory.build({ students: [student1, student2] });

			const number = course.getNumberOfStudents();

			expect(number).toEqual(2);
		});

		it('should return 0 if no student is assigned', () => {
			const teacher = userFactory.build({ firstName: 'Carl', lastName: 'Cord' });
			const course = courseFactory.build({ teachers: [teacher], students: [] });

			const number = course.getNumberOfStudents();

			expect(number).toEqual(0);
		});
	});
});
