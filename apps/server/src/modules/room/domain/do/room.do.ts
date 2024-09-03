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
	public getProps(): RoomProps {
		const copyProps = { ...this.props };
		// Note: Propagated hotfix. Will be resolved with mikro-orm update. Look at the comment in board-node.do.ts.
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		copyProps.domainObject = undefined;

		return copyProps;
	}

	public get name(): string {
		return this.props.name;
	}

	public set name(value: string) {
		this.props.name = value;
	}

	public get color(): string {
		return this.props.color;
	}

	public set color(value: string) {
		this.props.color = value;
	}

	public get startDate(): Date | undefined {
		return this.props.startDate;
	}

	public set startDate(value: Date) {
		this.props.startDate = value;
	}

	public get untilDate(): Date | undefined {
		return this.props.untilDate;
	}

	public set untilDate(value: Date) {
		this.props.untilDate = value;
	}
}
