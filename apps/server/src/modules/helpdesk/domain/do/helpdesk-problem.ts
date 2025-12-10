import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';
import { SupportType } from '../type';

export interface HelpdeskProblemProps extends AuthorizableObject {
	id: EntityId;
	subject: string;
	currentState?: string;
	targetState?: string;
	notes?: string;
	order?: number;
	userId?: EntityId;
	schoolId: EntityId;
	forwardedAt?: Date;
	createdAt?: Date;
	updatedAt?: Date;
	supportType?: SupportType;
	replyEmail?: string;
	problemDescription?: string;
	title?: string;
	files?: unknown[];
	device?: string;
	deviceUserAgent?: string;
	browserName?: string;
	browserVersion?: string;
	os?: string;
	problemArea?: string;
	role?: string;
	desire?: string;
	benefit?: string;
	acceptanceCriteria?: string;
	cloud?: string;
	schoolName?: string;
	systemInformation?: string;
}

export class HelpdeskProblem extends DomainObject<HelpdeskProblemProps> {
	constructor(props: HelpdeskProblemProps) {
		super(props);
	}

	get id(): EntityId {
		return this.props.id;
	}

	get subject(): string {
		return this.props.subject;
	}

	set subject(value: string) {
		this.props.subject = value;
	}

	get notes(): string | undefined {
		return this.props.notes;
	}

	set notes(value: string | undefined) {
		this.props.notes = value;
	}

	get schoolId(): EntityId {
		return this.props.schoolId;
	}

	get userId(): EntityId | undefined {
		return this.props.userId;
	}

	set userId(value: EntityId | undefined) {
		this.props.userId = value;
	}

	get createdAt(): Date | undefined {
		return this.props.createdAt;
	}

	get updatedAt(): Date | undefined {
		return this.props.updatedAt;
	}

	set updatedAt(value: Date | undefined) {
		this.props.updatedAt = value;
	}

	public markAsForwarded(): void {
		this.props.forwardedAt = new Date();
	}

	public getAuthorizableObject(): AuthorizableObject {
		return {
			id: this.props.id,
		};
	}
}
