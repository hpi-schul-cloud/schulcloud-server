import { ValidationError } from '@shared/common';
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

export type RoomCreateProps = Pick<RoomProps, 'name' | 'color' | 'startDate' | 'endDate'>;
export type RoomUpdateProps = RoomCreateProps; // will probably change in the future

export class Room extends DomainObject<RoomProps> {
	public constructor(props: RoomProps) {
		super(props);
		this.validateTimeSpan();
	}

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
		this.validateTimeSpan();
	}

	public get endDate(): Date | undefined {
		return this.props.endDate;
	}

	public set endDate(value: Date) {
		this.props.endDate = value;
		this.validateTimeSpan();
	}

	public get createdAt(): Date {
		return this.props.createdAt;
	}

	public get updatedAt(): Date {
		return this.props.updatedAt;
	}

	private validateTimeSpan() {
		if (this.props.startDate != null && this.props.endDate != null && this.props.startDate > this.props.endDate) {
			throw new ValidationError(
				`Invalid room room timespan. Start date '${this.props.startDate.toISOString()}' has to be before end date: '${this.props.endDate.toISOString()}'. Room id='${
					this.id
				}'`
			);
		}
	}
}
