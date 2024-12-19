import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { MediaSourceBasicAuthConfigEmbeddable, MediaSourceBasicAuthConfigEmbeddableProps } from '../entity';

export const mediaSourceBasicConfigEmbeddableFactory = BaseFactory.define<
	MediaSourceBasicAuthConfigEmbeddable,
	MediaSourceBasicAuthConfigEmbeddableProps
>(MediaSourceBasicAuthConfigEmbeddable, ({ sequence }) => {
	return {
		_id: new ObjectId(),
		username: `media-source-client-id-${sequence}`,
		password: `media-source-client-secret-${sequence}`,
		authEndpoint: `media-source-auth-endpoint-${sequence}`,
	};
});
