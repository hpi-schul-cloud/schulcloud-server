import { EntityDictionary, EntityName, FilterQuery } from '@mikro-orm/core';
import { EntityManager, FindOptions, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { BaseRepo } from '@shared/repo/base.repo';
import { FileDo, FileOwnerModel, FilesRepoInterface } from '../domain';
import { FileAuthContext } from '../domain/types/file-auth-context';
import { FileEntity } from '../entity';
import { FileEntityMapper } from './mapper';

@Injectable()
export class FilesRepo extends BaseRepo<FileEntity> implements FilesRepoInterface {
	constructor(protected readonly _em: EntityManager) {
		super(_em);
	}

	get entityName(): EntityName<FileEntity> {
		return FileEntity;
	}

	public async findForCleanup(thresholdDate: Date, batchSize: number, offset: number): Promise<FileEntity[]> {
		const filter = { deletedAt: { $lte: thresholdDate } };
		const options: FindOptions<FileEntity> = {
			orderBy: { id: 'asc' },
			limit: batchSize,
			offset,
			populate: ['storageProvider'] as never[],
		};

		const files = await this._em.find(FileEntity, filter, options);

		return files as FileEntity[];
	}

	public async findByOwnerUserId(ownerUserId: EntityId): Promise<FileEntity[]> {
		const filter = {
			owner: new ObjectId(ownerUserId),
			refOwnerModel: FileOwnerModel.USER,
		};

		const files = await this._em.find(FileEntity, filter);

		return files as FileEntity[];
	}

	public async findByIdAndOwnerType(
		ownerId: EntityId,
		ownerType: FileOwnerModel,
		authContext: FileAuthContext
	): Promise<FileDo[]> {
		const filter = this.buildAuthFilter(ownerId, ownerType, authContext);

		if (filter === null) {
			// No applicable permissions – return empty without querying
			return [];
		}

		const files = await this._em.find(FileEntity, filter);

		return FileEntityMapper.mapToDos(files as FileEntity[]);
	}

	/**
	 * Builds the MongoDB filter that encodes the authorization logic per owner type.
	 *
	 * - user:   owner scope (ownerId = userId for user archives) is sufficient
	 * - course teacher:  same – no extra per-file role filter
	 * - course student:  file.permissions must contain student role with read=true
	 * - teams:  file.permissions must contain one of the applicable team role IDs with read=true
	 *           (applicableRoleIds comes from a DFS walk of the user's team role hierarchy)
	 *
	 * Returns null when it is already known that no files are accessible.
	 */
	private buildAuthFilter(
		ownerId: EntityId,
		ownerType: FileOwnerModel,
		authContext: FileAuthContext
	): FilterQuery<FileEntity> | null {
		// Plain object (no FilterQuery annotation) so it can safely be spread
		const ownerFilter = {
			owner: new ObjectId(ownerId),
			refOwnerModel: ownerType,
		};

		const userId = new ObjectId(authContext.userId);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const explicitUserClause = {
			permissions: { $elemMatch: { refId: userId, read: true } },
		} as unknown as FilterQuery<FileEntity>;

		if (!authContext.requiresRolePermission) {
			// User-owned or teacher in course: the owner scope already grants access.
			// Include the explicit-user-permission clause so shared files are covered too.
			return {
				...ownerFilter,
				$or: [{ owner: userId } as FilterQuery<FileEntity>, explicitUserClause],
			};
		}

		if (authContext.readableRoleIds.length === 0) {
			// No applicable roles resolved (e.g. user not a member of the team)
			return null;
		}

		const roleObjectIds = authContext.readableRoleIds.map((id) => new ObjectId(id));

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const roleClause = {
			permissions: { $elemMatch: { refId: { $in: roleObjectIds }, read: true } },
		} as unknown as FilterQuery<FileEntity>;

		return {
			...ownerFilter,
			$or: [explicitUserClause, roleClause],
		};
	}

	public async findByPermissionRefIdOrCreatorId(userId: EntityId): Promise<FileEntity[]> {
		const refId = new ObjectId(userId);

		const pipeline = [
			{
				$match: {
					$and: [
						{
							$or: [
								{
									permissions: {
										$elemMatch: {
											refId,
										},
									},
								},
								{ creator: refId },
							],
						},
						{ deleted: false },
						{ deletedAt: undefined },
					],
				},
			},
		];

		const rawFilesDocuments = await this._em.aggregate(FileEntity, pipeline);

		const files = rawFilesDocuments.map((rawFileDocument) =>
			this._em.map(FileEntity, rawFileDocument as EntityDictionary<FileEntity>)
		);

		return files;
	}
}
