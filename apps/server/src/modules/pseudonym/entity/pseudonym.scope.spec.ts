import { ObjectId } from '@mikro-orm/mongodb';
import { UUID } from 'bson';
import { PseudonymScope } from './pseudonym.scope';

describe('PseudonymScope', () => {
	let scope: PseudonymScope;

	beforeEach(() => {
		scope = new PseudonymScope();
		scope.allowEmptyQuery(true);
	});

	describe('byPseudonym', () => {
		it('should return scope with added pseudonym to query', () => {
			const param = UUID.generate().toString();

			scope.byPseudonym(param);

			expect(scope.query).toEqual({ pseudonym: param });
		});

		it('should return scope without added pseudonym to query', () => {
			scope.byPseudonym(undefined);

			expect(scope.query).toEqual({});
		});
	});

	describe('byUserId', () => {
		it('should return scope with added userId to query', () => {
			const param = new ObjectId().toHexString();

			scope.byUserId(param);

			expect(scope.query).toEqual({ userId: new ObjectId(param) });
		});

		it('should return scope without added userId to query', () => {
			scope.byUserId(undefined);

			expect(scope.query).toEqual({});
		});
	});

	describe('byToolId', () => {
		it('should return scope with added toolId to query', () => {
			const param = new ObjectId().toHexString();

			scope.byToolId(param);

			expect(scope.query).toEqual({ toolId: new ObjectId(param) });
		});

		it('should return scope without added toolId to query', () => {
			scope.byToolId(undefined);

			expect(scope.query).toEqual({});
		});
	});
});
