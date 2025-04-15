import { RoomRole } from '@modules/role';
import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';

export interface RoomInvitationLinkProps extends AuthorizableObject {
	id: EntityId;
	title: string;
	restrictedToSchoolId?: EntityId;
	isOnlyForTeachers: boolean;
	activeUntil?: Date;
	startingRole: RoomRole;
	roomId: EntityId;
	createdById: EntityId;
}

export type RoomInvitationLinkFlags = {
	restrictedToSchool: boolean;
	isOnlyForTeachers: boolean;
	activeUntil: Date | undefined;
	requiresConfirmation: boolean;
};

export class RoomInvitationLink extends DomainObject<RoomInvitationLinkProps> {
	constructor(props: RoomInvitationLinkProps) {
		super(props);
	}

	public getProps(): RoomInvitationLinkProps {
		// Note: Propagated hotfix. Will be resolved with mikro-orm update. Look at the comment in board-node.do.ts.
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const { domainObject, ...copyProps } = this.props;

		return copyProps;
	}

	get title(): string {
		return this.props.title;
	}

	set title(value: string) {
		this.props.title = value;
	}

	get restrictedToSchoolId(): EntityId | undefined {
		return this.props.restrictedToSchoolId;
	}

	set restrictedToSchoolId(value: EntityId | undefined) {
		this.props.restrictedToSchoolId = value;
	}

	get isOnlyForTeachers(): boolean {
		return this.props.isOnlyForTeachers;
	}

	set isOnlyForTeachers(value: boolean) {
		this.props.isOnlyForTeachers = value;
	}

	get activeUntil(): Date | undefined {
		return this.props.activeUntil;
	}

	set activeUntil(value: Date | undefined) {
		this.props.activeUntil = value;
	}

	get startingRole(): RoomRole {
		return this.props.startingRole;
	}

	set startingRole(value: RoomRole) {
		this.props.startingRole = value;
	}

	get roomId(): EntityId {
		return this.props.roomId;
	}

	set roomId(value: EntityId) {
		this.props.roomId = value;
	}

	get createdById(): EntityId {
		return this.props.createdById;
	}

	set createdById(value: EntityId) {
		this.props.createdById = value;
	}
}
