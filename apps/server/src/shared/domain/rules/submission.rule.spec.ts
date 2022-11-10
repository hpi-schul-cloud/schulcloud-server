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
import { Permission } from '../interface';
import { Actions } from './actions.enum';

const buildUserWithPermission = (permission) => {
	const role = roleFactory.build({ permissions: [permission] });
	const user = userFactory.build({ roles: [role] });

	return user;
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

	afterEach(() => {
		jest.resetAllMocks();
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
		describe('when user roles do not contain required permissions', () => {
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

		describe('when user roles contain required permissions', () => {
			describe('when action is "write"', () => {
				describe('when user is creator', () => {
					const setup = () => {
						const permission = 'a' as Permission;
						const user = buildUserWithPermission(permission);
						const task = taskFactory.build();
						const submission = submissionFactory.build({ task, student: user });
						return { user, submission, permission };
					};

					it('should return true', () => {
						const { user, submission, permission } = setup();

						const result = submissionRule.hasPermission(user, submission, {
							action: Actions.write,
							requiredPermissions: [permission],
						});

						expect(result).toBe(true);
					});
				});

				describe('when user is team member', () => {
					const setup = () => {
						const permission = 'a' as Permission;
						const user = buildUserWithPermission(permission);
						const user2 = buildUserWithPermission(permission);
						const task = taskFactory.build();
						const submission = submissionFactory.build({ task, student: user2, teamMembers: [user] });
						return { user, submission, permission };
					};

					it('should return true', () => {
						const { user, submission, permission } = setup();

						const result = submissionRule.hasPermission(user, submission, {
							action: Actions.write,
							requiredPermissions: [permission],
						});

						expect(result).toBe(true);
					});
				});

				describe('when user is in associated course group', () => {
					const setup = () => {
						const permission = 'a' as Permission;
						const user = buildUserWithPermission(permission);
						const user2 = buildUserWithPermission(permission);
						const task = taskFactory.build();
						const courseGroup = courseGroupFactory.build({ students: [user, user2] });
						const submission = submissionFactory.build({ task, student: user2, courseGroup });
						return { user, submission, permission };
					};

					it('should return true', () => {
						const { user, submission, permission } = setup();

						const result = submissionRule.hasPermission(user, submission, {
							action: Actions.write,
							requiredPermissions: [permission],
						});

						expect(result).toBe(true);
					});
				});

				describe('when user is course teacher', () => {
					const setup = () => {
						const permission = 'a' as Permission;
						const user = buildUserWithPermission(permission);
						const course = courseFactory.build({ teachers: [user] });
						const task = taskFactory.build({ course });
						const submission = submissionFactory.build({ task });
						return { user, submission, permission };
					};

					it('should return true', () => {
						const { user, submission, permission } = setup();

						const result = submissionRule.hasPermission(user, submission, {
							action: Actions.write,
							requiredPermissions: [permission],
						});

						expect(result).toBe(true);
					});
				});

				describe('when user is course substitution teacher', () => {
					const setup = () => {
						const permission = 'a' as Permission;
						const user = buildUserWithPermission(permission);
						const course = courseFactory.build({ substitutionTeachers: [user] });
						const task = taskFactory.build({ course });
						const submission = submissionFactory.build({ task });
						return { user, submission, permission };
					};

					it('should return true', () => {
						const { user, submission, permission } = setup();

						const result = submissionRule.hasPermission(user, submission, {
							action: Actions.write,
							requiredPermissions: [permission],
						});

						expect(result).toBe(true);
					});
				});

				describe('when user is nothing of the above (even if submissions are public)', () => {
					const setup = () => {
						const permission = 'a' as Permission;
						const user = buildUserWithPermission(permission);
						const user2 = buildUserWithPermission(permission);
						const course = courseFactory.build({ students: [user, user2] });
						const task = taskFactory.build({ course, publicSubmissions: true });
						const submission = submissionFactory.build({ task, student: user2 });
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
			});

			describe('when action is "read"', () => {
				describe('when user has write access', () => {
					const setup = () => {
						const permission = 'a' as Permission;
						const user = buildUserWithPermission(permission);
						const submission = submissionFactory.build();
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						const hasWriteAccessSpy = jest.spyOn(SubmissionRule.prototype as any, 'hasWriteAccess');
						hasWriteAccessSpy.mockReturnValue(true);

						return { user, submission, permission };
					};

					it('should return true', () => {
						const { user, submission, permission } = setup();

						const result = submissionRule.hasPermission(user, submission, {
							action: Actions.write,
							requiredPermissions: [permission],
						});

						expect(result).toBe(true);
					});
				});

				describe('when user is student in same course and submissions are public', () => {
					const setup = () => {
						const permission = 'a' as Permission;
						const user = buildUserWithPermission(permission);
						const user2 = buildUserWithPermission(permission);
						const course = courseFactory.build({ students: [user, user2] });
						const task = taskFactory.build({ course, publicSubmissions: true });
						const submission = submissionFactory.build({ task, student: user2 });
						return { user, submission, permission };
					};

					it('should return true', () => {
						const { user, submission, permission } = setup();

						const result = submissionRule.hasPermission(user, submission, {
							action: Actions.read,
							requiredPermissions: [permission],
						});

						expect(result).toBe(true);
					});
				});

				describe('when user does not have write access nor are submissions public', () => {
					const setup = () => {
						const permission = 'a' as Permission;
						const user = buildUserWithPermission(permission);
						const user2 = buildUserWithPermission(permission);
						const course = courseFactory.build({ students: [user, user2] });
						const task = taskFactory.build({ course });
						const submission = submissionFactory.build({ task, student: user2 });
						return { user, submission, permission };
					};

					it('should return false', () => {
						const { user, submission, permission } = setup();

						const result = submissionRule.hasPermission(user, submission, {
							action: Actions.read,
							requiredPermissions: [permission],
						});

						expect(result).toBe(false);
					});
				});
			});
		});
	});
});
