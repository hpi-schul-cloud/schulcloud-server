import { NotImplementedException } from '@nestjs/common';
import { LearnroomTypes } from '@shared/domain';
import { ShareTokenParentType } from '../domainobject/share-token.do';

export class MetadataTypeMapper {
	static mapToAlloweMetadataType(type: ShareTokenParentType): LearnroomTypes {
		const types: Map<ShareTokenParentType, LearnroomTypes> = new Map();
		types.set(ShareTokenParentType.Course, LearnroomTypes.Course);

		const res = types.get(type);

		if (!res) {
			throw new NotImplementedException();
		}
		return res;
	}
}
