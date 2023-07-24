import { ObjectId } from '@mikro-orm/mongodb';
import { SchoolExternalToolScope } from './school-external-tool.scope';

describe('SchoolExternalToolScope', () => {
	let scope: SchoolExternalToolScope;

	beforeEach(() => {
		scope = new SchoolExternalToolScope();
		scope.allowEmptyQuery(true);
	});

	describe('bySchool', () => {
		describe('when school parameter is undefined', () => {
			it('should return scope without added schoolId to query', () => {
				scope.bySchoolId(undefined);
				expect(scope.query).toEqual({});
			});
		});

		describe('when school parameter is defined', () => {
			it('should return scope with added schoolId to query', () => {
				const id: string = new ObjectId().toHexString();

				scope.bySchoolId(id);

				expect(scope.query).toEqual({ school: id });
			});
		});
	});

	describe('byTool', () => {
		describe('when tool parameter is undefined', () => {
			it('should return scope without added toolId to query', () => {
				scope.byToolId(undefined);
				expect(scope.query).toEqual({});
			});
		});

		describe('when tool parameter is defined', () => {
			it('should return scope with added toolId to query', () => {
				const id: string = new ObjectId().toHexString();

				scope.byToolId(id);

				expect(scope.query).toEqual({ tool: id });
			});
		});
	});
});
