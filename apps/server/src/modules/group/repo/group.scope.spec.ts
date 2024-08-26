import { ObjectId } from '@mikro-orm/mongodb';
import { GroupEntityTypes } from '../entity';
import { GroupScope } from './group.scope';

describe(GroupScope.name, () => {
	let scope: GroupScope;

	beforeEach(() => {
		scope = new GroupScope();
		scope.allowEmptyQuery(true);
	});

	describe('byTypes', () => {
		describe('when types is undefined', () => {
			it('should not add query', () => {
				scope.byTypes(undefined);

				expect(scope.query).toEqual({});
			});
		});

		describe('when types is defined', () => {
			it('should add query', () => {
				scope.byTypes([GroupEntityTypes.COURSE, GroupEntityTypes.CLASS]);

				expect(scope.query).toEqual({ type: { $in: [GroupEntityTypes.COURSE, GroupEntityTypes.CLASS] } });
			});
		});
	});

	describe('byOrganizationId', () => {
		describe('when id is undefined', () => {
			it('should not add query', () => {
				scope.byOrganizationId(undefined);

				expect(scope.query).toEqual({});
			});
		});

		describe('when id is defined', () => {
			const setup = () => {
				return {
					id: new ObjectId().toHexString(),
				};
			};

			it('should add query', () => {
				const { id } = setup();

				scope.byOrganizationId(id);

				expect(scope.query).toEqual({ organization: id });
			});
		});
	});

	describe('bySystemId', () => {
		describe('when id is undefined', () => {
			it('should not add query', () => {
				scope.bySystemId(undefined);

				expect(scope.query).toEqual({});
			});
		});

		describe('when id is defined', () => {
			const setup = () => {
				return {
					id: new ObjectId().toHexString(),
				};
			};

			it('should add query', () => {
				const { id } = setup();

				scope.bySystemId(id);

				expect(scope.query).toEqual({ externalSource: { system: new ObjectId(id) } });
			});
		});
	});

	describe('byUserId', () => {
		describe('when id is undefined', () => {
			it('should not add query', () => {
				scope.byUserId(undefined);

				expect(scope.query).toEqual({});
			});
		});

		describe('when id is defined', () => {
			const setup = () => {
				return {
					id: new ObjectId().toHexString(),
				};
			};

			it('should add query', () => {
				const { id } = setup();

				scope.byUserId(id);

				expect(scope.query).toEqual({ users: { user: new ObjectId(id) } });
			});
		});
	});
});
