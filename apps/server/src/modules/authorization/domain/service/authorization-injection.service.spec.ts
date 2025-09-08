import { AuthorizableReferenceType, AuthorizationLoaderService, CurrentUserLoader, Rule } from '../type';
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

function createCurrentUserLoaderMock(): CurrentUserLoader {
	return {
		loadCurrentUserWithPermissions: jest.fn().mockResolvedValue({}),
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

	describe('injectCurrentUserLoader', () => {
		it('should set currentUserLoader', () => {
			const service = new AuthorizationInjectionService();
			const userLoaderMock = createCurrentUserLoaderMock();

			service.injectCurrentUserLoader(userLoaderMock);

			expect(service.getCurrentUserLoader()).toBe(userLoaderMock);
		});
	});

	describe('getCurrentUserLoader', () => {
		describe('when currentUserLoader is not injected', () => {
			it('should throw InternalServerErrorException', () => {
				const service = new AuthorizationInjectionService();

				expect(() => service.getCurrentUserLoader()).toThrow();
			});
		});

		describe('when currentUserLoader is injected', () => {
			it('should return currentUserLoader', () => {
				const service = new AuthorizationInjectionService();
				const userLoaderMock = createCurrentUserLoaderMock();

				service.injectCurrentUserLoader(userLoaderMock);

				expect(service.getCurrentUserLoader()).toBe(userLoaderMock);
			});
		});
	});
});
