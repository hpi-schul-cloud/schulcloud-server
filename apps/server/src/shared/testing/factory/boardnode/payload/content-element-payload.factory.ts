import { ContentElementPayloadProps, ContentElementPlayload } from '@shared/domain';
import { BaseFactory } from '../../base.factory';

export const contentElementPayloadFactory = BaseFactory.define<ContentElementPlayload, ContentElementPayloadProps>(
	ContentElementPlayload,
	({ sequence }) => {
		return { name: `board #${sequence}` };
	}
);
