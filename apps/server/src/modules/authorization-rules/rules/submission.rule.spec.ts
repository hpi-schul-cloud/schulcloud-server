import {
	Action,
	AuthorizationContext,
	AuthorizationHelper,
	AuthorizationInjectionService,
} from '@modules/authorization';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory, courseGroupEntityFactory } from '@modules/course/testing';
import { LessonEntity, Material } from '@modules/lesson/repo';
import { roleFactory } from '@modules/role/testing';
import { Submission, Task } from '@modules/task/repo';
import { submissionFactory, taskFactory } from '@modules/task/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { NotImplementedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { CourseGroupRule } from './course-group.rule';
import { CourseRule } from './course.rule';
import { LessonRule } from './lesson.rule';
import { SubmissionRule } from './submission.rule';
import { TaskRule } from './task.rule';

const buildUserWithPermission = (permission) => {
	const role = roleFactory.buildWithId({ permissions: [permission] });
	const user = userFactory.buildWithId({ roles: [role] });

	return user;
};

describe('SubmissionRule', () => {
	let submissionRule: SubmissionRule;
	let injectionService: AuthorizationInjectionService;

	beforeAll(async () => {
		await setupEntities([User, Submission, Task, CourseEntity, CourseGroupEntity, LessonEntity, Material]);

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthorizationHelper,
				SubmissionRule,
				TaskRule,
				CourseRule,
				LessonRule,
				CourseGroupRule,
				AuthorizationInjectionService,
			],
		}).compile();

		submissionRule = await module.get(SubmissionRule);
		injectionService = await module.get(AuthorizationInjectionService);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('constructor', () => {
		it('should inject into AuthorizationInjectionService', () => {
			expect(injectionService.getAuthorizationRules()).toContain(submissionRule);
		});
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
		describe('Given user request not implemented action', () => {
			const getContext = (): AuthorizationContext => {
				const context: AuthorizationContext = {
					requiredPermissions: [],
					// @ts-expect-error Testcase
					action: 'not_implemented',
				};

				return context;
			};

			describe('when valid data exists', () => {
				const setup = () => {
					const user = userFactory.build();
					const submission = submissionFactory.build({ student: user });
					const context = getContext();

					return {
						user,
						submission,
						context,
					};
				};

				it('should reject with NotImplementedException', () => {
					const { user, submission, context } = setup();

					expect(() => submissionRule.hasPermission(user, submission, context)).toThrowError(NotImplementedException);
				});
			});
		});

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
					action: Action.write,
					requiredPermissions: [permission],
				});

				expect(result).toBe(false);
			});
		});

		describe('when user roles contain required permissions', () => {
			describe('when action is "write"', () => {
				describe('when user is submitter', () => {
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
							action: Action.write,
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
							action: Action.write,
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
						const courseGroup = courseGroupEntityFactory.build({ students: [user, user2] });
						const submission = submissionFactory.build({ task, student: user2, courseGroup });
						return { user, submission, permission };
					};

					it('should return true', () => {
						const { user, submission, permission } = setup();

						const result = submissionRule.hasPermission(user, submission, {
							action: Action.write,
							requiredPermissions: [permission],
						});

						expect(result).toBe(true);
					});
				});

				describe('when user is course teacher', () => {
					const setup = () => {
						const permission = 'a' as Permission;
						const user = buildUserWithPermission(permission);
						const course = courseEntityFactory.build({ teachers: [user] });
						const task = taskFactory.build({ course });
						const submission = submissionFactory.build({ task });
						return { user, submission, permission };
					};

					it('should return true', () => {
						const { user, submission, permission } = setup();

						const result = submissionRule.hasPermission(user, submission, {
							action: Action.write,
							requiredPermissions: [permission],
						});

						expect(result).toBe(true);
					});
				});

				describe('when user is course substitution teacher', () => {
					const setup = () => {
						const permission = 'a' as Permission;
						const user = buildUserWithPermission(permission);
						const course = courseEntityFactory.build({ substitutionTeachers: [user] });
						const task = taskFactory.build({ course });
						const submission = submissionFactory.build({ task });
						return { user, submission, permission };
					};

					it('should return true', () => {
						const { user, submission, permission } = setup();

						const result = submissionRule.hasPermission(user, submission, {
							action: Action.write,
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
						const course = courseEntityFactory.build({ students: [user, user2] });
						const task = taskFactory.build({ course, publicSubmissions: true });
						const submission = submissionFactory.build({ task, student: user2 });
						return { user, submission, permission };
					};

					it('should return false', () => {
						const { user, submission, permission } = setup();

						const result = submissionRule.hasPermission(user, submission, {
							action: Action.write,
							requiredPermissions: [permission],
						});

						expect(result).toBe(false);
					});
				});

				describe('when due date has passed and user is submitter', () => {
					const setup = () => {
						const permission = 'a' as Permission;
						const user = buildUserWithPermission(permission);
						const user2 = buildUserWithPermission(permission);
						const course = courseEntityFactory.build({ students: [user, user2] });
						const task = taskFactory.build({ course, dueDate: new Date(Date.now() - 10000) });
						const submission = submissionFactory.build({ task, student: user });

						return { user, submission, permission };
					};

					it('should return false', () => {
						const { user, submission, permission } = setup();

						const result = submissionRule.hasPermission(user, submission, {
							action: Action.write,
							requiredPermissions: [permission],
						});

						expect(result).toBe(false);
					});
				});

				describe('when due date has passed but user is a teacher', () => {
					const setup = () => {
						const permission = 'a' as Permission;
						const user = buildUserWithPermission(permission);
						const user2 = buildUserWithPermission(permission);
						const course = courseEntityFactory.build({ students: [user2], teachers: [user] });
						const task = taskFactory.build({ course, dueDate: new Date(Date.now() - 10000) });
						const submission = submissionFactory.build({ task, student: user2 });

						return { user, submission, permission };
					};

					it('should return true', () => {
						const { user, submission, permission } = setup();

						const result = submissionRule.hasPermission(user, submission, {
							action: Action.write,
							requiredPermissions: [permission],
						});

						expect(result).toBe(true);
					});
				});
			});

			describe('when action is "read"', () => {
				describe('when submission is not submitted', () => {
					describe('when user is submitter', () => {
						const setup = () => {
							const permission = 'a' as Permission;
							const user = buildUserWithPermission(permission);
							const user2 = buildUserWithPermission(permission);
							const course = courseEntityFactory.build({ students: [user, user2] });
							const task = taskFactory.build({ course, publicSubmissions: true });
							const submission = submissionFactory.build({ task, student: user });

							return { user, submission, permission };
						};

						it('should return true', () => {
							const { user, submission, permission } = setup();

							const result = submissionRule.hasPermission(user, submission, {
								action: Action.read,
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
							const course = courseEntityFactory.build({ students: [user, user2] });
							const task = taskFactory.build({ course, publicSubmissions: true });
							const submission = submissionFactory.build({ task, student: user2, teamMembers: [user, user2] });

							return { user, submission, permission };
						};

						it('should return true', () => {
							const { user, submission, permission } = setup();

							const result = submissionRule.hasPermission(user, submission, {
								action: Action.read,
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
							const course = courseEntityFactory.build({ students: [user, user2] });
							const courseGroup = courseGroupEntityFactory.build({ course, students: [user] });
							const task = taskFactory.build({ course, publicSubmissions: true });
							const submission = submissionFactory.build({ task, student: user2, courseGroup });

							return { user, submission, permission };
						};

						it('should return true', () => {
							const { user, submission, permission } = setup();

							const result = submissionRule.hasPermission(user, submission, {
								action: Action.read,
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
							const course = courseEntityFactory.build({ students: [user, user2] });
							const task = taskFactory.build({ course, publicSubmissions: true });
							const submission = submissionFactory.build({ task, student: user2 });

							return { user, submission, permission };
						};

						it('should return false', () => {
							const { user, submission, permission } = setup();

							const result = submissionRule.hasPermission(user, submission, {
								action: Action.read,
								requiredPermissions: [permission],
							});

							expect(result).toBe(false);
						});
					});

					describe('when user is teacher in same course', () => {
						const setup = () => {
							const permission = 'a' as Permission;
							const user = buildUserWithPermission(permission);
							const user2 = buildUserWithPermission(permission);
							const course = courseEntityFactory.build({ students: [user2], teachers: [user] });
							const task = taskFactory.build({ course });
							const submission = submissionFactory.build({ task, student: user2 });

							return { user, submission, permission };
						};

						it('should return false', () => {
							const { user, submission, permission } = setup();

							const result = submissionRule.hasPermission(user, submission, {
								action: Action.read,
								requiredPermissions: [permission],
							});

							expect(result).toBe(false);
						});
					});

					describe('when user is substitution teacher in same course', () => {
						const setup = () => {
							const permission = 'a' as Permission;
							const user = buildUserWithPermission(permission);
							const user2 = buildUserWithPermission(permission);
							const course = courseEntityFactory.build({ students: [user2], substitutionTeachers: [user] });
							const task = taskFactory.build({ course });
							const submission = submissionFactory.build({ task, student: user2 });

							return { user, submission, permission };
						};

						it('should return false', () => {
							const { user, submission, permission } = setup();

							const result = submissionRule.hasPermission(user, submission, {
								action: Action.read,
								requiredPermissions: [permission],
							});

							expect(result).toBe(false);
						});
					});

					describe('when due date has passed and user is submitter', () => {
						const setup = () => {
							const permission = 'a' as Permission;
							const user = buildUserWithPermission(permission);
							const user2 = buildUserWithPermission(permission);
							const course = courseEntityFactory.build({ students: [user, user2] });
							const task = taskFactory.build({ course, dueDate: new Date(Date.now() - 10000) });
							const submission = submissionFactory.build({ task, student: user });

							return { user, submission, permission };
						};

						it('should return true', () => {
							const { user, submission, permission } = setup();

							const result = submissionRule.hasPermission(user, submission, {
								action: Action.read,
								requiredPermissions: [permission],
							});

							expect(result).toBe(true);
						});
					});

					describe('when due date has passed but user is a teacher', () => {
						const setup = () => {
							const permission = 'a' as Permission;
							const user = buildUserWithPermission(permission);
							const user2 = buildUserWithPermission(permission);
							const course = courseEntityFactory.build({ students: [user2], teachers: [user] });
							const task = taskFactory.build({ course, dueDate: new Date(Date.now() - 10000) });
							const submission = submissionFactory.build({ task, student: user });

							return { user, submission, permission };
						};

						it('should return true', () => {
							const { user, submission, permission } = setup();

							const result = submissionRule.hasPermission(user, submission, {
								action: Action.read,
								requiredPermissions: [permission],
							});

							expect(result).toBe(true);
						});
					});
				});

				describe('when submission is submitted', () => {
					describe('when user is submitter', () => {
						const setup = () => {
							const permission = 'a' as Permission;
							const user = buildUserWithPermission(permission);
							const user2 = buildUserWithPermission(permission);
							const course = courseEntityFactory.build({ students: [user, user2] });
							const task = taskFactory.build({ course, publicSubmissions: true });
							const submission = submissionFactory.submitted().build({ task, student: user });

							return { user, submission, permission };
						};

						it('should return true', () => {
							const { user, submission, permission } = setup();

							const result = submissionRule.hasPermission(user, submission, {
								action: Action.read,
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
							const course = courseEntityFactory.build({ students: [user, user2] });
							const task = taskFactory.build({ course, publicSubmissions: true });
							const submission = submissionFactory
								.submitted()
								.build({ task, student: user2, teamMembers: [user, user2] });

							return { user, submission, permission };
						};

						it('should return true', () => {
							const { user, submission, permission } = setup();

							const result = submissionRule.hasPermission(user, submission, {
								action: Action.read,
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
							const course = courseEntityFactory.build({ students: [user, user2] });
							const courseGroup = courseGroupEntityFactory.build({ course, students: [user] });
							const task = taskFactory.build({ course, publicSubmissions: true });
							const submission = submissionFactory.submitted().build({ task, student: user2, courseGroup });

							return { user, submission, permission };
						};

						it('should return true', () => {
							const { user, submission, permission } = setup();

							const result = submissionRule.hasPermission(user, submission, {
								action: Action.read,
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
							const course = courseEntityFactory.build({ students: [user, user2] });
							const task = taskFactory.build({ course, publicSubmissions: true });
							const submission = submissionFactory.submitted().build({ task, student: user2 });

							return { user, submission, permission };
						};

						it('should return true', () => {
							const { user, submission, permission } = setup();

							const result = submissionRule.hasPermission(user, submission, {
								action: Action.read,
								requiredPermissions: [permission],
							});

							expect(result).toBe(true);
						});
					});

					describe('when user is teacher in same course', () => {
						const setup = () => {
							const permission = 'a' as Permission;
							const user = buildUserWithPermission(permission);
							const user2 = buildUserWithPermission(permission);
							const course = courseEntityFactory.build({ students: [user2], teachers: [user] });
							const task = taskFactory.build({ course });
							const submission = submissionFactory.submitted().build({ task, student: user2 });

							return { user, submission, permission };
						};

						it('should return true', () => {
							const { user, submission, permission } = setup();

							const result = submissionRule.hasPermission(user, submission, {
								action: Action.read,
								requiredPermissions: [permission],
							});

							expect(result).toBe(true);
						});
					});

					describe('when user is substitution teacher in same course', () => {
						const setup = () => {
							const permission = 'a' as Permission;
							const user = buildUserWithPermission(permission);
							const user2 = buildUserWithPermission(permission);
							const course = courseEntityFactory.build({ students: [user2], substitutionTeachers: [user] });
							const task = taskFactory.build({ course });
							const submission = submissionFactory.submitted().build({ task, student: user2 });

							return { user, submission, permission };
						};

						it('should return true', () => {
							const { user, submission, permission } = setup();

							const result = submissionRule.hasPermission(user, submission, {
								action: Action.read,
								requiredPermissions: [permission],
							});

							expect(result).toBe(true);
						});
					});

					describe('when due date has passed and user is submitter', () => {
						const setup = () => {
							const permission = 'a' as Permission;
							const user = buildUserWithPermission(permission);
							const user2 = buildUserWithPermission(permission);
							const course = courseEntityFactory.build({ students: [user, user2] });
							const task = taskFactory.build({
								course,
								publicSubmissions: true,
								dueDate: new Date(Date.now() - 10000),
							});
							const submission = submissionFactory.submitted().build({ task, student: user });

							return { user, submission, permission };
						};

						it('should return true', () => {
							const { user, submission, permission } = setup();

							const result = submissionRule.hasPermission(user, submission, {
								action: Action.read,
								requiredPermissions: [permission],
							});

							expect(result).toBe(true);
						});
					});

					describe('when due date has passed but user is a teacher', () => {
						const setup = () => {
							const permission = 'a' as Permission;
							const user = buildUserWithPermission(permission);
							const user2 = buildUserWithPermission(permission);
							const course = courseEntityFactory.build({ students: [user2], teachers: [user] });
							const task = taskFactory.build({ course, dueDate: new Date(Date.now() - 10000) });
							const submission = submissionFactory.submitted().build({ task, student: user });

							return { user, submission, permission };
						};

						it('should return true', () => {
							const { user, submission, permission } = setup();

							const result = submissionRule.hasPermission(user, submission, {
								action: Action.read,
								requiredPermissions: [permission],
							});

							expect(result).toBe(true);
						});
					});
				});

				describe('when user does not have write access nor are submissions public', () => {
					const setup = () => {
						const permission = 'a' as Permission;
						const user = buildUserWithPermission(permission);
						const user2 = buildUserWithPermission(permission);
						const course = courseEntityFactory.build({ students: [user, user2] });
						const task = taskFactory.build({ course });
						const submission = submissionFactory.build({ task, student: user2 });

						return { user, submission, permission };
					};

					it('should return false', () => {
						const { user, submission, permission } = setup();

						const result = submissionRule.hasPermission(user, submission, {
							action: Action.read,
							requiredPermissions: [permission],
						});

						expect(result).toBe(false);
					});
				});
			});
		});
	});
});
