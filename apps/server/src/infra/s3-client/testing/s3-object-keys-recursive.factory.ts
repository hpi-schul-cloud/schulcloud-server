import { Factory } from 'fishery';
import { ObjectKeysRecursive } from '../interface';

export const s3ObjectKeysRecursiveFactory = Factory.define<ObjectKeysRecursive>(({ sequence }) => {
	const object: ObjectKeysRecursive = {
		path: 'test',
		maxKeys: undefined,
		nextMarker: undefined,
		files: [`test-1-${sequence}.txt`, `test-2-${sequence}.txt`],
	};

	return object;
});
