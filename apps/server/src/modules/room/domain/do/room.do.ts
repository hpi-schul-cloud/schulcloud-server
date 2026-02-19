import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';
import { RoomColor, RoomFeatures } from '../type';

export interface RoomProps extends AuthorizableObject {
	id: EntityId;
	name: string;
	color: RoomColor;
	startDate?: Date;
	endDate?: Date;
	schoolId: EntityId;
	features: RoomFeatures[];
	createdAt: Date;
	updatedAt: Date;
}

export type RoomCreateProps = Pick<RoomProps, 'name' | 'color' | 'startDate' | 'endDate' | 'schoolId' | 'features'>;
export type RoomUpdateProps = Omit<RoomCreateProps, 'schoolId'>;

export class Room extends DomainObject<RoomProps> {
	constructor(props: RoomProps) {
		super(props);
	}

	public getProps(): RoomProps {
		// We need to make sure that only properties of type T are returned
		// At runtime the props are a MikroORM entity that has additional non-persisted properties
		// see @Property({ persist: false })
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const { domainObject, ...copyProps } = this.props;

		return copyProps;
	}

	get name(): string {
		return this.props.name;
	}

	set name(value: string) {
		this.props.name = value;
	}

	get color(): RoomColor {
		return this.props.color;
	}

	set color(value: RoomColor) {
		this.props.color = value;
	}

	get schoolId(): EntityId {
		return this.props.schoolId;
	}

	get startDate(): Date | undefined {
		return this.props.startDate;
	}

	set startDate(value: Date | undefined) {
		this.props.startDate = value;
	}

	get endDate(): Date | undefined {
		return this.props.endDate;
	}

	set endDate(value: Date | undefined) {
		this.props.endDate = value;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}

	get features(): RoomFeatures[] {
		return this.props.features;
	}

	set features(value: RoomFeatures[]) {
		this.props.features = value;
	}

	public getRoomName(): string {
		return this.props.name;
	}
}
