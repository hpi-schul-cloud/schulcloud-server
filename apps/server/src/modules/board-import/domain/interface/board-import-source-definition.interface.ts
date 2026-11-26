export interface BoardImportSourceDefinition {
	type: string;
	// A host name in lowercase, or "*." plus a domain for all its subdomains.
	boardHosts: string[];
	// The key of the switch of the source in the runtime config of the server.
	switchKey: string;
}
