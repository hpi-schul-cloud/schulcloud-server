import { SchoolExternalTool } from '@shared/domain';
import { schoolExternalToolFactory } from '@shared/testing';
import { ContextExternalToolScope } from './context-external-tool.scope';
import { ToolContextType } from '../../../modules/tool/interface';

describe('CourseExternalToolScope', () => {
	let scope: ContextExternalToolScope;

	beforeEach(() => {
		scope = new ContextExternalToolScope();
		scope.allowEmptyQuery(true);
	});

	describe('byId is called', () => {
		describe('when id parameter is undefined', () => {
			it('should return scope without added id to query', () => {
				scope.byId(undefined);
				expect(scope.query).toEqual({});
			});
		});

		describe('when id parameter is defined', () => {
			it('should return scope with added id to query', () => {
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();

				scope.byId(schoolExternalTool.id);

				expect(scope.query).toEqual({ id: schoolExternalTool.id });
			});
		});
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

	describe('byContextId is called', () => {
		describe('when contextId parameter is undefined', () => {
			it('should return scope without added contextId to query', () => {
				scope.byContextId(undefined);
				expect(scope.query).toEqual({});
			});
		});

		describe('when contextId parameter is defined', () => {
			it('should return scope with added contextId to query', () => {
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();

				scope.byContextId(schoolExternalTool.id);

				expect(scope.query).toEqual({ contextId: schoolExternalTool.id });
			});
		});
	});

	describe('byContextType is called', () => {
		describe('when contextType parameter is undefined', () => {
			it('should return scope without added contextType to query', () => {
				scope.byContextType(undefined);
				expect(scope.query).toEqual({});
			});
		});

		describe('when contextType parameter is defined', () => {
			it('should return scope with added contextType to query', () => {
				scope.byContextType(ToolContextType.COURSE);
				expect(scope.query).toEqual({ contextType: 'course' });
			});
		});
	});
});
