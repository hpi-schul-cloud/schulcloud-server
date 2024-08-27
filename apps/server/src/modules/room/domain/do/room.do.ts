import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';

export interface RoomProps extends AuthorizableObject {
	id: EntityId;
	name: string;
	color: string;
	startDate?: Date;
	untilDate?: Date;
}

export class Room extends DomainObject<RoomProps> {
	get name(): string {
		return this.props.name;
	}

	set name(value: string) {
		this.props.name = value;
	}

	get color(): string {
		return this.props.color;
	}

	set color(value: string) {
		this.props.color = value;
	}

	get startDate(): Date | undefined {
		return this.props.startDate;
	}

	set startDate(value: Date) {
		this.props.startDate = value;
	}

	get untilDate(): Date | undefined {
		return this.props.untilDate;
	}

	set untilDate(value: Date) {
		this.props.untilDate = value;
	}
}
