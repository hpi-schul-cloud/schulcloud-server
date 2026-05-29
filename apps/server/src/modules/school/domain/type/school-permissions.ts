import { Permission } from '@shared/domain/interface';

export interface TeacherPermission {
	[Permission.STUDENT_LIST]?: boolean;
}

export interface SchoolPermissions {
	teacher?: TeacherPermission;
}
