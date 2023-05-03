import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { InternalServerErrorException, NotImplementedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { courseFactory, setupEntities, userFactory } from '@shared/testing';
import {
	BoardNodeRule,
	CourseGroupRule,
	CourseRule,
	LessonRule,
	SchoolExternalToolRule,
	SchoolRule,
	SubmissionRule,
	TaskCardRule,
	TaskRule,
	TeamRule,
	UserRule,
} from '../../shared/domain/rules';
import { AuthorizationContextBuilder } from './authorization-context.builder';
import { RuleManager } from './rule-manager';

describe('RuleManager', () => {
	let service: RuleManager;
	let courseRule: DeepMocked<CourseRule>;
	let courseGroupRule: DeepMocked<CourseGroupRule>;
	let lessonRule: DeepMocked<LessonRule>;
	let schoolRule: DeepMocked<SchoolRule>;
	let userRule: DeepMocked<UserRule>;
	let taskRule: DeepMocked<TaskRule>;
	let taskCardRule: DeepMocked<TaskCardRule>;
	let teamRule: DeepMocked<TeamRule>;
	let submissionRule: DeepMocked<SubmissionRule>;
	let schoolExternalToolRule: DeepMocked<SchoolExternalToolRule>;
	let boardNodeRule: DeepMocked<BoardNodeRule>;

	beforeAll(async () => {
		await setupEntities();

		const module = await Test.createTestingModule({
			providers: [
				RuleManager,
				{ provide: CourseRule, useValue: createMock<CourseRule>() },
				{ provide: CourseGroupRule, useValue: createMock<CourseGroupRule>() },
				{ provide: LessonRule, useValue: createMock<LessonRule>() },
				{ provide: SchoolRule, useValue: createMock<SchoolRule>() },
				{ provide: UserRule, useValue: createMock<UserRule>() },
				{ provide: TaskRule, useValue: createMock<TaskRule>() },
				{ provide: TaskCardRule, useValue: createMock<TaskCardRule>() },
				{ provide: TeamRule, useValue: createMock<TeamRule>() },
				{ provide: SubmissionRule, useValue: createMock<SubmissionRule>() },
				{ provide: SchoolExternalToolRule, useValue: createMock<SchoolExternalToolRule>() },
				{ provide: BoardNodeRule, useValue: createMock<BoardNodeRule>() },
			],
		}).compile();

		service = await module.get(RuleManager);
		courseRule = await module.get(CourseRule);
		courseGroupRule = await module.get(CourseGroupRule);
		lessonRule = await module.get(LessonRule);
		schoolRule = await module.get(SchoolRule);
		userRule = await module.get(UserRule);
		taskRule = await module.get(TaskRule);
		taskCardRule = await module.get(TaskCardRule);
		teamRule = await module.get(TeamRule);
		submissionRule = await module.get(SubmissionRule);
		schoolExternalToolRule = await module.get(SchoolExternalToolRule);
		boardNodeRule = await module.get(BoardNodeRule);
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
				schoolRule.isApplicable.mockReturnValueOnce(false);
				userRule.isApplicable.mockReturnValueOnce(false);
				taskRule.isApplicable.mockReturnValueOnce(false);
				taskCardRule.isApplicable.mockReturnValueOnce(false);
				teamRule.isApplicable.mockReturnValueOnce(false);
				submissionRule.isApplicable.mockReturnValueOnce(false);
				schoolExternalToolRule.isApplicable.mockReturnValueOnce(false);
				boardNodeRule.isApplicable.mockReturnValueOnce(false);

				return { user, object, context };
			};

			it('should call isApplicable on all rules', () => {
				const { user, object, context } = setup();

				service.selectRule(user, object, context);

				expect(courseRule.isApplicable).toBeCalled();
				expect(courseGroupRule.isApplicable).toBeCalled();
				expect(lessonRule.isApplicable).toBeCalled();
				expect(schoolRule.isApplicable).toBeCalled();
				expect(userRule.isApplicable).toBeCalled();
				expect(taskRule.isApplicable).toBeCalled();
				expect(taskCardRule.isApplicable).toBeCalled();
				expect(teamRule.isApplicable).toBeCalled();
				expect(submissionRule.isApplicable).toBeCalled();
				expect(schoolExternalToolRule.isApplicable).toBeCalled();
				expect(boardNodeRule.isApplicable).toBeCalled();
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
				schoolRule.isApplicable.mockReturnValueOnce(false);
				userRule.isApplicable.mockReturnValueOnce(false);
				taskRule.isApplicable.mockReturnValueOnce(false);
				taskCardRule.isApplicable.mockReturnValueOnce(false);
				teamRule.isApplicable.mockReturnValueOnce(false);
				submissionRule.isApplicable.mockReturnValueOnce(false);
				schoolExternalToolRule.isApplicable.mockReturnValueOnce(false);
				boardNodeRule.isApplicable.mockReturnValueOnce(false);

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
				schoolRule.isApplicable.mockReturnValueOnce(false);
				userRule.isApplicable.mockReturnValueOnce(false);
				taskRule.isApplicable.mockReturnValueOnce(false);
				taskCardRule.isApplicable.mockReturnValueOnce(false);
				teamRule.isApplicable.mockReturnValueOnce(false);
				submissionRule.isApplicable.mockReturnValueOnce(false);
				schoolExternalToolRule.isApplicable.mockReturnValueOnce(false);
				boardNodeRule.isApplicable.mockReturnValueOnce(false);

				return { user, object, context };
			};

			it('should throw InternalServerErrorException', () => {
				const { user, object, context } = setup();

				expect(() => service.selectRule(user, object, context)).toThrow(InternalServerErrorException);
			});
		});
	});
});
