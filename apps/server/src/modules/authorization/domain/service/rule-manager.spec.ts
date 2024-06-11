import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { InternalServerErrorException, NotImplementedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { courseFactory, setupEntities, userFactory } from '@shared/testing';
// IMPORTANT: RuleManager has to be imported before the rules to prevent import cycles!
import { RuleManager } from '.';
import { AuthorizationContextBuilder } from '../mapper';
import {
	BoardNodeRule,
	ContextExternalToolRule,
	CourseGroupRule,
	CourseRule,
	GroupRule,
	LegacySchoolRule,
	LessonRule,
	SchoolExternalToolRule,
	SchoolRule,
	SchoolSystemOptionsRule,
	SubmissionRule,
	SystemRule,
	TaskRule,
	TeamRule,
	UserLoginMigrationRule,
	UserRule,
} from '../rules';

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
	let boardNodeRule: DeepMocked<BoardNodeRule>;
	let contextExternalToolRule: DeepMocked<ContextExternalToolRule>;
	let userLoginMigrationRule: DeepMocked<UserLoginMigrationRule>;
	let schoolRule: DeepMocked<SchoolRule>;
	let groupRule: DeepMocked<GroupRule>;
	let systemRule: DeepMocked<SystemRule>;
	let schoolSystemOptionsRule: DeepMocked<SchoolSystemOptionsRule>;

	beforeAll(async () => {
		await setupEntities();

		const module = await Test.createTestingModule({
			providers: [
				RuleManager,
				{ provide: CourseRule, useValue: createMock<CourseRule>() },
				{ provide: CourseGroupRule, useValue: createMock<CourseGroupRule>() },
				{ provide: GroupRule, useValue: createMock<GroupRule>() },
				{ provide: LessonRule, useValue: createMock<LessonRule>() },
				{ provide: LegacySchoolRule, useValue: createMock<LegacySchoolRule>() },
				{ provide: UserRule, useValue: createMock<UserRule>() },
				{ provide: TaskRule, useValue: createMock<TaskRule>() },
				{ provide: TeamRule, useValue: createMock<TeamRule>() },
				{ provide: SubmissionRule, useValue: createMock<SubmissionRule>() },
				{ provide: SchoolExternalToolRule, useValue: createMock<SchoolExternalToolRule>() },
				{ provide: BoardNodeRule, useValue: createMock<BoardNodeRule>() },
				{ provide: ContextExternalToolRule, useValue: createMock<ContextExternalToolRule>() },
				{ provide: UserLoginMigrationRule, useValue: createMock<UserLoginMigrationRule>() },
				{ provide: SchoolRule, useValue: createMock<SchoolRule>() },
				{ provide: SystemRule, useValue: createMock<SystemRule>() },
				{ provide: SchoolSystemOptionsRule, useValue: createMock<SchoolSystemOptionsRule>() },
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
		boardNodeRule = await module.get(BoardNodeRule);
		contextExternalToolRule = await module.get(ContextExternalToolRule);
		userLoginMigrationRule = await module.get(UserLoginMigrationRule);
		schoolRule = await module.get(SchoolRule);
		groupRule = await module.get(GroupRule);
		systemRule = await module.get(SystemRule);
		schoolSystemOptionsRule = await module.get(SchoolSystemOptionsRule);
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
				boardNodeRule.isApplicable.mockReturnValueOnce(false);
				contextExternalToolRule.isApplicable.mockReturnValueOnce(false);
				userLoginMigrationRule.isApplicable.mockReturnValueOnce(false);
				schoolRule.isApplicable.mockReturnValueOnce(false);
				groupRule.isApplicable.mockReturnValueOnce(false);
				systemRule.isApplicable.mockReturnValueOnce(false);
				schoolSystemOptionsRule.isApplicable.mockReturnValueOnce(false);

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
				expect(boardNodeRule.isApplicable).toBeCalled();
				expect(contextExternalToolRule.isApplicable).toBeCalled();
				expect(userLoginMigrationRule.isApplicable).toBeCalled();
				expect(schoolRule.isApplicable).toBeCalled();
				expect(groupRule.isApplicable).toBeCalled();
				expect(systemRule.isApplicable).toBeCalled();
				expect(schoolSystemOptionsRule.isApplicable).toBeCalled();
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
				boardNodeRule.isApplicable.mockReturnValueOnce(false);
				contextExternalToolRule.isApplicable.mockReturnValueOnce(false);
				userLoginMigrationRule.isApplicable.mockReturnValueOnce(false);
				schoolRule.isApplicable.mockReturnValueOnce(false);
				groupRule.isApplicable.mockReturnValueOnce(false);
				systemRule.isApplicable.mockReturnValueOnce(false);
				schoolSystemOptionsRule.isApplicable.mockReturnValueOnce(false);

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
				boardNodeRule.isApplicable.mockReturnValueOnce(false);
				contextExternalToolRule.isApplicable.mockReturnValueOnce(false);
				userLoginMigrationRule.isApplicable.mockReturnValueOnce(false);
				schoolRule.isApplicable.mockReturnValueOnce(false);
				groupRule.isApplicable.mockReturnValueOnce(false);
				systemRule.isApplicable.mockReturnValueOnce(false);
				schoolSystemOptionsRule.isApplicable.mockReturnValueOnce(false);

				return { user, object, context };
			};

			it('should throw InternalServerErrorException', () => {
				const { user, object, context } = setup();

				expect(() => service.selectRule(user, object, context)).toThrow(InternalServerErrorException);
			});
		});
	});
});
