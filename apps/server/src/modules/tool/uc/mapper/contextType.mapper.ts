import { ToolContextType } from '@src/modules/tool/interface';
import { AllowedAuthorizationEntityType } from '@src/modules';

const typeMapping: Record<ToolContextType, AllowedAuthorizationEntityType> = {
	[ToolContextType.COURSE]: AllowedAuthorizationEntityType.Course,
};

export class ContextTypeMapper {
	static mapContextTypeToAllowedAuthorizationEntityType(type: ToolContextType): AllowedAuthorizationEntityType {
		return typeMapping[type];
	}
}
