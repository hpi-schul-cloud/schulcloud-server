import { AllowedAuthorizationEntityType } from '@src/modules/authorization';
import { ToolContextType } from '../interface';

const typeMapping: Record<ToolContextType, AllowedAuthorizationEntityType> = {
	[ToolContextType.COURSE]: AllowedAuthorizationEntityType.Course,
};

export class ContextTypeMapper {
	static mapContextTypeToAllowedAuthorizationEntityType(type: ToolContextType): AllowedAuthorizationEntityType {
		return typeMapping[type];
	}
}
