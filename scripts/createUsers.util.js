#!/usr/bin/env node

/**
 * createUsers.util.js
 *
 * A utility script to create multiple users via REST API and optionally add them to a room.
 * All created users will have the firstName "Durmock".
 *
 * Usage: node scripts/createUsers.util.js
 *
 * Prerequisites:
 * - A valid JWT token from an administrator account
 * - The base URL of the API server
 */

const readline = require('readline');
const axios = require('axios');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

/**
 * Prompts the user for input
 * @param {string} question - The question to ask
 * @returns {Promise<string>} - The user's response
 */
function prompt(question) {
	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			resolve(answer.trim());
		});
	});
}

/**
 * Displays script information and purpose
 */
function displayInfo() {
	console.log('');
	console.log('='.repeat(70));
	console.log('              CREATE USERS UTILITY SCRIPT');
	console.log('='.repeat(70));
	console.log('');
	console.log('This script allows you to:');
	console.log('  1. Create multiple teacher users via the REST API');
	console.log('  2. Optionally add the created users to a room as "roomviewer"');
	console.log('');
	console.log('All created users will have:');
	console.log('  - firstName: "Durmock"');
	console.log('  - lastName: auto-generated unique identifier');
	console.log('  - email: auto-generated unique email');
	console.log('');
	console.log('Requirements:');
	console.log('  - A valid JWT token from an administrator account');
	console.log('  - The user must have permission to create teachers');
	console.log('  - For room assignment: the user must have permission to add members');
	console.log('');
	console.log('='.repeat(70));
	console.log('');
}

/**
 * Creates axios instances for different API versions
 * @param {string} baseUrl - The API base URL (without port)
 * @param {string} jwt - The JWT token
 * @returns {{v1Api: import('axios').AxiosInstance, v3Api: import('axios').AxiosInstance}} - Configured axios instances
 */
function createApiClients(baseUrl, jwt) {
	const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
	const isLocalhost = normalizedBaseUrl.includes('localhost') || normalizedBaseUrl.includes('127.0.0.1');
	const apiV1PortSuffix = isLocalhost ? ':3030' : '';
	const apiV3PortSuffix = isLocalhost ? ':4000' : '';

	const headers = {
		Authorization: `Bearer ${jwt}`,
		'Content-Type': 'application/json',
	};

	// API v1 on port 3030 for user creation
	const v1Api = axios.create({
		baseURL: `${normalizedBaseUrl}${apiV1PortSuffix}/api/v1`,
		headers,
	});

	// API v3 on port 4000 for /me and /rooms
	const v3Api = axios.create({
		baseURL: `${normalizedBaseUrl}${apiV3PortSuffix}/api/v3`,
		headers,
	});

	return { v1Api, v3Api };
}

/**
 * Fetches the current user's information including schoolId
 * @param {import('axios').AxiosInstance} v3Api - The axios instance for API v3
 * @returns {Promise<{schoolId: string, userId: string}>} - User info
 */
async function getCurrentUserInfo(v3Api) {
	try {
		const response = await v3Api.get('/me');
		console.log(`Current user: ${response.data.firstName} ${response.data.lastName} (ID: ${response.data._id})`);
		return {
			schoolId: response.data.schoolId,
			userId: response.data._id,
		};
	} catch (error) {
		if (error.response) {
			throw new Error(`Failed to get user info: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
		}
		throw new Error(`Failed to get user info: ${error.message}`);
	}
}

/**
 * Creates a single user
 * @param {import('axios').AxiosInstance} v1Api - The axios instance for API v1
 * @param {string} schoolId - The school ID
 * @param {string} teacherRoleId - The teacher role ID
 * @param {number} index - The user index (for generating unique data)
 * @returns {Promise<{userId: string, email: string, firstName: string, lastName: string}>} - Created user info
 */
async function createUser(v1Api, schoolId, teacherRoleId, index) {
	const timestamp = Date.now();
	const uniqueId = `${timestamp}_${index}`;
	const email = `u${uniqueId}@example.com`;
	const lastName = `User_${uniqueId}`;
	const firstName = 'Durmock';

	try {
		const response = await v1Api.post('/users', {
			firstName,
			lastName,
			email,
			schoolId,
			roles: [teacherRoleId],
		});

		return {
			userId: response.data._id,
			email,
			firstName,
			lastName,
		};
	} catch (error) {
		if (error.response) {
			throw new Error(`Failed to create user: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
		}
		throw new Error(`Failed to create user: ${error.message}`);
	}
}

/**
 * Adds users to a room with roomviewer role
 * @param {import('axios').AxiosInstance} v3Api - The axios instance for API v3
 * @param {string} roomId - The room ID
 * @param {string[]} userIds - Array of user IDs to add
 * @returns {Promise<void>}
 */
async function addUsersToRoom(v3Api, roomId, userIds) {
	try {
		await v3Api.patch(`/rooms/${roomId}/members/add`, {
			userIds,
		});
	} catch (error) {
		if (error.response) {
			throw new Error(`Failed to add users to room: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
		}
		throw new Error(`Failed to add users to room: ${error.message}`);
	}
}

/**
 * Main function
 */
async function main() {
	displayInfo();

	try {
		// Get base URL
		const baseUrl = (await prompt('Enter the API base URL (e.g., http://localhost): ')) || 'http://localhost';
		if (!baseUrl) {
			console.error('Error: Base URL is required.');
			process.exit(1);
		}

		// Get JWT
		const jwt = await prompt('Enter your JWT token: ');
		if (!jwt) {
			console.error('Error: JWT token is required.');
			process.exit(1);
		}

		// Create API clients
		const { v1Api, v3Api } = createApiClients(baseUrl, jwt);

		// Validate JWT and get schoolId
		console.log('\nValidating JWT and fetching user info...');
		const userInfo = await getCurrentUserInfo(v3Api);
		console.log(`Authenticated successfully. SchoolId: ${userInfo.schoolId}`);

		// Fetch teacher role ID
		console.log('\nFetching teacher role...');
		const teacherRoleId =
			(await prompt('Enter teacher role ID (default: 0000d186816abba584714c98): ')) || '0000d186816abba584714c98';

		// Get number of users
		const userCountStr = await prompt('\nHow many users should be created? ');
		const userCount = parseInt(userCountStr, 10);
		if (isNaN(userCount) || userCount <= 0) {
			console.error('Error: Please enter a valid positive number.');
			process.exit(1);
		}

		// Get room ID (optional)
		const roomId = await prompt('\nEnter room ID to add users to (press Enter to skip): ');

		console.log('\n' + '-'.repeat(70));
		console.log(`Creating ${userCount} users...`);
		console.log('-'.repeat(70));

		const createdUsers = [];
		const errors = [];

		for (let i = 0; i < userCount; i++) {
			try {
				const user = await createUser(v1Api, userInfo.schoolId, teacherRoleId, i);
				createdUsers.push(user);
				console.log(`[${i + 1}/${userCount}] Created user: ${user.email} (ID: ${user.userId})`);
			} catch (error) {
				errors.push({ index: i, error: error.message });
				console.error(`[${i + 1}/${userCount}] Failed to create user: ${error.message}`);
			}
		}

		console.log('\n' + '-'.repeat(70));
		console.log(`Successfully created ${createdUsers.length} out of ${userCount} users.`);

		// Add users to room if room ID was provided
		if (roomId && createdUsers.length > 0) {
			console.log(`\nAdding ${createdUsers.length} users to room ${roomId}...`);
			try {
				const userIds = createdUsers.map((u) => u.userId);
				await addUsersToRoom(v3Api, roomId, userIds);
				console.log(`Successfully added ${createdUsers.length} users to room with role "roomviewer".`);
			} catch (error) {
				console.error(`Failed to add users to room: ${error.message}`);
			}
		}

		// Summary
		console.log('\n' + '='.repeat(70));
		console.log('                         SUMMARY');
		console.log('='.repeat(70));
		console.log(`Total users requested:  ${userCount}`);
		console.log(`Successfully created:   ${createdUsers.length}`);
		console.log(`Failed:                 ${errors.length}`);
		if (roomId) {
			console.log(`Room ID:                ${roomId}`);
		}
		console.log('');

		if (createdUsers.length > 0) {
			console.log('Created users:');
			createdUsers.forEach((user, index) => {
				console.log(`  ${index + 1}. ${user.firstName} ${user.lastName}`);
				console.log(`     Email:  ${user.email}`);
				console.log(`     UserId: ${user.userId}`);
			});
		}

		if (errors.length > 0) {
			console.log('\nErrors:');
			errors.forEach((err) => {
				console.log(`  User ${err.index + 1}: ${err.error}`);
			});
		}

		console.log('\n' + '='.repeat(70));
	} catch (error) {
		console.error(`\nError: ${error.message}`);
		process.exit(1);
	} finally {
		rl.close();
	}
}

// Run the script
main();
