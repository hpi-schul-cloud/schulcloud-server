import { ObjectId } from '@mikro-orm/mongodb';
import { ClassScope } from './class.scope';

describe(ClassScope.name, () => {
	let scope: ClassScope;

	beforeEach(() => {
		scope = new ClassScope();
		scope.allowEmptyQuery(true);
	});

	describe('bySchoolId', () => {
		describe('when school id is undefined', () => {
			it('should not add query', () => {
				scope.bySchoolId(undefined);

				expect(scope.query).toEqual({});
			});
		});

		describe('when school id is defined', () => {
			it('should add query', () => {
				const id = new ObjectId().toHexString();

				scope.bySchoolId(id);

				expect(scope.query).toEqual({ schoolId: new ObjectId(id) });
			});
		});
	});

	describe('byUserId', () => {
		describe('when user id is undefined', () => {
			it('should not add query', () => {
				scope.byUserId(undefined);

				expect(scope.query).toEqual({});
			});
		});

		describe('when user id is defined', () => {
			it('should add query', () => {
				const id = new ObjectId().toHexString();

				scope.byUserId(id);

				expect(scope.query).toEqual({ $or: [{ userIds: new ObjectId(id) }, { teacherIds: new ObjectId(id) }] });
			});
		});
	});
});
