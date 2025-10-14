import { validate } from 'class-validator';
import 'reflect-metadata';
import {
	UserAggregationClass,
	UserAggregationConsent,
	UserAggregationParentConsent,
	UserAggregationResult,
	UserAggregationUserConsent,
} from './user-aggregation-result';

describe('UserAggregationResult', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('constructor', () => {
		describe('when all fields are provided', () => {
			const setup = () => {
				const userConsent = {
					form: 'digital',
					privacyConsent: true,
					termsOfUseConsent: true,
					dateOfPrivacyConsent: new Date('2023-01-01'),
					dateOfTermsOfUseConsent: new Date('2023-01-01'),
				};

				const parentConsent = {
					_id: '507f1f77bcf86cd799439011',
					form: 'analog',
					privacyConsent: true,
					termsOfUseConsent: false,
					dateOfPrivacyConsent: new Date('2023-01-02'),
					dateOfTermsOfUseConsent: new Date('2023-01-02'),
				};

				const consent = {
					userConsent,
					parentConsents: [parentConsent],
				};

				const classData = {
					name: 'Test Class',
					gradeLevel: 5,
					yearName: '2023/24',
				};

				const userData = {
					_id: '507f1f77bcf86cd799439012',
					firstName: 'John',
					lastName: 'Doe',
					email: 'john.doe@example.com',
					createdAt: new Date('2023-01-01'),
					birthday: new Date('2010-01-01'),
					preferences: { registrationMailSend: true },
					consentStatus: 'ok',
					consent,
					classes: [classData],
					importHash: 'hash123',
					lastLoginSystemChange: new Date('2023-01-01'),
					outdatedSince: new Date('2023-01-01'),
				};

				return {
					userData,
					consent,
					classData,
					userConsent,
					parentConsent,
				};
			};

			it('should create instance with all properties correctly assigned', () => {
				const { userData } = setup();

				const result = new UserAggregationResult(userData);

				expect(result._id).toBe(userData._id);
				expect(result.firstName).toBe(userData.firstName);
				expect(result.lastName).toBe(userData.lastName);
				expect(result.email).toBe(userData.email);
				expect(result.createdAt).toBe(userData.createdAt);
				expect(result.birthday).toBe(userData.birthday);
				expect(result.preferences).toBe(userData.preferences);
				expect(result.consentStatus).toBe(userData.consentStatus);
				expect(result.consent).toBeInstanceOf(UserAggregationConsent);
				expect(result.classes).toBe(userData.classes);
				expect(result.importHash).toBe(userData.importHash);
				expect(result.lastLoginSystemChange).toBe(userData.lastLoginSystemChange);
				expect(result.outdatedSince).toBe(userData.outdatedSince);
			});
		});

		describe('when optional fields are undefined', () => {
			const setup = () => {
				const userData = {
					_id: undefined,
					firstName: 'John',
					lastName: 'Doe',
					email: 'john.doe@example.com',
					createdAt: new Date('2023-01-01'),
					birthday: undefined,
					preferences: undefined,
					consentStatus: 'missing',
					consent: undefined,
					classes: undefined,
					importHash: undefined,
					lastLoginSystemChange: undefined,
					outdatedSince: undefined,
				};

				return { userData };
			};

			it('should handle undefined optional fields correctly', () => {
				const { userData } = setup();

				const result = new UserAggregationResult(userData);

				expect(result._id).toBeUndefined();
				expect(result.birthday).toBeUndefined();
				expect(result.preferences).toBeUndefined();
				expect(result.consent).toBeUndefined();
				expect(result.classes).toBeUndefined();
				expect(result.importHash).toBeUndefined();
				expect(result.lastLoginSystemChange).toBeUndefined();
				expect(result.outdatedSince).toBeUndefined();
			});
		});
	});

	describe('validation', () => {
		describe('when valid data is provided', () => {
			const setup = () => {
				const validData = {
					_id: '507f1f77bcf86cd799439011',
					firstName: 'John',
					lastName: 'Doe',
					email: 'john.doe@example.com',
					createdAt: new Date('2023-01-01'),
					birthday: new Date('2010-01-01'),
					preferences: { registrationMailSend: true },
					consentStatus: 'ok',
					consent: undefined,
					classes: undefined,
					importHash: 'hash123',
					lastLoginSystemChange: new Date('2023-01-01'),
					outdatedSince: new Date('2023-01-01'),
				};

				return { validData };
			};

			it('should pass validation', async () => {
				const { validData } = setup();
				const result = new UserAggregationResult(validData);

				const validationErrors = await validate(result);

				expect(validationErrors).toHaveLength(0);
			});
		});

		describe('when invalid email is provided', () => {
			const setup = () => {
				const invalidData = {
					_id: '507f1f77bcf86cd799439011',
					firstName: 'John',
					lastName: 'Doe',
					email: 'invalid-email',
					createdAt: new Date('2023-01-01'),
					consentStatus: 'ok',
				} as UserAggregationResult;

				return { invalidData };
			};

			it('should fail validation with email error', async () => {
				const { invalidData } = setup();
				const result = new UserAggregationResult(invalidData);

				const validationErrors = await validate(result);

				expect(validationErrors.length).toBeGreaterThan(0);
				expect(validationErrors[0].property).toBe('email');
				expect(validationErrors[0].constraints).toHaveProperty('isEmail');
			});
		});

		describe('when invalid MongoDB ObjectId is provided', () => {
			const setup = () => {
				const invalidData = {
					_id: 'invalid-object-id',
					firstName: 'John',
					lastName: 'Doe',
					email: 'john.doe@example.com',
					createdAt: new Date('2023-01-01'),
					consentStatus: 'ok',
				} as UserAggregationResult;

				return { invalidData };
			};

			it('should fail validation with MongoId error', async () => {
				const { invalidData } = setup();
				const result = new UserAggregationResult(invalidData);

				const validationErrors = await validate(result);

				expect(validationErrors.length).toBeGreaterThan(0);
				expect(validationErrors[0].property).toBe('_id');
				expect(validationErrors[0].constraints).toHaveProperty('isMongoId');
			});
		});

		describe('when invalid firstName is provided', () => {
			const setup = () => {
				const invalidData = {
					firstName: 123 as unknown as string,
					lastName: 'Doe',
					email: 'john.doe@example.com',
					createdAt: new Date('2023-01-01'),
					consentStatus: 'ok',
				} as UserAggregationResult;

				return { invalidData };
			};

			it('should fail validation with string error', async () => {
				const { invalidData } = setup();
				const result = new UserAggregationResult(invalidData);

				const validationErrors = await validate(result);

				expect(validationErrors.length).toBeGreaterThan(0);
				const firstNameError = validationErrors.find((error) => error.property === 'firstName');
				expect(firstNameError).toBeDefined();
				expect(firstNameError?.constraints).toHaveProperty('isString');
			});
		});

		describe('when invalid lastName is provided', () => {
			const setup = () => {
				const invalidData = {
					firstName: 'John',
					lastName: null as unknown as string,
					email: 'john.doe@example.com',
					createdAt: new Date('2023-01-01'),
					consentStatus: 'ok',
				} as UserAggregationResult;

				return { invalidData };
			};

			it('should fail validation with string error', async () => {
				const { invalidData } = setup();
				const result = new UserAggregationResult(invalidData);

				const validationErrors = await validate(result);

				expect(validationErrors.length).toBeGreaterThan(0);
				const lastNameError = validationErrors.find((error) => error.property === 'lastName');
				expect(lastNameError).toBeDefined();
				expect(lastNameError?.constraints).toHaveProperty('isString');
			});
		});

		describe('when invalid createdAt is provided', () => {
			const setup = () => {
				const invalidData = {
					firstName: 'John',
					lastName: 'Doe',
					email: 'john.doe@example.com',
					createdAt: 'invalid-date' as unknown as Date,
					consentStatus: 'ok',
				} as UserAggregationResult;

				return { invalidData };
			};

			it('should fail validation with date string error', async () => {
				const { invalidData } = setup();
				const result = new UserAggregationResult(invalidData);

				const validationErrors = await validate(result);

				expect(validationErrors.length).toBeGreaterThan(0);
				const createdAtError = validationErrors.find((error) => error.property === 'createdAt');
				expect(createdAtError).toBeDefined();
			});
		});

		describe('when invalid birthday is provided', () => {
			const setup = () => {
				const invalidData = {
					firstName: 'John',
					lastName: 'Doe',
					email: 'john.doe@example.com',
					createdAt: new Date('2023-01-01'),
					birthday: 'not-a-date' as unknown as Date,
					consentStatus: 'ok',
				} as UserAggregationResult;

				return { invalidData };
			};

			it('should fail validation with date string error', async () => {
				const { invalidData } = setup();
				const result = new UserAggregationResult(invalidData);

				const validationErrors = await validate(result);

				expect(validationErrors.length).toBeGreaterThan(0);
				const birthdayError = validationErrors.find((error) => error.property === 'birthday');
				expect(birthdayError).toBeDefined();
				expect(birthdayError?.constraints).toHaveProperty('isDateString');
			});
		});

		describe('when invalid consentStatus is provided', () => {
			const setup = () => {
				const invalidData = {
					firstName: 'John',
					lastName: 'Doe',
					email: 'john.doe@example.com',
					createdAt: new Date('2023-01-01'),
					consentStatus: 42 as unknown as string,
				} as UserAggregationResult;

				return { invalidData };
			};

			it('should fail validation with string error', async () => {
				const { invalidData } = setup();
				const result = new UserAggregationResult(invalidData);

				const validationErrors = await validate(result);

				expect(validationErrors.length).toBeGreaterThan(0);
				const consentStatusError = validationErrors.find((error) => error.property === 'consentStatus');
				expect(consentStatusError).toBeDefined();
				expect(consentStatusError?.constraints).toHaveProperty('isString');
			});
		});

		describe('when invalid importHash is provided', () => {
			const setup = () => {
				const invalidData = {
					firstName: 'John',
					lastName: 'Doe',
					email: 'john.doe@example.com',
					createdAt: new Date('2023-01-01'),
					consentStatus: 'ok',
					importHash: [] as unknown as string,
				} as UserAggregationResult;

				return { invalidData };
			};

			it('should fail validation with string error', async () => {
				const { invalidData } = setup();
				const result = new UserAggregationResult(invalidData);

				const validationErrors = await validate(result);

				expect(validationErrors.length).toBeGreaterThan(0);
				const importHashError = validationErrors.find((error) => error.property === 'importHash');
				expect(importHashError).toBeDefined();
				expect(importHashError?.constraints).toHaveProperty('isString');
			});
		});

		describe('when invalid lastLoginSystemChange is provided', () => {
			const setup = () => {
				const invalidData = {
					firstName: 'John',
					lastName: 'Doe',
					email: 'john.doe@example.com',
					createdAt: new Date('2023-01-01'),
					consentStatus: 'ok',
					lastLoginSystemChange: 'invalid-date' as unknown as Date,
				} as UserAggregationResult;

				return { invalidData };
			};

			it('should fail validation with date string error', async () => {
				const { invalidData } = setup();
				const result = new UserAggregationResult(invalidData);

				const validationErrors = await validate(result);

				expect(validationErrors.length).toBeGreaterThan(0);
				const lastLoginError = validationErrors.find((error) => error.property === 'lastLoginSystemChange');
				expect(lastLoginError).toBeDefined();
			});
		});

		describe('when invalid outdatedSince is provided', () => {
			const setup = () => {
				const invalidData = {
					firstName: 'John',
					lastName: 'Doe',
					email: 'john.doe@example.com',
					createdAt: new Date('2023-01-01'),
					consentStatus: 'ok',
					outdatedSince: 'invalid-date' as unknown as Date,
				} as UserAggregationResult;

				return { invalidData };
			};

			it('should fail validation with date string error', async () => {
				const { invalidData } = setup();
				const result = new UserAggregationResult(invalidData);

				const validationErrors = await validate(result);

				expect(validationErrors.length).toBeGreaterThan(0);
				const outdatedSinceError = validationErrors.find((error) => error.property === 'outdatedSince');
				expect(outdatedSinceError).toBeDefined();
			});
		});

		describe('when invalid classes array is provided', () => {
			const setup = () => {
				const invalidData = {
					firstName: 'John',
					lastName: 'Doe',
					email: 'john.doe@example.com',
					createdAt: new Date('2023-01-01'),
					consentStatus: 'ok',
					classes: 'not-an-array' as unknown as unknown[],
				} as UserAggregationResult;

				return { invalidData };
			};

			it('should fail validation with array error', async () => {
				const { invalidData } = setup();
				const result = new UserAggregationResult(invalidData);

				const validationErrors = await validate(result);

				expect(validationErrors.length).toBeGreaterThan(0);
				const classesError = validationErrors.find((error) => error.property === 'classes');
				expect(classesError).toBeDefined();
				expect(classesError?.constraints).toHaveProperty('isArray');
			});
		});
	});
});

describe('UserAggregationConsent', () => {
	describe('constructor', () => {
		describe('when userConsent and parentConsents are provided', () => {
			const setup = () => {
				const userConsent = {
					form: 'digital',
					privacyConsent: true,
					termsOfUseConsent: true,
					dateOfPrivacyConsent: new Date('2023-01-01'),
					dateOfTermsOfUseConsent: new Date('2023-01-01'),
				};

				const parentConsent = {
					_id: '507f1f77bcf86cd799439011',
					form: 'analog',
					privacyConsent: true,
					termsOfUseConsent: false,
					dateOfPrivacyConsent: new Date('2023-01-02'),
					dateOfTermsOfUseConsent: new Date('2023-01-02'),
				};

				const consentData = {
					userConsent,
					parentConsents: [parentConsent],
				};

				return { consentData, userConsent, parentConsent };
			};

			it('should create instances for nested objects', () => {
				const { consentData } = setup();

				const result = new UserAggregationConsent(consentData);

				expect(result.userConsent).toBeInstanceOf(UserAggregationUserConsent);
				expect(result.parentConsents).toHaveLength(1);
				expect(result.parentConsents?.[0]).toBeInstanceOf(UserAggregationParentConsent);
			});
		});

		describe('when userConsent and parentConsents are undefined', () => {
			const setup = () => {
				const consentData = {
					userConsent: undefined,
					parentConsents: undefined,
				};

				return { consentData };
			};

			it('should handle undefined values correctly', () => {
				const { consentData } = setup();

				const result = new UserAggregationConsent(consentData);

				expect(result.userConsent).toBeUndefined();
				expect(result.parentConsents).toBeUndefined();
			});
		});
	});

	describe('validation', () => {
		describe('when valid nested consent data is provided', () => {
			const setup = () => {
				const userConsent = {
					form: 'digital',
					privacyConsent: true,
					termsOfUseConsent: true,
					dateOfPrivacyConsent: new Date('2023-01-01'),
					dateOfTermsOfUseConsent: new Date('2023-01-01'),
				};

				const parentConsent = {
					_id: '507f1f77bcf86cd799439011',
					form: 'analog',
					privacyConsent: true,
					termsOfUseConsent: false,
					dateOfPrivacyConsent: new Date('2023-01-02'),
					dateOfTermsOfUseConsent: new Date('2023-01-02'),
				};

				const validConsentData = {
					userConsent,
					parentConsents: [parentConsent],
				};

				return { validConsentData };
			};

			it('should pass validation for nested objects', async () => {
				const { validConsentData } = setup();
				const result = new UserAggregationConsent(validConsentData);

				const validationErrors = await validate(result);

				expect(validationErrors).toHaveLength(0);
			});
		});

		describe('when parentConsents is not an array', () => {
			const setup = () => {
				const invalidConsentData = {
					userConsent: undefined,
					parentConsents: 'not-an-array' as unknown as unknown[],
				} as UserAggregationConsent;

				return { invalidConsentData };
			};

			it('should fail validation with array error', async () => {
				const { invalidConsentData } = setup();
				const result = new UserAggregationConsent(invalidConsentData);

				const validationErrors = await validate(result);

				expect(validationErrors.length).toBeGreaterThan(0);
				const parentConsentsError = validationErrors.find((error) => error.property === 'parentConsents');
				expect(parentConsentsError).toBeDefined();
				expect(parentConsentsError?.constraints).toHaveProperty('isArray');
			});
		});
	});
});

describe('UserAggregationClass', () => {
	describe('constructor', () => {
		describe('when all fields are provided', () => {
			const setup = () => {
				const classData = {
					name: 'Test Class',
					gradeLevel: 5,
					yearName: '2023/24',
				};

				return { classData };
			};

			it('should create instance with all properties correctly assigned', () => {
				const { classData } = setup();

				const result = new UserAggregationClass(classData);

				expect(result.name).toBe(classData.name);
				expect(result.gradeLevel).toBe(classData.gradeLevel);
				expect(result.yearName).toBe(classData.yearName);
			});
		});

		describe('when optional fields are undefined', () => {
			const setup = () => {
				const classData = {
					name: 'Test Class',
					gradeLevel: undefined,
					yearName: undefined,
				};

				return { classData };
			};

			it('should handle undefined optional fields correctly', () => {
				const { classData } = setup();

				const result = new UserAggregationClass(classData);

				expect(result.name).toBe(classData.name);
				expect(result.gradeLevel).toBeUndefined();
				expect(result.yearName).toBeUndefined();
			});
		});
	});

	describe('validation', () => {
		describe('when valid data is provided', () => {
			const setup = () => {
				const validClassData = {
					name: 'Test Class',
					gradeLevel: 5,
					yearName: '2023/24',
				};

				return { validClassData };
			};

			it('should pass validation', async () => {
				const { validClassData } = setup();
				const result = new UserAggregationClass(validClassData);

				const validationErrors = await validate(result);

				expect(validationErrors).toHaveLength(0);
			});
		});

		describe('when name is empty', () => {
			const setup = () => {
				const invalidClassData = {
					name: undefined,
					gradeLevel: 5,
					yearName: '2023/24',
				};

				return { invalidClassData };
			};

			it('should fail validation with string error', async () => {
				const { invalidClassData } = setup();
				const result = new UserAggregationClass(invalidClassData as unknown as UserAggregationClass);

				const validationErrors = await validate(result);

				expect(validationErrors.length).toBeGreaterThan(0);
				expect(validationErrors[0].property).toBe('name');
				expect(validationErrors[0].constraints).toHaveProperty('isString');
			});
		});

		describe('when name is not a string', () => {
			const setup = () => {
				const invalidClassData = {
					name: 123 as unknown as string,
					gradeLevel: 5,
					yearName: '2023/24',
				} as UserAggregationClass;

				return { invalidClassData };
			};

			it('should fail validation with string error', async () => {
				const { invalidClassData } = setup();
				const result = new UserAggregationClass(invalidClassData);

				const validationErrors = await validate(result);

				expect(validationErrors.length).toBeGreaterThan(0);
				const nameError = validationErrors.find((error) => error.property === 'name');
				expect(nameError).toBeDefined();
				expect(nameError?.constraints).toHaveProperty('isString');
			});
		});

		describe('when yearName is not a string', () => {
			const setup = () => {
				const invalidClassData = {
					name: 'Test Class',
					gradeLevel: 5,
					yearName: 2023 as unknown as string,
				} as UserAggregationClass;

				return { invalidClassData };
			};

			it('should fail validation with string error', async () => {
				const { invalidClassData } = setup();
				const result = new UserAggregationClass(invalidClassData);

				const validationErrors = await validate(result);

				expect(validationErrors.length).toBeGreaterThan(0);
				const yearNameError = validationErrors.find((error) => error.property === 'yearName');
				expect(yearNameError).toBeDefined();
				expect(yearNameError?.constraints).toHaveProperty('isString');
			});
		});
	});
});

describe('UserAggregationUserConsent', () => {
	describe('constructor', () => {
		describe('when all fields are provided', () => {
			const setup = () => {
				const consentData = {
					form: 'digital',
					privacyConsent: true,
					termsOfUseConsent: true,
					dateOfPrivacyConsent: new Date('2023-01-01'),
					dateOfTermsOfUseConsent: new Date('2023-01-01'),
				};

				return { consentData };
			};

			it('should create instance with all properties correctly assigned', () => {
				const { consentData } = setup();

				const result = new UserAggregationUserConsent(consentData);

				expect(result.form).toBe(consentData.form);
				expect(result.privacyConsent).toBe(consentData.privacyConsent);
				expect(result.termsOfUseConsent).toBe(consentData.termsOfUseConsent);
				expect(result.dateOfPrivacyConsent).toBe(consentData.dateOfPrivacyConsent);
				expect(result.dateOfTermsOfUseConsent).toBe(consentData.dateOfTermsOfUseConsent);
			});
		});
	});

	describe('validation', () => {
		describe('when valid data is provided', () => {
			const setup = () => {
				const validConsentData = {
					form: 'digital',
					privacyConsent: true,
					termsOfUseConsent: true,
					dateOfPrivacyConsent: new Date('2023-01-01'),
					dateOfTermsOfUseConsent: new Date('2023-01-01'),
				};

				return { validConsentData };
			};

			it('should pass validation', async () => {
				const { validConsentData } = setup();
				const result = new UserAggregationUserConsent(validConsentData);

				const validationErrors = await validate(result);

				expect(validationErrors).toHaveLength(0);
			});
		});

		describe('when boolean fields are not boolean', () => {
			const setup = () => {
				const invalidConsentData = {
					form: 'digital',
					privacyConsent: 'true' as unknown as boolean,
					termsOfUseConsent: 'false' as unknown as boolean,
					dateOfPrivacyConsent: new Date('2023-01-01'),
					dateOfTermsOfUseConsent: new Date('2023-01-01'),
				} as UserAggregationUserConsent;

				return { invalidConsentData };
			};

			it('should fail validation with boolean errors', async () => {
				const { invalidConsentData } = setup();
				const result = new UserAggregationUserConsent(invalidConsentData);

				const validationErrors = await validate(result);

				expect(validationErrors.length).toBeGreaterThan(0);

				const errorProperties = validationErrors.map((error) => error.property);
				expect(errorProperties).toContain('privacyConsent');
				expect(errorProperties).toContain('termsOfUseConsent');
			});
		});

		describe('when form is not a string', () => {
			const setup = () => {
				const invalidConsentData = {
					form: 123 as unknown as string,
					privacyConsent: true,
					termsOfUseConsent: true,
					dateOfPrivacyConsent: new Date('2023-01-01'),
					dateOfTermsOfUseConsent: new Date('2023-01-01'),
				} as UserAggregationUserConsent;

				return { invalidConsentData };
			};

			it('should fail validation with string error', async () => {
				const { invalidConsentData } = setup();
				const result = new UserAggregationUserConsent(invalidConsentData);

				const validationErrors = await validate(result);

				expect(validationErrors.length).toBeGreaterThan(0);
				const formError = validationErrors.find((error) => error.property === 'form');
				expect(formError).toBeDefined();
				expect(formError?.constraints).toHaveProperty('isString');
			});
		});

		describe('when date fields are invalid', () => {
			const setup = () => {
				const invalidConsentData = {
					form: 'digital',
					privacyConsent: true,
					termsOfUseConsent: true,
					dateOfPrivacyConsent: 'invalid-date' as unknown as Date,
					dateOfTermsOfUseConsent: 'also-invalid' as unknown as Date,
				} as UserAggregationUserConsent;

				return { invalidConsentData };
			};

			it('should fail validation with date string errors', async () => {
				const { invalidConsentData } = setup();
				const result = new UserAggregationUserConsent(invalidConsentData);

				const validationErrors = await validate(result);

				expect(validationErrors.length).toBeGreaterThan(0);

				const errorProperties = validationErrors.map((error) => error.property);
				expect(errorProperties).toContain('dateOfPrivacyConsent');
				expect(errorProperties).toContain('dateOfTermsOfUseConsent');
			});
		});
	});
});

describe('UserAggregationParentConsent', () => {
	describe('constructor', () => {
		describe('when all fields are provided', () => {
			const setup = () => {
				const parentConsentData = {
					_id: '507f1f77bcf86cd799439011',
					form: 'analog',
					privacyConsent: true,
					termsOfUseConsent: false,
					dateOfPrivacyConsent: new Date('2023-01-02'),
					dateOfTermsOfUseConsent: new Date('2023-01-02'),
				};

				return { parentConsentData };
			};

			it('should create instance with all properties correctly assigned', () => {
				const { parentConsentData } = setup();

				const result = new UserAggregationParentConsent(parentConsentData);

				expect(result._id).toBe(parentConsentData._id);
				expect(result.form).toBe(parentConsentData.form);
				expect(result.privacyConsent).toBe(parentConsentData.privacyConsent);
				expect(result.termsOfUseConsent).toBe(parentConsentData.termsOfUseConsent);
				expect(result.dateOfPrivacyConsent).toBe(parentConsentData.dateOfPrivacyConsent);
				expect(result.dateOfTermsOfUseConsent).toBe(parentConsentData.dateOfTermsOfUseConsent);
			});
		});
	});

	describe('validation', () => {
		describe('when valid data is provided', () => {
			const setup = () => {
				const validParentConsentData = {
					_id: '507f1f77bcf86cd799439011',
					form: 'analog',
					privacyConsent: true,
					termsOfUseConsent: false,
					dateOfPrivacyConsent: new Date('2023-01-02'),
					dateOfTermsOfUseConsent: new Date('2023-01-02'),
				};

				return { validParentConsentData };
			};

			it('should pass validation', async () => {
				const { validParentConsentData } = setup();
				const result = new UserAggregationParentConsent(validParentConsentData);

				const validationErrors = await validate(result);

				expect(validationErrors).toHaveLength(0);
			});
		});

		describe('when invalid MongoDB ObjectId is provided', () => {
			const setup = () => {
				const invalidParentConsentData = {
					_id: 'invalid-id',
					form: 'analog',
					privacyConsent: true,
					termsOfUseConsent: false,
					dateOfPrivacyConsent: new Date('2023-01-02'),
					dateOfTermsOfUseConsent: new Date('2023-01-02'),
				} as UserAggregationParentConsent;

				return { invalidParentConsentData };
			};

			it('should fail validation with MongoId error', async () => {
				const { invalidParentConsentData } = setup();
				const result = new UserAggregationParentConsent(invalidParentConsentData);

				const validationErrors = await validate(result);

				expect(validationErrors.length).toBeGreaterThan(0);
				expect(validationErrors[0].property).toBe('_id');
				expect(validationErrors[0].constraints).toHaveProperty('isMongoId');
			});
		});

		describe('when inherited form field is invalid', () => {
			const setup = () => {
				const invalidParentConsentData = {
					_id: '507f1f77bcf86cd799439011',
					form: null as unknown as string,
					privacyConsent: true,
					termsOfUseConsent: false,
					dateOfPrivacyConsent: new Date('2023-01-02'),
					dateOfTermsOfUseConsent: new Date('2023-01-02'),
				} as UserAggregationParentConsent;

				return { invalidParentConsentData };
			};

			it('should fail validation with string error for inherited field', async () => {
				const { invalidParentConsentData } = setup();
				const result = new UserAggregationParentConsent(invalidParentConsentData);

				const validationErrors = await validate(result);

				expect(validationErrors.length).toBeGreaterThan(0);
				const formError = validationErrors.find((error) => error.property === 'form');
				expect(formError).toBeDefined();
				expect(formError?.constraints).toHaveProperty('isString');
			});
		});

		describe('when inherited boolean fields are invalid', () => {
			const setup = () => {
				const invalidParentConsentData = {
					_id: '507f1f77bcf86cd799439011',
					form: 'analog',
					privacyConsent: 'yes' as unknown as boolean,
					termsOfUseConsent: 'no' as unknown as boolean,
					dateOfPrivacyConsent: new Date('2023-01-02'),
					dateOfTermsOfUseConsent: new Date('2023-01-02'),
				} as UserAggregationParentConsent;

				return { invalidParentConsentData };
			};

			it('should fail validation with boolean errors for inherited fields', async () => {
				const { invalidParentConsentData } = setup();
				const result = new UserAggregationParentConsent(invalidParentConsentData);

				const validationErrors = await validate(result);

				expect(validationErrors.length).toBeGreaterThan(0);

				const errorProperties = validationErrors.map((error) => error.property);
				expect(errorProperties).toContain('privacyConsent');
				expect(errorProperties).toContain('termsOfUseConsent');
			});
		});
	});
});
