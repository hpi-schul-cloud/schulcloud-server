import { ListObjectsV2CommandOutput } from '@aws-sdk/client-s3';
import { Factory } from 'fishery';

export const createListObjectsV2CommandOutput = Factory.define<ListObjectsV2CommandOutput>(() => {
	return {
		$metadata: {},
	};
});
