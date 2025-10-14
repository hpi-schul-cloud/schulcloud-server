import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDate, IsEmail, IsMongoId, IsOptional, IsString, ValidateNested } from 'class-validator';

export class UserAggregationUserConsent {
	constructor({
		form,
		privacyConsent,
		termsOfUseConsent,
		dateOfPrivacyConsent,
		dateOfTermsOfUseConsent,
	}: UserAggregationUserConsent) {
		this.form = form;
		this.privacyConsent = privacyConsent;
		this.termsOfUseConsent = termsOfUseConsent;
		this.dateOfPrivacyConsent = dateOfPrivacyConsent;
		this.dateOfTermsOfUseConsent = dateOfTermsOfUseConsent;
	}

	@IsString()
	public form!: string;

	@IsBoolean()
	public privacyConsent!: boolean;

	@IsBoolean()
	public termsOfUseConsent!: boolean;

	@IsDate()
	public dateOfPrivacyConsent!: Date;

	@IsDate()
	public dateOfTermsOfUseConsent!: Date;
}

export class UserAggregationParentConsent extends UserAggregationUserConsent {
	constructor({
		_id,
		form,
		privacyConsent,
		termsOfUseConsent,
		dateOfPrivacyConsent,
		dateOfTermsOfUseConsent,
	}: UserAggregationParentConsent) {
		super({ form, privacyConsent, termsOfUseConsent, dateOfPrivacyConsent, dateOfTermsOfUseConsent });
		this._id = _id?.toString();
	}

	@IsMongoId()
	public _id!: string;
}

export class UserAggregationConsent {
	constructor({ userConsent, parentConsents }: UserAggregationConsent) {
		this.userConsent = userConsent ? new UserAggregationUserConsent(userConsent) : undefined;
		this.parentConsents = parentConsents
			? parentConsents.map((parentConsent) => new UserAggregationParentConsent(parentConsent))
			: undefined;
	}

	@IsOptional()
	@ValidateNested()
	@Type(() => UserAggregationUserConsent)
	public userConsent?: UserAggregationUserConsent;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => UserAggregationParentConsent)
	public parentConsents?: UserAggregationParentConsent[];
}

export class UserAggregationClass {
	constructor({ name, gradeLevel, yearName }: UserAggregationClass) {
		this.name = name;
		this.gradeLevel = gradeLevel;
		this.yearName = yearName;
	}

	@IsString()
	public name!: string;

	@IsOptional()
	public gradeLevel!: number;

	@IsOptional()
	@IsString()
	public yearName!: string;
}

export class UserAggregationResult {
	constructor({
		_id,
		firstName,
		lastName,
		email,
		createdAt,
		birthday,
		preferences,
		consentStatus,
		consent,
		classes,
		importHash,
		lastLoginSystemChange,
		outdatedSince,
	}: UserAggregationResult) {
		this._id = _id.toString();
		this.firstName = firstName;
		this.lastName = lastName;
		this.email = email;
		this.createdAt = createdAt;
		this.birthday = birthday;
		this.preferences = preferences;
		this.consentStatus = consentStatus;
		this.consent = consent ? new UserAggregationConsent(consent) : undefined;
		this.classes = classes;
		this.importHash = importHash;
		this.lastLoginSystemChange = lastLoginSystemChange;
		this.outdatedSince = outdatedSince;
	}

	@IsMongoId()
	public _id: string;

	@IsString()
	public firstName!: string;

	@IsString()
	public lastName!: string;

	@IsEmail()
	public email!: string;

	@IsDate()
	public createdAt!: Date;

	@IsOptional()
	@IsDate()
	public birthday?: Date;

	@IsOptional()
	public preferences?: {
		registrationMailSend?: boolean;
	};

	@IsString()
	public consentStatus!: string;

	@IsOptional()
	@ValidateNested()
	@Type(() => UserAggregationConsent)
	public consent?: UserAggregationConsent;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => UserAggregationClass)
	public classes?: UserAggregationClass[];

	@IsOptional()
	@IsString()
	public importHash?: string;

	@IsOptional()
	@IsDate()
	public lastLoginSystemChange?: Date;

	@IsOptional()
	@IsDate()
	public outdatedSince?: Date;
}
