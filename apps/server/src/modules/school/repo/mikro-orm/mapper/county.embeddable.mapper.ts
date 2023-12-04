import { CountyEmbeddable } from '@shared/domain';
import { County } from '../../../domain';

export class CountyEmbeddableMapper {
	static mapToDomainType(embeddable: CountyEmbeddable): County {
		const county = new County({
			id: embeddable._id.toHexString(),
			name: embeddable.name,
			countyId: embeddable.countyId,
			antaresKey: embeddable.antaresKey,
		});

		return county;
	}
}
