import { ShareTokenParentType } from '@shared/domain';

export interface ShareTokenInfoDto {
	token: string;
	parentType: ShareTokenParentType;
	parentName: string;
}
