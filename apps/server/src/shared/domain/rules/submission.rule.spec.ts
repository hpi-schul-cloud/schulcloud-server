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
import { Permission, RoleName } from '../interface';
import { Actions } from './actions.enum';

const buildStudent = (permission) => {
	const studentRole = roleFactory.build({
		permissions: [permission],
		name: RoleName.STUDENT,
	});
	const student = userFactory.build({ roles: [studentRole] });

	return student;
};

const buildTeacher = (permission) => {
	const teacherRole = roleFactory.build({ permissions: [permission], name: RoleName.TEACHER });
	const teacher = userFactory.build({ roles: [teacherRole] });

	return teacher;
};

describe('SubmissionRule', () => {
	let orm: MikroORM;
	let submissionRule: SubmissionRule;

	beforeAll(async () => {
		orm = await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [TaskRule, CourseRule, LessonRule, CourseGroupRule, SubmissionRule],
		}).compile();

		submissionRule = await module.get(SubmissionRule);
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('isApplicable', () => {
		describe('when entity is instance of Submission', () => {
			const setup = () => {
				const user = userFactory.build({ roles: [] });
				const task = taskFactory.build();
				const submission = submissionFactory.build({ task });

				return { user, submission };
			};

			it('should return true', () => {
				const { user, submission } = setup();

				const result = submissionRule.isApplicable(user, submission);

				expect(result).toBe(true);
			});
		});

		describe('when entity is not instance of Submission', () => {
			const setup = () => {
				const user = userFactory.build({ roles: [] });
				const task = taskFactory.build();

				return { user, task };
			};

			it('should return false', () => {
				const { user, task } = setup();

				const result = submissionRule.isApplicable(user, task);

				expect(result).toBe(false);
			});
		});
	});

	describe('hasPermission', () => {
		describe('when user does not have required permissions', () => {
			const setup = () => {
				const permission = 'a' as Permission;
				const user = userFactory.build({ roles: [] });
				const task = taskFactory.build();
				const submission = submissionFactory.build({ task, student: user });
				return { user, submission, permission };
			};

			it('should return false', () => {
				const { user, submission, permission } = setup();

				const result = submissionRule.hasPermission(user, submission, {
					action: Actions.write,
					requiredPermissions: [permission],
				});

				expect(result).toBe(false);
			});
		});

		describe('when user has required permissions', () => {
			describe('when user is student', () => {
				describe('when action is "write"', () => {
					describe('when user is creator', () => {
						const setup = () => {
							const permission = 'a' as Permission;
							const student = buildStudent(permission);
							const task = taskFactory.build();
							const submission = submissionFactory.build({ task, student });
							return { student, submission, permission };
						};

						it('should return true', () => {
							const { student, submission, permission } = setup();

							const result = submissionRule.hasPermission(student, submission, {
								action: Actions.write,
								requiredPermissions: [permission],
							});

							expect(result).toBe(true);
						});
					});

					describe('when user is team member', () => {
						const setup = () => {
							const permission = 'a' as Permission;
							const student = buildStudent(permission);
							const student2 = buildStudent(permission);
							const task = taskFactory.build();
							const submission = submissionFactory.build({ task, student: student2, teamMembers: [student] });
							return { student, submission, permission };
						};

						it('should return true', () => {
							const { student, submission, permission } = setup();

							const result = submissionRule.hasPermission(student, submission, {
								action: Actions.write,
								requiredPermissions: [permission],
							});

							expect(result).toBe(true);
						});
					});

					describe('when user is in associated course group', () => {
						const setup = () => {
							const permission = 'a' as Permission;
							const student = buildStudent(permission);
							const student2 = buildStudent(permission);
							const task = taskFactory.build();
							const courseGroup = courseGroupFactory.build({ students: [student, student2] });
							const submission = submissionFactory.build({ task, student: student2, courseGroup });
							return { student, submission, permission };
						};

						it('should return true', () => {
							const { student, submission, permission } = setup();

							const result = submissionRule.hasPermission(student, submission, {
								action: Actions.write,
								requiredPermissions: [permission],
							});

							expect(result).toBe(true);
						});
					});

					describe('when user is not creator nor team member nor in associated course group (even if submissions are public)', () => {
						const setup = () => {
							const permission = 'a' as Permission;
							const student = buildStudent(permission);
							const student2 = buildStudent(permission);
							const course = courseFactory.build({ students: [student, student2] });
							const task = taskFactory.build({ course, publicSubmissions: true });
							const submission = submissionFactory.build({ task, student: student2 });
							return { student, submission, permission };
						};

						it('should return false', () => {
							const { student, submission, permission } = setup();

							const result = submissionRule.hasPermission(student, submission, {
								action: Actions.write,
								requiredPermissions: [permission],
							});

							expect(result).toBe(false);
						});
					});
				});

				describe('when action is "read"', () => {
					describe('when user is in same course and submissions are public', () => {
						const setup = () => {
							const permission = 'a' as Permission;
							const student = buildStudent(permission);
							const student2 = buildStudent(permission);
							const course = courseFactory.build({ students: [student, student2] });
							const task = taskFactory.build({ course, publicSubmissions: true });
							const submission = submissionFactory.build({ task, student: student2 });
							return { student, submission, permission };
						};

						it('should return true', () => {
							const { student, submission, permission } = setup();

							const result = submissionRule.hasPermission(student, submission, {
								action: Actions.read,
								requiredPermissions: [permission],
							});

							expect(result).toBe(true);
						});
					});

					describe('when user does not have write access nor are submissions public', () => {
						const setup = () => {
							const permission = 'a' as Permission;
							const student = buildStudent(permission);
							const student2 = buildStudent(permission);
							const course = courseFactory.build({ students: [student, student2] });
							const task = taskFactory.build({ course });
							const submission = submissionFactory.build({ task, student: student2 });
							return { student, submission, permission };
						};

						it('should return false', () => {
							const { student, submission, permission } = setup();

							const result = submissionRule.hasPermission(student, submission, {
								action: Actions.read,
								requiredPermissions: [permission],
							});

							expect(result).toBe(false);
						});
					});
				});
			});

			describe('when user is teacher', () => {
				describe('when action is "write" (or "read" respectively)', () => {
					describe('when user is course teacher', () => {
						const setup = () => {
							const permission = 'a' as Permission;
							const teacher = buildTeacher(permission);
							const course = courseFactory.build({ teachers: [teacher] });
							const task = taskFactory.build({ course });
							const submission = submissionFactory.build({ task });
							return { teacher, submission, permission };
						};

						it('should return true', () => {
							const { teacher, submission, permission } = setup();

							const result = submissionRule.hasPermission(teacher, submission, {
								action: Actions.write,
								requiredPermissions: [permission],
							});

							expect(result).toBe(true);
						});
					});

					describe('when user is not course teacher', () => {
						const setup = () => {
							const permission = 'a' as Permission;
							const teacher = buildTeacher(permission);
							const task = taskFactory.build();
							const submission = submissionFactory.build({ task });
							return { teacher, submission, permission };
						};

						it('should return false', () => {
							const { teacher, submission, permission } = setup();

							const result = submissionRule.hasPermission(teacher, submission, {
								action: Actions.write,
								requiredPermissions: [permission],
							});

							expect(result).toBe(false);
						});
					});
				});
			});
		});
	});
});
