import { AuthorizableReferenceType } from '@src/modules/authorization/types';
import { ToolContextType } from '../enum';

const typeMapping: Record<ToolContextType, AuthorizableReferenceType> = {
	[ToolContextType.COURSE]: AuthorizableReferenceType.Course,
	[ToolContextType.BOARD_CARD]: AuthorizableReferenceType.BoardNode,
};

export class ContextTypeMapper {
	static mapContextTypeToAllowedAuthorizationEntityType(type: ToolContextType): AuthorizableReferenceType {
		return typeMapping[type];
	}
}
