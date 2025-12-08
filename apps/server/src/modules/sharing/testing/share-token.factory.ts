import { ObjectId } from '@mikro-orm/mongodb';
import { ShareTokenContextType, ShareTokenParentType } from '@modules/sharing/domainobject/share-token.do';
import { ShareToken, ShareTokenProperties } from '@modules/sharing/entity/share-token.entity';
import { BaseFactory } from '@testing/factory/base.factory';
import { DeepPartial } from 'fishery';
import { nanoid } from 'nanoid';

class ShareTokenFactory extends BaseFactory<ShareToken, ShareTokenProperties> {
	withParentTypeCourse(): this {
		const parentType = ShareTokenParentType.Course;
		const parentId = new ObjectId().toHexString();
		const params: DeepPartial<ShareTokenProperties> = { parentType, parentId };

		return this.params(params);
	}

	withParentTypeBoard(): this {
		const parentType = ShareTokenParentType.ColumnBoard;
		const parentId = new ObjectId().toHexString();
		const params: DeepPartial<ShareTokenProperties> = { parentType, parentId };

		return this.params(params);
	}

	withParentTypeTask(): this {
		const parentType = ShareTokenParentType.Task;
		const parentId = new ObjectId().toHexString();
		const params: DeepPartial<ShareTokenProperties> = { parentType, parentId };

		return this.params(params);
	}

	withParentTypeLesson(): this {
		const parentType = ShareTokenParentType.Lesson;
		const parentId = new ObjectId().toHexString();
		const params: DeepPartial<ShareTokenProperties> = { parentType, parentId };

		return this.params(params);
	}

	withParentTypeRoom(): this {
		const parentType = ShareTokenParentType.Room;
		const parentId = new ObjectId().toHexString();
		const params: DeepPartial<ShareTokenProperties> = { parentType, parentId };

		return this.params(params);
	}

	withParentTypeCard(): this {
		const parentType = ShareTokenParentType.Card;
		const parentId = new ObjectId().toHexString();
		const params: DeepPartial<ShareTokenProperties> = { parentType, parentId };

		return this.params(params);
	}
}

export const shareTokenFactory = ShareTokenFactory.define(ShareToken, () => {
	return {
		token: nanoid(12),
		parentType: ShareTokenParentType.Course,
		parentId: new ObjectId().toHexString(),
		contextType: ShareTokenContextType.School,
		contextId: new ObjectId().toHexString(),
		expiresAt: new Date(Date.now() + 5 * 3600 * 1000),
	};
});
