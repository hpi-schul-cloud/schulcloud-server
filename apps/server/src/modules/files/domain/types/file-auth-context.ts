import { EntityId } from '@shared/domain/types';

export interface FileAuthContext {
	/** The ID of the requesting user. Used for the explicit-user-permission and owner shortcut checks. */
	userId: EntityId;
	/**
	 * When false, the owner scope alone is sufficient to grant read access
	 * (e.g. user archives their own files, or a course-teacher reads course files).
	 * When true, file.permissions must contain a matching role entry with read=true.
	 */
	requiresRolePermission: boolean;
	/**
	 * Role IDs that should be checked against file.permissions[].refId when
	 * requiresRolePermission is true. Empty means no role can grant access.
	 *
	 * For courses: contains the student role ID.
	 * For teams: contains all role IDs from the user's team-role hierarchy (DFS walk).
	 */
	readableRoleIds: EntityId[];
}
