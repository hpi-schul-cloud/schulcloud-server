export interface BoardImportSourceDefinition {
	readonly type: string;
	// A host name in lowercase, or "*." plus a domain for all its subdomains.
	readonly boardHosts: readonly string[];
	// The key of the switch of the source in the runtime config of the server.
	readonly switchKey: string;
}
