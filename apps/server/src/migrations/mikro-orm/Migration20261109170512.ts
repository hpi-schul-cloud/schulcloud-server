import { Migration } from '@mikro-orm/migrations-mongodb';
import type { ObjectId } from '@mikro-orm/mongodb';

// Same name as OauthProviderLoginFlowService.RETIRED_NEXTCLOUD_TOOL_NAME
const NEXTCLOUD_TOOL_NAME = /^(Schulcloud)?Nextcloud$/i;

export class Migration20261109170512 extends Migration {
	public async up(): Promise<void> {
		const toolIds = await this.findIds('external-tools', { name: NEXTCLOUD_TOOL_NAME });

		if (toolIds.length === 0) {
			console.info('No Nextcloud external tool found. Nothing to remove.');
			return;
		}

		const schoolToolIds = await this.findIds('school-external-tools', { tool: { $in: toolIds } });
		const contextToolIds = await this.findIds('context-external-tools', { schoolTool: { $in: schoolToolIds } });

		const unlinkedBoardNodes = await this.unlinkBoardNodes(contextToolIds);
		const deletedContextTools = await this.deleteByIds('context-external-tools', contextToolIds);
		const deletedSchoolTools = await this.deleteByIds('school-external-tools', schoolToolIds);
		const deletedPseudonyms = await this.deletePseudonyms(toolIds);
		const deletedTools = await this.deleteByIds('external-tools', toolIds);

		console.info(
			`Removed Nextcloud: ${deletedTools} tools, ${deletedSchoolTools} school tools, ` +
				`${deletedContextTools} context tools, ${deletedPseudonyms} pseudonyms; ` +
				`${unlinkedBoardNodes} board nodes unlinked.`
		);
	}

	private async findIds(collectionName: string, filter: Record<string, unknown>): Promise<ObjectId[]> {
		const documents = await this.getCollection(collectionName)
			.find(filter, { projection: { _id: 1 } })
			.toArray();

		return documents.map((document) => document._id);
	}

	private async deleteByIds(collectionName: string, ids: ObjectId[]): Promise<number> {
		const result = await this.getCollection(collectionName).deleteMany({ _id: { $in: ids } });

		return result.deletedCount;
	}

	private async deletePseudonyms(toolIds: ObjectId[]): Promise<number> {
		const result = await this.getCollection('external-tool-pseudonyms').deleteMany({ toolId: { $in: toolIds } });

		return result.deletedCount;
	}

	// Board nodes reference context tools either as ObjectId or as string.
	private async unlinkBoardNodes(contextToolIds: ObjectId[]): Promise<number> {
		const contextToolIdsAsStrings = contextToolIds.map((id) => id.toHexString());
		const result = await this.getCollection('boardnodes').updateMany(
			{ contextExternalToolId: { $in: [...contextToolIds, ...contextToolIdsAsStrings] } },
			{ $unset: { contextExternalToolId: '' } }
		);

		return result.modifiedCount;
	}

	public down(): Promise<void> {
		console.info('Removal of the Nextcloud external tool can not be reverted.');
		return Promise.resolve();
	}
}
