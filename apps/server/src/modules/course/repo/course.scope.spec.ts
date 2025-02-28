import { ObjectId } from '@mikro-orm/mongodb';
import { CourseScope } from './course.scope';

describe(CourseScope.name, () => {
	let scope: CourseScope;

	beforeEach(() => {
		scope = new CourseScope();
		scope.allowEmptyQuery(true);
		jest.useFakeTimers();
		jest.setSystemTime(new Date());
	});

	describe('forAllGroupTypes', () => {
		describe('when id is defined', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const isStudent = { students: userId };
				const isTeacher = { teachers: userId };
				const isSubstitutionTeacher = { substitutionTeachers: userId };

				return {
					userId,
					isStudent,
					isTeacher,
					isSubstitutionTeacher,
				};
			};

			it('should add query', () => {
				const { userId, isStudent, isTeacher, isSubstitutionTeacher } = setup();

				scope.forAllGroupTypes(userId);

				expect(scope.query).toEqual({ $or: [isStudent, isTeacher, isSubstitutionTeacher] });
			});
		});
	});

	describe('forTeacherOrSubstituteTeacher', () => {
		describe('when id is defined', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const isTeacher = { teachers: userId };
				const isSubstitutionTeacher = { substitutionTeachers: userId };

				return {
					userId,
					isTeacher,
					isSubstitutionTeacher,
				};
			};

			it('should add query', () => {
				const { userId, isTeacher, isSubstitutionTeacher } = setup();

				scope.forTeacherOrSubstituteTeacher(userId);

				expect(scope.query).toEqual({ $or: [isTeacher, isSubstitutionTeacher] });
			});
		});
	});

	describe('forTeacher', () => {
		describe('when id is defined', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const isTeacher = { teachers: userId };

				return {
					userId,
					isTeacher,
				};
			};

			it('should add query', () => {
				const { userId } = setup();

				scope.forTeacher(userId);

				expect(scope.query).toEqual({ teachers: userId });
			});
		});
	});

	describe('forActiveCourses', () => {
		describe('when called', () => {
			const setup = () => {
				const now = new Date();

				const noUntilDate = { untilDate: { $exists: false } };
				const untilDateInFuture = { untilDate: { $gte: now } };

				return {
					noUntilDate,
					untilDateInFuture,
				};
			};

			it('should add query', () => {
				const { noUntilDate, untilDateInFuture } = setup();

				scope.forActiveCourses();

				expect(scope.query).toEqual({ $or: [noUntilDate, untilDateInFuture] });
			});
		});
	});

	describe('forCourseId', () => {
		describe('when id is defined', () => {
			const setup = () => {
				const courseId = new ObjectId().toHexString();

				return { courseId };
			};

			it('should add query', () => {
				const { courseId } = setup();

				scope.forCourseId(courseId);

				expect(scope.query).toEqual({ id: courseId });
			});
		});
	});

	describe('bySchoolId', () => {
		describe('when id is defined', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();

				return { schoolId };
			};

			it('should add query', () => {
				const { schoolId } = setup();

				scope.bySchoolId(schoolId);

				expect(scope.query).toEqual({ school: schoolId });
			});
		});

		describe('when id is not defined', () => {
			it('should add query', () => {
				scope.bySchoolId(undefined);

				expect(scope.query).toEqual({});
			});
		});
	});

	describe('bySchoolId', () => {
		describe('when id is defined', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();

				return { schoolId };
			};

			it('should add query', () => {
				const { schoolId } = setup();

				scope.bySchoolId(schoolId);

				expect(scope.query).toEqual({ school: schoolId });
			});
		});

		describe('when id is not defined', () => {
			it('should add query', () => {
				scope.bySchoolId(undefined);

				expect(scope.query).toEqual({});
			});
		});
	});

	describe('forArchivedCourses', () => {
		describe('when called', () => {
			const setup = () => {
				const now = new Date();
				const untilDateExists = { untilDate: { $exists: true } };
				const untilDateInPast = { untilDate: { $lt: now } };

				return {
					untilDateExists,
					untilDateInPast,
				};
			};

			it('should add query', () => {
				const { untilDateExists, untilDateInPast } = setup();

				scope.forArchivedCourses();

				expect(scope.query).toEqual({ $and: [untilDateExists, untilDateInPast] });
			});
		});
	});
});
