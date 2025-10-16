import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory } from '@modules/course/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { InternalServerErrorException, NotImplementedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { RuleManager } from '.';
import { AuthorizationContextBuilder } from '../mapper';
import { AuthorizationInjectionService } from './authorization-injection.service';

describe('RuleManager', () => {
	let service: RuleManager;
	let injectionService: DeepMocked<AuthorizationInjectionService>;

	beforeAll(async () => {
		await setupEntities([User, CourseEntity, CourseGroupEntity]);

		const module = await Test.createTestingModule({
			providers: [
				RuleManager,
				{ provide: AuthorizationInjectionService, useValue: createMock<AuthorizationInjectionService>() },
			],
		}).compile();

		service = await module.get(RuleManager);
		injectionService = module.get(AuthorizationInjectionService);
	});

	afterEach(() => {
		injectionService.getAuthorizationRules.mockReset();
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
				const object = courseEntityFactory.build();
				const context = AuthorizationContextBuilder.read([]);

				const applicableRule = buildApplicableRule();
				const notApplicableRule = buildNotApplicableRule();

				injectionService.getAuthorizationRules.mockReturnValueOnce([applicableRule, notApplicableRule]);

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
				const object = courseEntityFactory.build();
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
				const object = courseEntityFactory.build();
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
});
