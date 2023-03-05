import { CardPayload, CardPayloadProps } from '@shared/domain';
import { BaseFactory } from '../../base.factory';

export const cardPayloadFactory = BaseFactory.define<CardPayload, CardPayloadProps>(CardPayload, ({ sequence }) => {
	return { name: `card #${sequence}`, height: 150 };
});
