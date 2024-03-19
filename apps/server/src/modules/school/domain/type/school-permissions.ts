import { Permission } from '@shared/domain/interface';

export interface TeacherPermission {
	[Permission.STUDENT_LIST]?: boolean;
}

export interface StudentPermission {
	[Permission.LERNSTORE_VIEW]?: boolean;
}

export interface SchoolPermissions {
	teacher?: TeacherPermission;
	student?: StudentPermission;
}
