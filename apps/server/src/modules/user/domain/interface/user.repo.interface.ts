import { SchoolEntity } from '@modules/school/repo';
import { ImportUserNameMatchFilter } from '@modules/user-import/domain/interface';
import { IFindOptions } from '@shared/domain/interface';
import { Counted, EntityId } from '@shared/domain/types';
import { User } from '../../repo/user.entity';

export interface UserRepo {
	findById(id: EntityId, populate: boolean): Promise<User>;
	findById(id: EntityId): Promise<User>;

	findByIdOrNull(id: EntityId, populate: boolean): Promise<User | null>;
	findByIdOrNull(id: EntityId): Promise<User | null>;

	findByExternalIdOrFail(externalId: string, systemId: string): Promise<User>;

	findForImportUser(
		school: SchoolEntity,
		filters?: ImportUserNameMatchFilter,
		options?: IFindOptions<User>
	): Promise<Counted<User[]>>;

	findByEmail(email: string): Promise<User[]>;

	deleteUser(userId: EntityId): Promise<number>;

	getParentEmailsFromUser(userId: EntityId): Promise<string[]>;

	saveWithoutFlush(user: User): void;

	flush(): Promise<void>;

	findUserBySchoolAndName(schoolId: EntityId, firstName: string, lastName: string): Promise<User[]>;

	findByExternalIds(externalIds: EntityId[]): Promise<EntityId[]>;

	updateAllUserByLastSyncedAt(userIds: string[]): Promise<void>;

	findUnsynchronizedUserIds(dateOfLastSyncToBeLookedFrom: Date): Promise<string[]>;

	save(entities: User | User[]): Promise<void>;
}

export const USER_REPO = Symbol('USER_REPO');
