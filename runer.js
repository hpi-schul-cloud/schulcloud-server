const axios = require('axios');

const path = '/admin/api/v1';
const endPointSchools = '/admin/schools';
const endPointUsers = '/admin/users';
const federalStateNames = {
	nbc: 'Niedersachsen',
	brb: 'Brandenburg',
	dbc: 'Niedersachsen',
};
const users = {
	admin: 'administrator',
	teacher: 'teacher',
	student: 'student',
};
const userData = {
	admin1: {
		firstName: 'cypress',
		lastName: 'admin_1',
	},
	teacher1: {
		firstName: 'cypress',
		lastName: 'teacher_1',
	},
	student1: {
		firstName: 'cypress',
		lastName: 'student_1',
	},
	admin2: {
		firstName: 'cypress',
		lastName: 'admin_2',
	},
	teacher2: {
		firstName: 'cypress',
		lastName: 'teacher_2',
	},
	student2: {
		firstName: 'cypress',
		lastName: 'student_2',
	},
};

const headers = {
	'Content-Type': 'application/json',
};

const extractSubdomain = (url) => {
	try {
		const parsedUrl = new URL(url);
		return parsedUrl.hostname.split('.')[1];
	} catch (error) {
		console.error('Error parsing URL:', error.message);
		return null;
	}
};

const createSchool = async (schoolUrl, headers) => {
	try {
		const payload = {
			name: `cypress-automated-tests-sh`,
			federalStateName: 'Niedersachsen',
		};
		const response = await axios.post(schoolUrl, payload, { headers });
		const { id } = response.data;
		console.log(`School created with ID: ${id}`);
		return { id };
	} catch (error) {
		console.error('Error creating school:', error.message);
		throw error;
	}
};

const generateRandomUserEmail = () => {
	const commonNames = ['john', 'emma', 'michael', 'sarah', 'david'];
	const randomName = commonNames[Math.floor(Math.random() * commonNames.length)];
	const timestamp = new Date().getTime();
	const randomNumber = Math.floor(Math.random() * 1000);
	const emailDomain = 'cypress-mail.de';
	return `${randomName}_${randomNumber}_${timestamp}@${emailDomain}`;
};

const getUrl = (baseUrl) => {
	const schoolUrl = `${baseUrl.toLowerCase().replace(/\/$/, '')}${path}${endPointSchools}`;
	const userUrl = `${baseUrl.toLowerCase().replace(/\/$/, '')}${path}${endPointUsers}`;

	return { schoolUrl, userUrl };
};

const getUserRole = (userType) => {
	const roleName = userType.split('_')[0].slice(0, -1);
	const matchedRole = Object.keys(users).find((role) => roleName === role);
	return matchedRole ? users[matchedRole] : 'unknown';
};

const generatePayload = (schoolId, userType, role) => {
	const userRole = userType.split('_')[0];

	if (userData.hasOwnProperty(userRole)) {
		return {
			schoolId,
			firstName: userData[userRole].firstName,
			lastName: userData[userRole].lastName,
			email: generateRandomUserEmail(),
			roleNames: [role],
		};
	}
	console.warn(`User type "${userType}" not found in userData.`);
	return {};
};

const createUser = async (baseUrl, apiKeys, schoolId, userType) => {
	try {
		const { schoolUrl, userUrl } = getUrl(baseUrl);

		const finalHeaders = { ...headers };
		if (!finalHeaders.hasOwnProperty('x-api-key')) {
			finalHeaders['x-api-key'] = apiKeys;
		}

		if (schoolId === undefined) {
			const { id } = await createSchool(schoolUrl, finalHeaders);
			schoolId = id;
		} else {
			console.log(`User created using existing school ID: ${schoolId}`);
		}

		const role = getUserRole(userType);
		if (!role) {
			throw new Error('Invalid user type');
		}

		const payload = generatePayload(schoolId, userType, role);

		const response = await axios.post(userUrl, payload, {
			headers: finalHeaders,
		});

		const { username, initialPassword } = response.data;
		return { schoolId, username, initialPassword };
	} catch (error) {
		console.error('Error creating users:', error.message);
		if (error.response) {
			console.error('Response data:', error.response.data);
			console.error('Response status:', error.response.status);
			console.error('Response headers:', JSON.stringify(error.response.headers));
		}
		throw error;
	}
};
console.log('Creating user');
createUser('http://localhost:4030', '6ab2af04-a7ad-4688-b6f9-91d948bf4320', undefined, 'student1_dbc');
