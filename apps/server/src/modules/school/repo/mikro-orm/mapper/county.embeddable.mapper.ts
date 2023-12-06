import { CountyEmbeddable } from '@shared/domain/entity';
import { County } from '../../../domain';

export class CountyEmbeddableMapper {
	static mapToDo(embeddable: CountyEmbeddable): County {
		const county = new County({
			id: embeddable._id.toHexString(),
			name: embeddable.name,
			countyId: embeddable.countyId,
			antaresKey: embeddable.antaresKey,
		});

		return county;
	}
}
