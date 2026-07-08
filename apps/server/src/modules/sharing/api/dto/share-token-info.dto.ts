import { type ShareTokenParentType } from '../../domainobject/share-token.do';

export interface ShareTokenInfoDto {
	token: string;
	parentType: ShareTokenParentType;
	parentName: string;
}
