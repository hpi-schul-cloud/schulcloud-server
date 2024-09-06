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
	InstanceRule,
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
import { ExternalToolRule } from '../rules/external-tool.rule';
import { AuthorizationInjectionService } from './authorization-injection.service';

describe('RuleManager', () => {
	let service: RuleManager;
	let injectionService: DeepMocked<AuthorizationInjectionService>;
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
	let externalToolRule: DeepMocked<ExternalToolRule>;
	let instanceRule: DeepMocked<InstanceRule>;

	beforeAll(async () => {
		await setupEntities();

		const module = await Test.createTestingModule({
			providers: [
				RuleManager,
				{ provide: AuthorizationInjectionService, useValue: createMock<AuthorizationInjectionService>() },
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
				{ provide: ExternalToolRule, useValue: createMock<ExternalToolRule>() },
				{ provide: InstanceRule, useValue: createMock<InstanceRule>() },
			],
		}).compile();

		service = await module.get(RuleManager);
		injectionService = module.get(AuthorizationInjectionService);
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
		externalToolRule = await module.get(ExternalToolRule);
		instanceRule = await module.get(InstanceRule);
	});

	afterAll(() => {
		jest.resetAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('selectRule', () => {
		const buildRule = (isApplicable: boolean) => {
			return { isApplicable: jest.fn().mockReturnValue(isApplicable), hasPermission: jest.fn() };
		};

		const buildApplicableRule = () => buildRule(true);
		const buildNotApplicableRule = () => buildRule(false);

		describe('when one Rule is applicable', () => {
			const setup = () => {
				const user = userFactory.build();
				const object = courseFactory.build();
				const context = AuthorizationContextBuilder.read([]);

				const applicableRule = buildApplicableRule();
				const notApplicableRule = buildNotApplicableRule();

				injectionService.getAuthorizationRules.mockReturnValue([applicableRule, notApplicableRule]);

				return { user, object, context, applicableRule, notApplicableRule };
			};

			it('should call isApplicable on all rules', () => {
				const { user, object, context, applicableRule, notApplicableRule } = setup();

				service.selectRule(user, object, context);

				expect(applicableRule.isApplicable).toBeCalled();
				expect(notApplicableRule.isApplicable).toBeCalled();
			});

			it('should return Applicable Rule', () => {
				const { user, object, context, applicableRule } = setup();

				const result = service.selectRule(user, object, context);

				expect(result).toEqual(applicableRule);
			});
		});

		describe('when no rule is applicable', () => {
			const setup = () => {
				const user = userFactory.build();
				const object = courseFactory.build();
				const context = AuthorizationContextBuilder.read([]);

				injectionService.getAuthorizationRules.mockReturnValueOnce([
					buildNotApplicableRule(),
					buildNotApplicableRule(),
				]);

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

				injectionService.getAuthorizationRules.mockReturnValueOnce([buildApplicableRule(), buildApplicableRule()]);

				return { user, object, context };
			};

			it('should throw InternalServerErrorException', () => {
				const { user, object, context } = setup();

				expect(() => service.selectRule(user, object, context)).toThrow(InternalServerErrorException);
			});
		});
	});

	describe('currently, most of the Rules are injected into the AuthorizationInjectionService by the RuleManager. In the future, these should go into the modules instead', () => {
		it('should inject CourseRule', () => {
			expect(injectionService.injectAuthorizationRule).toHaveBeenCalledWith(courseRule);
		});

		it('should inject CourseGroupRule', () => {
			expect(injectionService.injectAuthorizationRule).toBeCalledWith(courseGroupRule);
		});

		it('should inject LessonRule', () => {
			expect(injectionService.injectAuthorizationRule).toBeCalledWith(lessonRule);
		});

		it('should inject LegacySchoolRule', () => {
			expect(injectionService.injectAuthorizationRule).toBeCalledWith(legacySchoolRule);
		});

		it('should inject UserRule', () => {
			expect(injectionService.injectAuthorizationRule).toBeCalledWith(userRule);
		});

		it('should inject TaskRule', () => {
			expect(injectionService.injectAuthorizationRule).toBeCalledWith(taskRule);
		});

		it('should inject TeamRule', () => {
			expect(injectionService.injectAuthorizationRule).toBeCalledWith(teamRule);
		});

		it('should inject SubmissionRule', () => {
			expect(injectionService.injectAuthorizationRule).toBeCalledWith(submissionRule);
		});

		it('should inject SchoolExternalToolRule', () => {
			expect(injectionService.injectAuthorizationRule).toBeCalledWith(schoolExternalToolRule);
		});

		it('should inject BoardNodeRule', () => {
			expect(injectionService.injectAuthorizationRule).toBeCalledWith(boardNodeRule);
		});

		it('should inject ContextExternalToolRule', () => {
			expect(injectionService.injectAuthorizationRule).toBeCalledWith(contextExternalToolRule);
		});

		it('should inject UserLoginMigrationRule', () => {
			expect(injectionService.injectAuthorizationRule).toBeCalledWith(userLoginMigrationRule);
		});

		it('should inject SchoolRule', () => {
			expect(injectionService.injectAuthorizationRule).toBeCalledWith(schoolRule);
		});

		it('should inject GroupRule', () => {
			expect(injectionService.injectAuthorizationRule).toBeCalledWith(groupRule);
		});

		it('should inject SystemRule', () => {
			expect(injectionService.injectAuthorizationRule).toBeCalledWith(systemRule);
		});

		it('should inject SchoolSystemOptionsRule', () => {
			expect(injectionService.injectAuthorizationRule).toBeCalledWith(schoolSystemOptionsRule);
		});

		it('should inject ExternalToolRule', () => {
			expect(injectionService.injectAuthorizationRule).toBeCalledWith(externalToolRule);
		});
	});
});
