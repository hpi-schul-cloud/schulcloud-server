export interface IDatabaseManagementController {
	importCollections(): Promise<void>;

	importCollection(collectionName: string): Promise<void>;

	exportCollections(): Promise<void>;

	exportCollection(collectionName: string): Promise<void>;
}
