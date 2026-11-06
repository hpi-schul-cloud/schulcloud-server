import { Entity, Property, Unique } from '@mikro-orm/decorators/legacy';
import { BaseEntity } from '@shared/domain/entity';

export interface ReleaseImageEntityProps {
	data: Buffer;
	mimeType: string;
	sourceUrl: string;
}

@Entity({ tableName: 'release-images' })
export class ReleaseImageEntity extends BaseEntity {
	@Property({ type: 'Buffer' })
	data: Buffer;

	@Property()
	mimeType: string;

	@Property()
	size: number;

	@Property()
	@Unique()
	sourceUrl: string;

	/** refreshed whenever a fetch reuses the image; protects it from cleanup until its release is saved */
	@Property({ type: Date })
	lastUsedAt = new Date();

	constructor(props: ReleaseImageEntityProps) {
		super();
		this.data = props.data;
		this.mimeType = props.mimeType;
		this.size = props.data.length;
		this.sourceUrl = props.sourceUrl;
	}
}
