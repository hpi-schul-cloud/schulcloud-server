import { Factory } from 'fishery';
import { BiloMediaQueryBodyParams } from '../request';
import { BiloMediaQueryResponse } from '../response';
import { biloMediaQueryDataResponseFactory } from './bilo-media-query-data.response.factory';

export const biloMediaQueryResponseFactory = Factory.define<BiloMediaQueryResponse>(({ sequence }) => {
	const mediumId = `medium-id-${sequence}`;

	const query: BiloMediaQueryBodyParams = {
		id: mediumId,
	};

	const response: BiloMediaQueryResponse = {
		status: 200,
		data: biloMediaQueryDataResponseFactory.build({ id: mediumId }),
		query,
	};

	return response;
});
