import { LtiToolScope } from '@shared/repo/ltitool/lti-tool.scope';

describe('LtiToolScope', () => {
	let scope: LtiToolScope;

	beforeEach(() => {
		scope = new LtiToolScope().allowEmptyQuery(true);
	});

	describe('byName', () => {
		it('should return scope with added name to query', () => {
			const param = 'Max*';
			scope.byName(param);
			expect(scope.query).toEqual({ name: { $re: param } });
		});

		it('should return scope without added name to query', () => {
			scope.byName(undefined);
			expect(scope.query).toEqual({});
		});
	});

	describe('byTemplate', () => {
		it('should return scope with added isTemplate to query', () => {
			const param = true;
			scope.byTemplate(param);
			expect(scope.query).toEqual({ isTemplate: param });
		});

		it('should return scope without added isTemplate to query', () => {
			scope.byTemplate(undefined);
			expect(scope.query).toEqual({});
		});
	});

	describe('byHidden', () => {
		it('should return scope with added isHidden to query', () => {
			const param = true;
			scope.byHidden(param);
			expect(scope.query).toEqual({ isHidden: param });
		});

		it('should return scope without added isTemplate to query', () => {
			scope.byHidden(undefined);
			expect(scope.query).toEqual({});
		});
	});
});
