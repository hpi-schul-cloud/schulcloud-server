import { AuthorizableReferenceType } from '@src/modules/authorization/types';
import { ToolContextType } from '../../interface';

const typeMapping: Record<ToolContextType, AuthorizableReferenceType> = {
	[ToolContextType.COURSE]: AuthorizableReferenceType.Course,
};

export class ContextTypeMapper {
	static mapContextTypeToAllowedAuthorizationEntityType(type: ToolContextType): AuthorizableReferenceType {
		return typeMapping[type];
	}
}
