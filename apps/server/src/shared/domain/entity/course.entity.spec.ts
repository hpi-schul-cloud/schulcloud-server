import { userFactory, courseFactory, schoolFactory, setupEntities } from '@shared/testing';
import { Course } from './course.entity';

const DEFAULT = {
	color: '#ACACAC',
	name: 'Kurse',
	description: '',
};

describe('CourseEntity', () => {
	beforeAll(async () => {
		await setupEntities();
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

	describe('defaults', () => {
		it('should return defaults values', () => {
			const school = schoolFactory.build();
			const course = new Course({ school });

			expect(course.name).toEqual(DEFAULT.name);
			expect(course.description).toEqual(DEFAULT.description);
			expect(course.color).toEqual(DEFAULT.color);
		});
	});

	describe('getMetadata', () => {
		it('should return a metadata object', () => {
			const course = courseFactory.build({ name: 'History', color: '#445566' });

			const result = course.getMetadata();

			expect(result.name).toEqual('History');
			expect(result.shortName).toEqual('Hi');
			expect(result.displayColor).toEqual('#445566');
			expect(result.id).toEqual(course.id);
		});
	});

	describe('getStudents', () => {
		it('should count the number of assigned students', () => {
			const student1 = userFactory.build();
			const student2 = userFactory.build();
			const course = courseFactory.build({ students: [student1, student2] });

			const number = course.getNumberOfStudents();

			expect(number).toEqual(2);
		});

		it('should return 0 if no student is assigned', () => {
			const teacher = userFactory.build();
			const course = courseFactory.build({ teachers: [teacher], students: [] });

			const number = course.getNumberOfStudents();

			expect(number).toEqual(0);
		});
	});

	describe('getSubstitutionTeacherIds', () => {
		it('should return all substitution teacher ids.', () => {
			const teacher1 = userFactory.build();
			const teacher2 = userFactory.build();
			teacher1.id = '0123456789ab';
			teacher2.id = '0123456789cd';

			const course = courseFactory.build({ substitutionTeachers: [teacher1, teacher2] });

			const ids = course.getSubstitutionTeacherIds();

			expect(ids).toEqual([teacher1.id, teacher2.id]);
		});

		it('should work if no substitution teacher exist.', () => {
			const course = courseFactory.build({ substitutionTeachers: [] });

			const ids = course.getSubstitutionTeacherIds();

			expect(ids).toEqual([]);
		});
	});
});
