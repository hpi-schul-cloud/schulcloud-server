import { RoleName, RoomRole } from '@modules/role';
import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';

export interface RoomInvitationLinkProps extends AuthorizableObject {
	id: EntityId;
	title: string;
	restrictedToCreatorSchool: boolean;
	isOnlyForTeachers: boolean;
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
		// Note: Propagated hotfix. Will be resolved with mikro-orm update. Look at the comment in board-node.do.ts.
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
