import { CountyEmbeddable } from '@shared/domain';
import { County } from '../../../domain';

export class CountyEmbeddableMapper {
	// The explicit mapping is needed because the CountyEmbeddable has an _id.
	static mapToDomainType(embeddable: CountyEmbeddable): County {
		const county = {
			id: embeddable._id.toHexString(),
			name: embeddable.name,
			countyId: embeddable.countyId,
			antaresKey: embeddable.antaresKey,
		};

		return county;
	}
}
