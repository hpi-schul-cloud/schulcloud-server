import { ToolContextType } from '@modules/tool/common/enum';
import { SchoolExternalToolEntity } from '@modules/tool/school-external-tool/entity';
import { schoolExternalToolEntityFactory } from '@modules/tool/school-external-tool/testing';
import { ContextExternalToolScope } from './context-external-tool.scope';

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
				const schoolExternalToolEntity: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId();

				scope.byId(schoolExternalToolEntity.id);

				expect(scope.query).toEqual({ id: schoolExternalToolEntity.id });
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
				const schoolExternalToolEntity: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId();

				scope.bySchoolToolId(schoolExternalToolEntity.id);

				expect(scope.query).toEqual({ schoolTool: schoolExternalToolEntity.id });
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
				const schoolExternalToolEntity: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId();

				scope.byContextId(schoolExternalToolEntity.id);

				expect(scope.query).toEqual({ contextId: schoolExternalToolEntity.id });
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
