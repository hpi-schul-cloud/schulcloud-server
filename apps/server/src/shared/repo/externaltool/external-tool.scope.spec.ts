import { ExternalToolScope } from '@shared/repo/externaltool/external-tool.scope';

describe('ExternalToolScope', () => {
	let scope: ExternalToolScope;

	beforeEach(() => {
		scope = new ExternalToolScope().allowEmptyQuery(true);
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
