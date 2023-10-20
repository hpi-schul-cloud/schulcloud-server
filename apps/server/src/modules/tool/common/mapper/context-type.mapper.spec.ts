import { AuthorizableReferenceType } from '@src/modules/authorization/domain';
import { ToolContextType } from '../enum';
import { ContextTypeMapper } from './context-type.mapper';

describe('context-type.mapper', () => {
	it('should map ToolContextType.COURSE to AuthorizableReferenceType.Course', () => {
		const mappedCourse = ContextTypeMapper.mapContextTypeToAllowedAuthorizationEntityType(ToolContextType.COURSE);

		expect(mappedCourse).toEqual(AuthorizableReferenceType.Course);
	});
});
