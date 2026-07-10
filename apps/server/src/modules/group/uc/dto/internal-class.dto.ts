import { type EntityId } from '@shared/domain/types';
import { type Group } from '../../domain';
import { ClassRootType } from './class-root-type';

export interface InternalClassDtoProps<T> {
	id: EntityId;
	type: ClassRootType;
	name: string;
	externalSourceName?: string;
	teacherNames: string[];
	schoolYear?: string;
	isUpgradable?: boolean;
	studentCount: number;
	original: T;
}

export class InternalClassDto<T> {
	id: EntityId;

	type: ClassRootType;

	name: string;

	externalSourceName?: string;

	teacherNames: string[];

	schoolYear?: string;

	isUpgradable?: boolean;

	studentCount: number;

	original: T;

	constructor(props: InternalClassDtoProps<T>) {
		this.id = props.id;
		this.type = props.type;
		this.name = props.name;
		this.externalSourceName = props.externalSourceName;
		this.teacherNames = props.teacherNames;
		this.schoolYear = props.schoolYear;
		this.isUpgradable = props.isUpgradable;
		this.studentCount = props.studentCount;
		this.original = props.original;
	}
}

export function isGroupClassDto(dto: InternalClassDto<unknown>): dto is InternalClassDto<Group> {
	return dto.type === ClassRootType.GROUP;
}
