import { Entity, Property, Unique } from '@mikro-orm/core';
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

	constructor(props: ReleaseImageEntityProps) {
		super();
		this.data = props.data;
		this.mimeType = props.mimeType;
		this.size = props.data.length;
		this.sourceUrl = props.sourceUrl;
	}
}
