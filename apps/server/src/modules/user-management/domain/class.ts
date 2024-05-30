import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';

export interface ClassProps extends AuthorizableObject {
	name: string;
	studentIds: string[];
	teacherIds: string[];
}

export class Class extends DomainObject<ClassProps> {
	public isClassOfUser(userId: string): boolean {
		const result = this.props.studentIds.includes(userId);

		return result;
	}

	public getStudentIds(): string[] {
		return this.props.studentIds;
	}

	public getTeacherIds(): string[] {
		return this.props.teacherIds;
	}
}
