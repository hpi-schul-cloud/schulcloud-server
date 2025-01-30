import { RoomEntity } from '@modules/room/repo/entity';
import { SystemEntity } from '@modules/system/entity/system.entity';
import { FederalStateEntity } from '@shared/domain/entity/federal-state.entity';
import { Role } from '@shared/domain/entity/role.entity';
import { SchoolEntity, SchoolRoles } from '@shared/domain/entity/school.entity';
import { SchoolYearEntity } from '@shared/domain/entity/schoolyear.entity';
import { StorageProviderEntity } from '@shared/domain/entity/storageprovider.entity';

export const ENTITIES = [
	FederalStateEntity,
	Role,
	RoomEntity,
	SchoolEntity,
	SchoolRoles,
	SchoolYearEntity,
	StorageProviderEntity,
	SystemEntity,
];
