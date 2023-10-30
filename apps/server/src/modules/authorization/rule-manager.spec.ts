import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { InternalServerErrorException, NotImplementedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { BoardDoRule } from '@shared/domain/rules/board-do.rule';
import { ContextExternalToolRule } from '@shared/domain/rules/context-external-tool.rule';
import { CourseGroupRule } from '@shared/domain/rules/course-group.rule';
import { CourseRule } from '@shared/domain/rules/course.rule';
import { LegacySchoolRule } from '@shared/domain/rules/legacy-school.rule';
import { LessonRule } from '@shared/domain/rules/lesson.rule';
import { SchoolExternalToolRule } from '@shared/domain/rules/school-external-tool.rule';
import { SubmissionRule } from '@shared/domain/rules/submission.rule';
import { TaskRule } from '@shared/domain/rules/task.rule';
import { TeamRule } from '@shared/domain/rules/team.rule';
import { UserLoginMigrationRule } from '@shared/domain/rules/user-login-migration.rule';
import { UserRule } from '@shared/domain/rules/user.rule';
import { courseFactory } from '@shared/testing/factory/course.factory';
import { userFactory } from '@shared/testing/factory/user.factory';
import { setupEntities } from '@shared/testing/setup-entities';
import { AuthorizationContextBuilder } from './authorization-context.builder';
import { RuleManager } from './rule-manager';

describe('RuleManager', () => {
	let service: RuleManager;
	let courseRule: DeepMocked<CourseRule>;
	let courseGroupRule: DeepMocked<CourseGroupRule>;
	let lessonRule: DeepMocked<LessonRule>;
	let legacySchoolRule: DeepMocked<LegacySchoolRule>;
	let userRule: DeepMocked<UserRule>;
	let taskRule: DeepMocked<TaskRule>;
	let teamRule: DeepMocked<TeamRule>;
	let submissionRule: DeepMocked<SubmissionRule>;
	let schoolExternalToolRule: DeepMocked<SchoolExternalToolRule>;
	let boardDoRule: DeepMocked<BoardDoRule>;
	let contextExternalToolRule: DeepMocked<ContextExternalToolRule>;
	let userLoginMigrationRule: DeepMocked<UserLoginMigrationRule>;

	beforeAll(async () => {
		await setupEntities();

		const module = await Test.createTestingModule({
			providers: [
				RuleManager,
				{ provide: CourseRule, useValue: createMock<CourseRule>() },
				{ provide: CourseGroupRule, useValue: createMock<CourseGroupRule>() },
				{ provide: LessonRule, useValue: createMock<LessonRule>() },
				{ provide: LegacySchoolRule, useValue: createMock<LegacySchoolRule>() },
				{ provide: UserRule, useValue: createMock<UserRule>() },
				{ provide: TaskRule, useValue: createMock<TaskRule>() },
				{ provide: TeamRule, useValue: createMock<TeamRule>() },
				{ provide: SubmissionRule, useValue: createMock<SubmissionRule>() },
				{ provide: SchoolExternalToolRule, useValue: createMock<SchoolExternalToolRule>() },
				{ provide: BoardDoRule, useValue: createMock<BoardDoRule>() },
				{ provide: ContextExternalToolRule, useValue: createMock<ContextExternalToolRule>() },
				{ provide: UserLoginMigrationRule, useValue: createMock<UserLoginMigrationRule>() },
			],
		}).compile();

		service = await module.get(RuleManager);
		courseRule = await module.get(CourseRule);
		courseGroupRule = await module.get(CourseGroupRule);
		lessonRule = await module.get(LessonRule);
		legacySchoolRule = await module.get(LegacySchoolRule);
		userRule = await module.get(UserRule);
		taskRule = await module.get(TaskRule);
		teamRule = await module.get(TeamRule);
		submissionRule = await module.get(SubmissionRule);
		schoolExternalToolRule = await module.get(SchoolExternalToolRule);
		boardDoRule = await module.get(BoardDoRule);
		contextExternalToolRule = await module.get(ContextExternalToolRule);
		userLoginMigrationRule = await module.get(UserLoginMigrationRule);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('selectRule', () => {
		// We only test for one rule here, because all rules behave the same.
		describe('when CourseRule is applicable', () => {
			const setup = () => {
				const user = userFactory.build();
				const object = courseFactory.build();
				const context = AuthorizationContextBuilder.read([]);

				courseRule.isApplicable.mockReturnValueOnce(true);
				courseGroupRule.isApplicable.mockReturnValueOnce(false);
				lessonRule.isApplicable.mockReturnValueOnce(false);
				legacySchoolRule.isApplicable.mockReturnValueOnce(false);
				userRule.isApplicable.mockReturnValueOnce(false);
				taskRule.isApplicable.mockReturnValueOnce(false);
				teamRule.isApplicable.mockReturnValueOnce(false);
				submissionRule.isApplicable.mockReturnValueOnce(false);
				schoolExternalToolRule.isApplicable.mockReturnValueOnce(false);
				boardDoRule.isApplicable.mockReturnValueOnce(false);
				contextExternalToolRule.isApplicable.mockReturnValueOnce(false);
				userLoginMigrationRule.isApplicable.mockReturnValueOnce(false);

				return { user, object, context };
			};

			it('should call isApplicable on all rules', () => {
				const { user, object, context } = setup();

				service.selectRule(user, object, context);

				expect(courseRule.isApplicable).toBeCalled();
				expect(courseGroupRule.isApplicable).toBeCalled();
				expect(lessonRule.isApplicable).toBeCalled();
				expect(legacySchoolRule.isApplicable).toBeCalled();
				expect(userRule.isApplicable).toBeCalled();
				expect(taskRule.isApplicable).toBeCalled();
				expect(teamRule.isApplicable).toBeCalled();
				expect(submissionRule.isApplicable).toBeCalled();
				expect(schoolExternalToolRule.isApplicable).toBeCalled();
				expect(boardDoRule.isApplicable).toBeCalled();
				expect(contextExternalToolRule.isApplicable).toBeCalled();
				expect(userLoginMigrationRule.isApplicable).toBeCalled();
			});

			it('should return CourseRule', () => {
				const { user, object, context } = setup();

				const result = service.selectRule(user, object, context);

				expect(result).toBe(courseRule);
			});
		});

		describe('when no rule is applicable', () => {
			const setup = () => {
				const user = userFactory.build();
				const object = courseFactory.build();
				const context = AuthorizationContextBuilder.read([]);

				courseRule.isApplicable.mockReturnValueOnce(false);
				courseGroupRule.isApplicable.mockReturnValueOnce(false);
				lessonRule.isApplicable.mockReturnValueOnce(false);
				legacySchoolRule.isApplicable.mockReturnValueOnce(false);
				userRule.isApplicable.mockReturnValueOnce(false);
				taskRule.isApplicable.mockReturnValueOnce(false);
				teamRule.isApplicable.mockReturnValueOnce(false);
				submissionRule.isApplicable.mockReturnValueOnce(false);
				schoolExternalToolRule.isApplicable.mockReturnValueOnce(false);
				boardDoRule.isApplicable.mockReturnValueOnce(false);
				contextExternalToolRule.isApplicable.mockReturnValueOnce(false);
				userLoginMigrationRule.isApplicable.mockReturnValueOnce(false);

				return { user, object, context };
			};

			it('should throw NotImplementedException', () => {
				const { user, object, context } = setup();

				expect(() => service.selectRule(user, object, context)).toThrow(NotImplementedException);
			});
		});

		describe('when more than one rule is applicable', () => {
			const setup = () => {
				const user = userFactory.build();
				const object = courseFactory.build();
				const context = AuthorizationContextBuilder.read([]);

				courseRule.isApplicable.mockReturnValueOnce(true);
				courseGroupRule.isApplicable.mockReturnValueOnce(true);
				lessonRule.isApplicable.mockReturnValueOnce(false);
				legacySchoolRule.isApplicable.mockReturnValueOnce(false);
				userRule.isApplicable.mockReturnValueOnce(false);
				taskRule.isApplicable.mockReturnValueOnce(false);
				teamRule.isApplicable.mockReturnValueOnce(false);
				submissionRule.isApplicable.mockReturnValueOnce(false);
				schoolExternalToolRule.isApplicable.mockReturnValueOnce(false);
				boardDoRule.isApplicable.mockReturnValueOnce(false);
				contextExternalToolRule.isApplicable.mockReturnValueOnce(false);
				userLoginMigrationRule.isApplicable.mockReturnValueOnce(false);

				return { user, object, context };
			};

			it('should throw InternalServerErrorException', () => {
				const { user, object, context } = setup();

				expect(() => service.selectRule(user, object, context)).toThrow(InternalServerErrorException);
			});
		});
	});
});
