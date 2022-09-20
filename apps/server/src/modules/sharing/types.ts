import { EntityId, ShareToken, ShareTokenContextType, ShareTokenParentType } from '@shared/domain';

export type ShareTokenPayload = {
	id: EntityId;
	type: ShareTokenParentType;
};

export type ShareTokenContext = {
	id: EntityId;
	type: ShareTokenContextType;
};

export type Shareable = {
	token: ShareToken;
	payload: ShareTokenPayload;
	expiresAt?: Date;
	context?: ShareTokenContext;
};
