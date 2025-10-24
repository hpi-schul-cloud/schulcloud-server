import { EntityId } from '@shared/domain/types';
import { Group } from '../../domain';
import { ClassRootType } from './class-root-type';

export interface InternalClassDtoProps<T> {
	id: EntityId;
	type: ClassRootType;
	name: string;
	externalSourceName?: string;
	schoolYear?: string;
	isUpgradable?: boolean;
	studentCount: number;
	teacherNames: string[];
	original: T;
}

export class InternalClassDto<T> {
	public id: EntityId;

	public type: ClassRootType;

	public name: string;

	public externalSourceName?: string;

	public schoolYear?: string;

	public isUpgradable?: boolean;

	public studentCount: number;

	public teacherNames: string[];

	public original: T;

	constructor(props: InternalClassDtoProps<T>) {
		this.id = props.id;
		this.type = props.type;
		this.name = props.name;
		this.externalSourceName = props.externalSourceName;
		this.schoolYear = props.schoolYear;
		this.isUpgradable = props.isUpgradable;
		this.studentCount = props.studentCount;
		this.teacherNames = props.teacherNames;
		this.original = props.original;
	}

	public isGroup(): this is InternalClassDto<Group> {
		return this.type === ClassRootType.GROUP;
	}
}
