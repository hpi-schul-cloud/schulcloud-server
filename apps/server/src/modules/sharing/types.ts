import { EntityId, ShareTokenString, ShareTokenContextType, ShareTokenParentType } from '@shared/domain';

export type ShareTokenPayload = {
	id: EntityId;
	type: ShareTokenParentType;
};

export type ShareTokenContext = {
	id: EntityId;
	type: ShareTokenContextType;
};

export type ShareToken = {
	token: ShareTokenString;
	payload: ShareTokenPayload;
	expiresAt?: Date;
	context?: ShareTokenContext;
};
