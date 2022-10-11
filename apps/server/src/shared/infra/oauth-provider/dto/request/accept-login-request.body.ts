export interface AcceptLoginRequestBody {
	subject?: string;

	acr?: string;

	amr?: string[];

	context?: object;

	force_subject_identifier?: string;

	remember?: boolean;

	remember_for?: number;
}
