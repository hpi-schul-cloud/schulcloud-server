import { ObjectId } from '@mikro-orm/mongodb';
import { CountyEmbeddable } from '@shared/domain/entity';
import { County } from '../../../domain';

export class CountyEmbeddableMapper {
	static mapToEntity(county: County): CountyEmbeddable {
		const countyProps = county.getProps();

		const countyEmbeddable = new CountyEmbeddable({ ...countyProps, _id: new ObjectId(countyProps.id) });

		return countyEmbeddable;
	}

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
