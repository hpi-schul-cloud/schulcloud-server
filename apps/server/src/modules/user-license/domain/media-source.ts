import { DomainObject } from '@shared/domain/domain-object';

export interface MediaSourceProps {
	id: string;

	name?: string;

	sourceId: string;
}

export class MediaSource extends DomainObject<MediaSourceProps> {
	get name(): string | undefined {
		return this.props.name;
	}

	set name(value: string | undefined) {
		this.props.name = value;
	}

	get sourceId(): string {
		return this.props.sourceId;
	}

	set sourceId(value: string) {
		this.props.sourceId = value;
	}
}
