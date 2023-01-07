import { SchoolExternalToolScope } from './school-external-tool.scope';
import { schoolFactory } from '../../testing';
import { School } from '../../domain';

describe('SchoolExternalToolScope', () => {
	let scope: SchoolExternalToolScope;

	beforeEach(() => {
		scope = new SchoolExternalToolScope();
		scope.allowEmptyQuery(true);
	});

	describe('bySchool is called', () => {
		describe('when school parameter is undefined', () => {
			it('should return scope without added schoolId to query', () => {
				scope.bySchoolId(undefined);
				expect(scope.query).toEqual({});
			});
		});

		describe('when school parameter is defined', () => {
			it('should return scope with added schoolId to query', () => {
				const school: School = schoolFactory.buildWithId();

				scope.bySchoolId(school._id.toString());

				expect(scope.query).toEqual({ school: school._id.toString() });
			});
		});
	});
});
