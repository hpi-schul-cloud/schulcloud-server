import { ObjectId } from '@mikro-orm/mongodb';
import { Factory } from 'fishery';
import { H5PCopyResponse } from '../generated';

export const h5pCopyResponseFactory = Factory.define<H5PCopyResponse>(() => {
	const response: H5PCopyResponse = {
		contentId: new ObjectId().toHexString(),
	};

	return response;
});
