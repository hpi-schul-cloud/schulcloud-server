export interface AntivirusModuleOptions {
	enabled: boolean;
	filesServiceBaseUrl: string;
	exchange: string;
	routingKey: string;
	hostname: string;
	port: number;
}

export interface AntivirusServiceOptions {
	enabled: boolean;
	filesServiceBaseUrl: string;
	exchange: string;
	routingKey: string;
}

export interface ScanResult {
	virus_detected?: boolean;
	virus_signature?: string;
	error?: string;
}
