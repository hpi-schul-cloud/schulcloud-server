import { SchoolExternalTool } from '@shared/domain';
import { schoolExternalToolFactory } from '@shared/testing';
import { ContextExternalToolScope } from './context-external-tool.scope';

describe('CourseExternalToolScope', () => {
	let scope: ContextExternalToolScope;

	beforeEach(() => {
		scope = new ContextExternalToolScope();
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
