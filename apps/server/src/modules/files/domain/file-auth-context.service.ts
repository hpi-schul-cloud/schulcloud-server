import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ObjectId } from 'bson';
import { FileOwnerModel } from './types';
import { FileAuthContext } from './types/file-auth-context';

interface RoleDocument {
	_id: ObjectId;
	name: string;
	roles?: ObjectId[];
}

interface TeamUserDocument {
	userId: ObjectId;
	role: ObjectId;
}

interface TeamDocument {
	_id: ObjectId;
	userIds: TeamUserDocument[];
}

/**
 * Resolves the per-file read authorization context for a given owner type.
 *
 * This mirrors the legacy filePermissionHelper.js logic:
 *  - user:   owner scope is always sufficient (owner shortcut in legacy code)
 *  - course: teacher/admin sees all files; students are gated by the student-role permission entry
 *  - teams:  files are readable only when the user's team-role hierarchy contains a matching entry
 */
@Injectable()
export class FileAuthContextService {
	constructor(private readonly _em: EntityManager) {}

	public async buildContext(
		ownerId: EntityId,
		ownerType: FileOwnerModel,
		userId: EntityId,
		userRoleIds: EntityId[]
	): Promise<FileAuthContext> {
		switch (ownerType) {
			case FileOwnerModel.USER:
				return this.buildForUser(userId);
			case FileOwnerModel.COURSE:
				return await this.buildForCourse(userId, userRoleIds);
			case FileOwnerModel.TEAMS:
				return await this.buildForTeam(ownerId, userId);
			default:
				return this.buildForUser(userId);
		}
	}

	private buildForUser(userId: EntityId): FileAuthContext {
		const authContext = {
			userId,
			requiresRolePermission: false,
			readableRoleIds: [],
		};

		return authContext;
	}

	private async buildForCourse(userId: EntityId, userRoleIds: EntityId[]): Promise<FileAuthContext> {
		const studentRole = await this._em
			.getConnection()
			.getCollection<RoleDocument>('roles')
			.findOne({ name: 'student' }, { projection: { _id: 1 } });

		if (!studentRole) {
			const nonStudentContext = { userId, requiresRolePermission: false, readableRoleIds: [] };

			return nonStudentContext;
		}

		const studentRoleId = studentRole._id.toHexString();
		const isStudent = userRoleIds.includes(studentRoleId);

		if (isStudent) {
			const studentContext = {
				userId,
				requiresRolePermission: true,
				readableRoleIds: [studentRoleId],
			};

			return studentContext;
		}

		const teacherAndAdminContext = { userId, requiresRolePermission: false, readableRoleIds: [] };

		return teacherAndAdminContext;
	}

	private async buildForTeam(teamId: EntityId, userId: EntityId): Promise<FileAuthContext> {
		const connection = this._em.getConnection();

		const team = await connection
			.getCollection<TeamDocument>('teams')
			.findOne(
				{ _id: new ObjectId(teamId), 'userIds.userId': new ObjectId(userId) },
				{ projection: { 'userIds.$': 1 } }
			);

		if (!team || !team.userIds?.length) {
			// User is not a member of this team – no files accessible
			return { userId, requiresRolePermission: true, readableRoleIds: [] };
		}

		const directRoleId = team.userIds[0].role.toHexString();

		// 2. Load all team roles with their sub-role arrays for the hierarchy walk
		const allTeamRoles = await connection.getCollection<RoleDocument>('roles').find({ name: /^team/ }).toArray();

		const roleIndex: Map<string, RoleDocument> = new Map(allTeamRoles.map((r) => [r._id.toHexString(), r]));

		// 3. DFS walk starting from the user's direct team role
		//    This mirrors the legacy checkTeamPermission walk in filePermissionHelper.js
		const applicableRoleIds: EntityId[] = [];
		const visited = new Set<string>();
		const stack = [directRoleId];

		while (stack.length > 0) {
			const currentId = stack.pop()!;

			if (visited.has(currentId)) continue;
			visited.add(currentId);
			applicableRoleIds.push(currentId);

			const role = roleIndex.get(currentId);
			if (role?.roles) {
				for (const subRoleId of role.roles) {
					const subId = subRoleId.toHexString();
					if (!visited.has(subId)) {
						stack.push(subId);
					}
				}
			}
		}

		return {
			userId,
			requiresRolePermission: true,
			readableRoleIds: applicableRoleIds,
		};
	}
}
