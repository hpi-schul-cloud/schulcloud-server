import { Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain';
import { UserInfo } from '../../news/entity';

@Entity({ tableName: 'file' })
export class File extends BaseEntityWithTimestamps {
	constructor(partial: Partial<File>) {
		super();
		Object.assign(this, partial);
	}

	@Property()
	name: string;

    @Property()
    creator: UserInfo
}
