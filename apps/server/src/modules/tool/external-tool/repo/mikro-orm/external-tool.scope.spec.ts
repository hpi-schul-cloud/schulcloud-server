import { ObjectId } from '@mikro-orm/mongodb';
import { ExternalToolMediumStatus } from '@modules/tool/external-tool/enum';
import { ExternalToolScope } from './external-tool.scope';

describe('ExternalToolScope', () => {
	let scope: ExternalToolScope;

	beforeEach(() => {
		scope = new ExternalToolScope();
		scope.allowEmptyQuery(true);
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

	describe('byClientId', () => {
		describe('when a clientId is defined', () => {
			it('should return scope with clientId query', () => {
				const param = 'Client1';

				scope.byClientId(param);

				expect(scope.query).toEqual({ config: { clientId: param } });
			});
		});

		describe('when no clientId is defined', () => {
			it('should return scope without clientId query', () => {
				scope.byClientId(undefined);

				expect(scope.query).toEqual({});
			});
		});
	});

	describe('byHidden', () => {
		it('should return scope with added isHidden to query', () => {
			const param = true;
			scope.byHidden(param);
			expect(scope.query).toEqual({ isHidden: param });
		});

		it('should return scope without added isHidden to query', () => {
			scope.byHidden(undefined);
			expect(scope.query).toEqual({});
		});
	});

	describe('byIds', () => {
		it('should return scope with added ids to query', () => {
			const param = [new ObjectId().toHexString(), new ObjectId().toHexString()];
			scope.byIds(param);
			expect(scope.query).toEqual({ id: { $in: param } });
		});

		it('should return scope without added ids to query', () => {
			scope.byIds(undefined);
			expect(scope.query).toEqual({});
		});
	});

	describe('byPreferred', () => {
		describe('when the param flag is set to true', () => {
			it('should return scope with added isPreferred to query', () => {
				scope.byPreferred(true);
				expect(scope.query).toEqual({ isPreferred: true });
			});
		});

		describe('when the param flag is set to undefined', () => {
			it('should return scope without added isPreferred to query', () => {
				scope.byPreferred(undefined);
				expect(scope.query).toEqual({});
			});
		});
	});

	describe('allowTemplate', () => {
		describe('when the param flag is set to true', () => {
			it('should return scope which allows medium templates', () => {
				scope.allowTemplate(true);
				expect(scope.query).toEqual({});
			});
		});

		describe('when the param flag is set to falsy', () => {
			it('should return scope which forbids templates and allows non-medium tools', () => {
				scope.allowTemplate(undefined);
				expect(scope.query).toEqual({
					$or: [{ medium: { status: { $not: ExternalToolMediumStatus.TEMPLATE } } }, { medium: { $exists: false } }],
				});
			});
		});
	});

	describe('allowDraft', () => {
		describe('when the param flag is set to true', () => {
			it('should return scope which allows medium drafts', () => {
				scope.allowDraft(true);
				expect(scope.query).toEqual({});
			});
		});

		describe('when the param flag is set to falsy', () => {
			it('should return scope which forbids drafts and allows non-medium tools', () => {
				scope.allowDraft(undefined);
				expect(scope.query).toEqual({
					$or: [{ medium: { status: { $not: ExternalToolMediumStatus.DRAFT } } }, { medium: { $exists: false } }],
				});
			});
		});
	});
});
