import { schoolExternalToolFactory } from '../../testing';
import { SchoolExternalTool } from '../../domain';
import { CourseExternalToolScope } from './course-external-tool.scope';

describe('CourseExternalToolScope', () => {
	let scope: CourseExternalToolScope;

	beforeEach(() => {
		scope = new CourseExternalToolScope();
		scope.allowEmptyQuery(true);
	});

	describe('bySchoolToolId is called', () => {
		describe('when schoolToolId parameter is undefined', () => {
			it('should return scope without added schoolToolId to query', () => {
				scope.bySchoolToolId(undefined);
				expect(scope.query).toEqual({});
			});
		});

		describe('when schoolToolId parameter is defined', () => {
			it('should return scope with added schoolToolId to query', () => {
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();

				scope.bySchoolToolId(schoolExternalTool.id);

				expect(scope.query).toEqual({ schoolTool: schoolExternalTool.id });
			});
		});
	});
});
