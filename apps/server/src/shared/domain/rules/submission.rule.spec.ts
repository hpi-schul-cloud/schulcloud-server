import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
	courseFactory,
	courseGroupFactory,
	roleFactory,
	setupEntities,
	submissionFactory,
	taskFactory,
	userFactory,
} from '@shared/testing';
import { CourseGroupRule, CourseRule, LessonRule, SubmissionRule, TaskRule } from '.';
import { User } from '../entity';
import { Permission, RoleName } from '../interface';
import { Actions } from './actions.enum';

describe('SubmissionRule', () => {
	let orm: MikroORM;
	let submissionRule: SubmissionRule;
	let student: User;
	let student2: User;
	let teacher: User;
	const permissionA = 'a' as Permission;
	const permissionB = 'b' as Permission;
	const permissionC = 'c' as Permission;

	beforeAll(async () => {
		orm = await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [TaskRule, CourseRule, LessonRule, CourseGroupRule, SubmissionRule],
		}).compile();

		submissionRule = await module.get(SubmissionRule);

		const studentRole = roleFactory.build({ permissions: [permissionA, permissionB], name: RoleName.STUDENT });
		student = userFactory.build({ roles: [studentRole] });
		student2 = userFactory.build({ roles: [studentRole] });
		const teacherRole = roleFactory.build({ permissions: [permissionC], name: RoleName.TEACHER });
		teacher = userFactory.build({ roles: [teacherRole] });
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('isApplicable', () => {
		it('should return true if entity is instance of Submission', () => {
			const task = taskFactory.build();
			const submission = submissionFactory.build({ task, student });

			const result = submissionRule.isApplicable(student, submission);

			expect(result).toBe(true);
		});

		it('should return false if entity is not instance of Submission', () => {
			const task = taskFactory.build();

			const result = submissionRule.isApplicable(student, task);

			expect(result).toBe(false);
		});
	});

	describe('hasPermission', () => {
		describe('when user does not have required permissions', () => {
			it('should return false', () => {
				const task = taskFactory.build();
				const submission = submissionFactory.build({ task, student });

				const result = submissionRule.hasPermission(student, submission, {
					action: Actions.write,
					requiredPermissions: [permissionC],
				});

				expect(result).toBe(false);
			});
		});

		describe('when user has required permissions', () => {
			describe('when user is student', () => {
				describe('when action is "write"', () => {
					it('should return true if user is creator', () => {
						const task = taskFactory.build();
						const submission = submissionFactory.build({ task, student });

						const result = submissionRule.hasPermission(student, submission, {
							action: Actions.write,
							requiredPermissions: [permissionA],
						});

						expect(result).toBe(true);
					});

					it('should return true if user is team member', () => {
						const task = taskFactory.build();
						const submission = submissionFactory.build({ task, student: student2, teamMembers: [student] });

						const result = submissionRule.hasPermission(student, submission, {
							action: Actions.write,
							requiredPermissions: [permissionA],
						});

						expect(result).toBe(true);
					});

					it('should return true if user is in associated course group', () => {
						const task = taskFactory.build();
						const courseGroup = courseGroupFactory.build({ students: [student, student2] });
						const submission = submissionFactory.build({ task, student: student2, courseGroup });

						const result = submissionRule.hasPermission(student, submission, {
							action: Actions.write,
							requiredPermissions: [permissionA],
						});

						expect(result).toBe(true);
					});

					it('should return false if user is not creator nor team member nor in associated course group (even if submissions are public)', () => {
						const course = courseFactory.build({ students: [student, student2] });
						const task = taskFactory.build({ course, publicSubmissions: true });
						const submission = submissionFactory.build({ task, student: student2 });

						const result = submissionRule.hasPermission(student, submission, {
							action: Actions.write,
							requiredPermissions: [permissionA],
						});

						expect(result).toBe(false);
					});
				});

				describe('when action is "read"', () => {
					it('should return true if user is in same course and submissions are public', () => {
						const course = courseFactory.build({ students: [student, student2] });
						const task = taskFactory.build({ course, publicSubmissions: true });
						const submission = submissionFactory.build({ task, student: student2 });

						const result = submissionRule.hasPermission(student, submission, {
							action: Actions.read,
							requiredPermissions: [permissionA],
						});

						expect(result).toBe(true);
					});

					it('should return false if user does not have write access nor are submissions public', () => {
						const course = courseFactory.build({ students: [student, student2] });
						const task = taskFactory.build({ course });
						const submission = submissionFactory.build({ task, student: student2 });

						const result = submissionRule.hasPermission(student, submission, {
							action: Actions.read,
							requiredPermissions: [permissionA],
						});

						expect(result).toBe(false);
					});
				});
			});

			describe('when user is teacher', () => {
				describe('when action is "write" (or "read" respectively)', () => {
					it('should return true if user is course teacher', () => {
						const course = courseFactory.build({ teachers: [teacher] });
						const task = taskFactory.build({ course });
						const submission = submissionFactory.build({ task, student });

						const result = submissionRule.hasPermission(teacher, submission, {
							action: Actions.write,
							requiredPermissions: [permissionC],
						});

						expect(result).toBe(true);
					});

					it('should return false if user is teacher but not in course', () => {
						const task = taskFactory.build();
						const submission = submissionFactory.build({ task, student });

						const result = submissionRule.hasPermission(teacher, submission, {
							action: Actions.write,
							requiredPermissions: [permissionC],
						});

						expect(result).toBe(false);
					});
				});
			});
		});
	});
});
