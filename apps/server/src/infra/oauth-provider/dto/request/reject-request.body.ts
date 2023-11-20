// Is it valid that all parameters are optional?
export interface RejectRequestBody {
	error?: string;

	error_debug?: string;

	error_description?: string;

	error_hint?: string;

	status_code?: number;
}
