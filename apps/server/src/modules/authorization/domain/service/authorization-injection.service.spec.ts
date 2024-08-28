import { AuthorizableReferenceType, AuthorizationLoaderService, Rule } from '../type';
import { AuthorizationInjectionService } from './authorization-injection.service';

function createRuleMock(isApplicable: boolean, hasPermission: boolean): Rule {
	return {
		isApplicable: jest.fn().mockReturnValue(isApplicable),
		hasPermission: jest.fn().mockReturnValue(hasPermission),
	};
}

function createReferenceLoaderMock(): AuthorizationLoaderService {
	return {
		findById: jest.fn().mockResolvedValue({}),
	};
}

describe(AuthorizationInjectionService.name, () => {
	describe('injectAuthorizationRule', () => {
		it('should add rule to authorizationRules', () => {
			const service = new AuthorizationInjectionService();
			const ruleMock: Rule = createRuleMock(true, true);

			service.injectAuthorizationRule(ruleMock);

			expect(service.getAuthorizationRules()).toContain(ruleMock);
		});
	});

	describe('injectReferenceLoader', () => {
		it('should add reference loader to referenceLoaders', () => {
			const service = new AuthorizationInjectionService();
			const referenceLoaderMock = createReferenceLoaderMock();

			service.injectReferenceLoader(AuthorizableReferenceType.BoardNode, referenceLoaderMock);

			expect(service.getReferenceLoader(AuthorizableReferenceType.BoardNode)).toBe(referenceLoaderMock);
		});
	});

	describe('shouldPopulate', () => {
		describe('when referenceType is set to populate', () => {
			it('should return true', () => {
				const service = new AuthorizationInjectionService();

				service.injectReferenceLoader(AuthorizableReferenceType.BoardNode, createReferenceLoaderMock(), true);

				expect(service.shouldPopulate(AuthorizableReferenceType.BoardNode)).toBe(true);
			});
		});

		describe('when referenceType is set to not populate', () => {
			it('should return false', () => {
				const service = new AuthorizationInjectionService();

				service.injectReferenceLoader(AuthorizableReferenceType.BoardNode, createReferenceLoaderMock(), false);

				expect(service.shouldPopulate(AuthorizableReferenceType.BoardNode)).toBe(false);
			});
		});

		describe('when referenceType is not set', () => {
			it('should return false', () => {
				const service = new AuthorizationInjectionService();

				expect(service.shouldPopulate(AuthorizableReferenceType.BoardNode)).toBe(false);
			});
		});
	});
});
