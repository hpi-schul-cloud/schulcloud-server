export interface InternalDatabaseConfig {
	dbUrl: string;
	dbUsername?: string;
	dbPassword?: string;
	dbEnsureIndexes: boolean;
	dbDebug: boolean;
}
