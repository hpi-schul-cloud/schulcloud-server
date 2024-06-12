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

	get sourceId(): string {
		return this.props.sourceId;
	}
}
