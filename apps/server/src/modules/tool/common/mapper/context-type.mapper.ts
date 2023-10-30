import { AuthorizableReferenceType } from '@src/modules/authorization/types/allowed-authorization-object-type.enum';
import { ToolContextType } from '../enum/tool-context-type.enum';

const typeMapping: Record<ToolContextType, AuthorizableReferenceType> = {
	[ToolContextType.COURSE]: AuthorizableReferenceType.Course,
	[ToolContextType.BOARD_ELEMENT]: AuthorizableReferenceType.BoardNode,
};

export class ContextTypeMapper {
	static mapContextTypeToAllowedAuthorizationEntityType(type: ToolContextType): AuthorizableReferenceType {
		return typeMapping[type];
	}
}
