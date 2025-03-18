import { ListObjectsV2CommandOutput } from '@aws-sdk/client-s3';
import { Factory } from 'fishery';

export const createListObjectsV2CommandOutput = Factory.define<ListObjectsV2CommandOutput>(
	({ params }): ListObjectsV2CommandOutput => {
		return {
			Contents: params.contents,
			IsTruncated: false,
			KeyCount: params.contents.length,
			$metadata: {},
		};
	}
);
