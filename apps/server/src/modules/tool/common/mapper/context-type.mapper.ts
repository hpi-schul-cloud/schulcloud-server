import { AuthorizableReferenceType } from '@modules/authorization/types';
import { ToolContextType } from '../enum';

const typeMapping: Record<ToolContextType, AuthorizableReferenceType> = {
	[ToolContextType.COURSE]: AuthorizableReferenceType.Course,
};

export class ContextTypeMapper {
	static mapContextTypeToAllowedAuthorizationEntityType(type: ToolContextType): AuthorizableReferenceType {
		return typeMapping[type];
	}
}
