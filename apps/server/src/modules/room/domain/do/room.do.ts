import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';
import { RoomColor } from '../type';

export interface RoomProps extends AuthorizableObject {
	id: EntityId;
	name: string;
	color: RoomColor;
	startDate?: Date;
	endDate?: Date;
	createdAt: Date;
	updatedAt: Date;
}

export class Room extends DomainObject<RoomProps> {
	public getProps(): RoomProps {
		// Note: Propagated hotfix. Will be resolved with mikro-orm update. Look at the comment in board-node.do.ts.
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const { domainObject, ...copyProps } = this.props;

		return copyProps;
	}

	public get name(): string {
		return this.props.name;
	}

	public set name(value: string) {
		this.props.name = value;
	}

	public get color(): RoomColor {
		return this.props.color;
	}

	public set color(value: RoomColor) {
		this.props.color = value;
	}

	public get startDate(): Date | undefined {
		return this.props.startDate;
	}

	public set startDate(value: Date) {
		this.props.startDate = value;
	}

	public get endDate(): Date | undefined {
		return this.props.endDate;
	}

	public set endDate(value: Date) {
		this.props.endDate = value;
	}

	public get createdAt(): Date {
		return this.props.createdAt;
	}

	public get updatedAt(): Date {
		return this.props.updatedAt;
	}
}
