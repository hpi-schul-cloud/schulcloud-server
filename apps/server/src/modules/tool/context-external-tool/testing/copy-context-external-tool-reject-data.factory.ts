import { ObjectId } from '@mikro-orm/mongodb';
import { Factory } from 'fishery';
import { CopyContextExternalToolRejectData } from '../domain';

export const copyContextExternalToolRejectDataFactory = Factory.define<CopyContextExternalToolRejectData>(() => {
	return {
		sourceContextExternalToolId: new ObjectId().toHexString(),
		externalToolName: 'Test Tool',
	};
});
