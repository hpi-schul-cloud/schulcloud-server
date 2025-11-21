import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';

export interface RegistrationProps extends AuthorizableObject {
	id: EntityId;
	email: string;
	firstName: string;
	lastName: string;
	roomIds: EntityId[];
	registrationHash: string;
	createdAt: Date;
	updatedAt: Date;
}

export type RegistrationCreateProps = {
	email: string;
	firstName: string;
	lastName: string;
	roomId: EntityId;
};

export class Registration extends DomainObject<RegistrationProps> {
	constructor(props: RegistrationProps) {
		super(props);
	}

	public getProps(): RegistrationProps {
		// Note: Propagated hotfix. Will be resolved with mikro-orm update. Look at the comment in board-node.do.ts.
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const { domainObject, ...copyProps } = this.props;

		return copyProps;
	}

	get email(): string {
		return this.props.email;
	}

	get firstName(): string {
		return this.props.firstName;
	}

	set firstName(value: string) {
		this.props.firstName = value;
	}

	get lastName(): string {
		return this.props.lastName;
	}

	set lastName(value: string) {
		this.props.lastName = value;
	}

	get roomIds(): EntityId[] {
		return this.props.roomIds;
	}

	get registrationHash(): string {
		return this.props.registrationHash;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}

	public addRoomId(roomId: EntityId): void {
		if (this.roomIds.includes(roomId)) {
			return;
		}

		this.props.roomIds.push(roomId);
	}
}
