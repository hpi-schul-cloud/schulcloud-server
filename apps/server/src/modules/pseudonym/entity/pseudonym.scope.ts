import { Scope } from '@shared/repo';
import { ObjectId } from '@mikro-orm/mongodb';
import { ExternalToolPseudonymEntity } from './external-tool-pseudonym.entity';

export class PseudonymScope extends Scope<ExternalToolPseudonymEntity> {
	byPseudonym(pseudonym: string | undefined): this {
		if (pseudonym) {
			this.addQuery({ pseudonym });
		}
		return this;
	}

	byUserId(userId: string | undefined): this {
		if (userId) {
			this.addQuery({ userId: new ObjectId(userId) });
		}
		return this;
	}

	byToolId(toolId: string | undefined): this {
		if (toolId) {
			this.addQuery({ toolId: new ObjectId(toolId) });
		}
		return this;
	}
}
