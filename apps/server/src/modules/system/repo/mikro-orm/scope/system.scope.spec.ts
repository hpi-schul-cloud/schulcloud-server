import { ObjectId } from '@mikro-orm/mongodb';
import { EmptyResultQuery } from '@shared/repo/query';
import { SystemType } from '../../../domain';
import { SystemScope } from './system.scope';

describe(SystemScope.name, () => {
	describe('byIds', () => {
		describe('when filtering by ids', () => {
			it('should have a query for ids', () => {
				const ids = [new ObjectId().toHexString(), new ObjectId().toHexString()];

				const scope = new SystemScope().byIds(ids);

				expect(scope.query).toEqual({ id: { $in: ids } });
			});
		});

		describe('when not providing ids', () => {
			it('should not add a query', () => {
				const scope = new SystemScope().byIds(undefined);

				expect(scope.query).toEqual(EmptyResultQuery);
			});
		});
	});

	describe('byTypes', () => {
		describe('when filtering by types', () => {
			it('should have a query for types', () => {
				const types = [SystemType.LDAP, SystemType.OAUTH];

				const scope = new SystemScope().byTypes(types);

				expect(scope.query).toEqual({ type: { $in: types } });
			});
		});

		describe('when not providing types', () => {
			it('should not add a query', () => {
				const scope = new SystemScope().byTypes(undefined);

				expect(scope.query).toEqual(EmptyResultQuery);
			});
		});
	});
});
