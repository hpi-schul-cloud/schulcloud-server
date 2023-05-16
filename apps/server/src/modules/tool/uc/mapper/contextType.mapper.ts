import { AllowedAuthorizationObjectType } from '@src/modules/authorization';
import { ToolContextType } from '../../interface';

const typeMapping: Record<ToolContextType, AllowedAuthorizationObjectType> = {
	[ToolContextType.COURSE]: AllowedAuthorizationObjectType.Course,
};

export class ContextTypeMapper {
	static mapContextTypeToAllowedAuthorizationEntityType(type: ToolContextType): AllowedAuthorizationObjectType {
		return typeMapping[type];
	}
}
