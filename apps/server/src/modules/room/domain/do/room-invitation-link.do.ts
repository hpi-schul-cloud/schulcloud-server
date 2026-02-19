import { RoleName, RoomRole } from '@modules/role';
import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';

export interface RoomInvitationLinkProps extends AuthorizableObject {
	id: EntityId;
	title: string;
	restrictedToCreatorSchool: boolean;
	isUsableByExternalPersons: boolean;
	isUsableByStudents: boolean;
	activeUntil?: Date;
	requiresConfirmation: boolean;
	roomId: EntityId;
	creatorUserId: EntityId;
	creatorSchoolId: EntityId;
}

export type RoomInvitationLinkUpdateProps = Omit<
	RoomInvitationLinkProps,
	'roomId' | 'creatorUserId' | 'creatorSchoolId'
>;

export type RoomInvitationLinkDto = Omit<RoomInvitationLinkProps, 'id'>;

export class RoomInvitationLink extends DomainObject<RoomInvitationLinkProps> {
	constructor(props: RoomInvitationLinkProps) {
		super(props);
	}

	public getProps(): RoomInvitationLinkProps {
		// We need to make sure that only properties of type T are returned
		// At runtime the props are a MikroORM entity that has additional non-persisted properties
		// see @Property({ persist: false })
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const { domainObject, ...copyProps } = this.props;

		return copyProps;
	}

	set requiresConfirmation(value: boolean) {
		this.props.requiresConfirmation = value;
	}

	get requiresConfirmation(): boolean {
		return this.props.requiresConfirmation;
	}

	get startingRole(): RoomRole {
		return this.props.requiresConfirmation === true ? RoleName.ROOMAPPLICANT : RoleName.ROOMVIEWER;
	}

	get title(): string {
		return this.props.title;
	}

	set title(value: string) {
		this.props.title = value;
	}

	get restrictedToCreatorSchool(): boolean {
		return this.props.restrictedToCreatorSchool;
	}

	set restrictedToCreatorSchool(value: boolean) {
		this.props.restrictedToCreatorSchool = value;
	}

	get isUsableByExternalPersons(): boolean {
		return this.props.isUsableByExternalPersons;
	}

	set isUsableByExternalPersons(value: boolean) {
		this.props.isUsableByExternalPersons = value;
	}

	get isUsableByStudents(): boolean {
		return this.props.isUsableByStudents;
	}

	set isUsableByStudents(value: boolean) {
		this.props.isUsableByStudents = value;
	}

	get activeUntil(): Date | undefined {
		return this.props.activeUntil;
	}

	set activeUntil(value: Date | undefined) {
		this.props.activeUntil = value;
	}

	get roomId(): EntityId {
		return this.props.roomId;
	}

	get creatorUserId(): EntityId {
		return this.props.creatorUserId;
	}

	get creatorSchoolId(): EntityId {
		return this.props.creatorSchoolId;
	}
}
