import { EntityId, ShareTokenString, ShareTokenContextType, ShareTokenParentType } from '@shared/domain';

export type ShareTokenPayload = {
	parentType: ShareTokenParentType;
	parentId: EntityId;
};

export type ShareTokenContext = {
	contextType: ShareTokenContextType;
	contextId: EntityId;
};
export interface IShareToken {
	token: ShareTokenString;
	payload: ShareTokenPayload;
	expiresAt?: Date;
	context?: ShareTokenContext;
}
