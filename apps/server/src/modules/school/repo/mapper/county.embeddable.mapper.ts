import { ObjectId } from '@mikro-orm/mongodb';
import { County } from '../../domain';
import { CountyEmbeddable } from '../federal-state.entity';

export class CountyEmbeddableMapper {
	public static mapToEntity(county: County): CountyEmbeddable {
		const countyProps = county.getProps();

		const countyEmbeddable = new CountyEmbeddable({ ...countyProps, _id: new ObjectId(countyProps.id) });

		return countyEmbeddable;
	}

	public static mapToDo(embeddable: CountyEmbeddable): County {
		const county = new County({
			id: embeddable._id.toHexString(),
			name: embeddable.name,
			countyId: embeddable.countyId,
			antaresKey: embeddable.antaresKey,
		});

		return county;
	}
}
