import { EntityId } from '@shared/domain/types';
import { AuthorizableObject, DomainObject } from '../../../shared/domain/domain-object';
import { ClassSourceOptions } from './class-source-options.do';

export interface ClassProps extends AuthorizableObject {
	name: string;
	schoolId: EntityId;
	userIds?: EntityId[];
	teacherIds: EntityId[];
	invitationLink?: string;
	year?: EntityId;
	gradeLevel?: number;
	ldapDN?: string;
	successor?: EntityId;
	source?: string;
	sourceOptions?: ClassSourceOptions;
	createdAt: Date;
	updatedAt: Date;
}

export class Class extends DomainObject<ClassProps> {
	get name(): string {
		return this.props.name;
	}

	get schoolId(): EntityId {
		return this.props.schoolId;
	}

	get userIds(): EntityId[] | undefined {
		return this.props.userIds;
	}

	get teacherIds(): EntityId[] {
		return this.props.teacherIds;
	}

	get invitationLink(): string | undefined {
		return this.props.invitationLink;
	}

	get year(): EntityId | undefined {
		return this.props.year;
	}

	get gradeLevel(): number | undefined {
		return this.props.gradeLevel;
	}

	get ldapDN(): string | undefined {
		return this.props.ldapDN;
	}

	get successor(): EntityId | undefined {
		return this.props.successor;
	}

	get source(): string | undefined {
		return this.props.source;
	}

	get sourceOptions(): ClassSourceOptions | undefined {
		return this.props.sourceOptions;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}

	public removeUser(userId: string) {
		this.props.userIds = this.props.userIds?.filter((userId1) => userId1 !== userId);
	}

	public getClassFullName(): string {
		const classFullName = this.props.gradeLevel
			? this.props.gradeLevel.toString().concat(this.props.name)
			: this.props.name;

		return classFullName;
	}
}
