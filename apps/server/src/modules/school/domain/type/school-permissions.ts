import { Permission } from '@shared/domain/interface';

export interface TeacherPermission {
	[Permission.STUDENT_LIST]?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface StudentPermission {}

export interface SchoolPermissions {
	teacher?: TeacherPermission;
	student?: StudentPermission;
}
