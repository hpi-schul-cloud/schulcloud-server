const axios = require('axios');
const cookie = require('cookie');

/**
 * Type of entities.
 * @enum {number}
 */
const EntityType = {
	CLASS: 1,
	TEACHER: 2,
	SUBJECT: 3,
	ROOM: 4,
	STUDENT: 5
};

/**
 * Client for the WebUntis API.
 * @class
 */
class WebUntisApi {
	/**
	 * Constructor.
	 *
	 * @param {string} url - Base URL to the WebUntis API
	 * @param {string} school - Name of school
s	 */
	constructor(url, school) {
		// Save configuration
		this.clientId = 'schulcloud';
		this.url = url;
		this.school = school;
		this.session = {};

		// Create REST client
		this.rpc = axios.create({
			baseURL: this.url,
			maxRedirects: 0,
			headers: {
				'Cache-Control': 'no-cache',
				'Pragma': 'no-cache',
				'X-Requested-With': 'XMLHttpRequest'
			}
		});
	}

	/**
	 * Log in to WebUntis.
	 *
	 * @param {string} username - User name
	 * @param {string} password - User password
	 *
	 * @return {Promise<Object>} Session data
	 */
	async login(username, password) {
		// Send login request
		const response = await this.rpc.post(`/WebUntis/jsonrpc.do?school=${this.school}`, {
			jsonrpc: '2.0',
			id: 'login',
			method: 'authenticate',
			params: {
				client: this.clientId,
				user: username,
				password: password
			}
		});

		// Check result
		if (typeof(response.data) !== 'object') {
			throw new Error('Invalid response.');
		}

		if (!response.data.result || (response.data.result.code || !response.data.result.sessionId)) {
			throw new Error('Unable to log in. Result: ' + JSON.stringify(response.data));
		}

		// Save session data
		this.session = response.data.result;

		// Add session ID
		this.rpc = axios.create({
			baseURL: this.url,
			maxRedirects: 0,
			headers: {
				'Cache-Control': 'no-cache',
				'Pragma': 'no-cache',
				'X-Requested-With': 'XMLHttpRequest',
				'Cookie': cookie.serialize('JSESSIONID', this.session.sessionId)
			}
		});

		// Return result
		return response.data.result;
	}

	/**
	 * Log out from WebUntis.
	 */
	async logout() {
		// Send logout request
		const response = await this.rpc.post(`/WebUntis/jsonrpc.do?school=${this.school}`, {
			jsonrpc: '2.0',
			id: 'logout',
			method: 'logout',
			params: {}
		});

		// Reset session data
		this.session = null;

		// Return result
		return response.data.result;
	}

	/**
	 * Get teachers.
	 *
	 * @return {Promise<Array>} List of teachers
	 */
	async getTeachers() {
		// [TODO] Returns empty data on current test account

		// Send request
		const response = await this.sendRequest('getTeachers', {});
		return response.data.result;
	}

	/**
	 * Get students.
	 *
	 * @return {Promise<Array>} List of students
	 */
	async getStudents() {
		// [TODO] Returns empty data on current test account

		// Send request
		const response = await this.sendRequest('getStudents', {});
		return response.data.result;
	}

	/**
	 * Get classes.
	 *
	 * @return {Promise<Array>} List of classes
	 */
	async getClasses(schoolyearId = null) {
		// Create parameters
		var params = {};
		if (schoolyearId) {
			params.schoolyearId = schoolyearId;
		}

		// Send request
		const response = await this.sendRequest('getKlassen', params);
		return response.data.result;

		// [TODO] name -> schoolyearId
	}

	/**
	 * Get subjects.
	 *
	 * @return {Promise<Array>} List of subjects
	 */
	async getSubjects() {
		// Send request
		const response = await this.sendRequest('getSubjects', {});
		return response.data.result;
	}

	/**
	 * Get rooms.
	 *
	 * @return {Promise<Array>} List of rooms
	 */
	async getRooms() {
		// Send request
		const response = await this.sendRequest('getRooms', {});
		return response.data.result;
	}

	/**
	 * Get departments.
	 *
	 * @return {Promise<Array>} List of departments
	 */
	async getDepartments() {
		// Send request
		const response = await this.sendRequest('getDepartments', {});
		return response.data.result;
	}

	/**
	 * Get holidays.
	 *
	 * @return {Promise<Array>} List of holidays
	 */
	async getHolidays() {
		// Send request
		const response = await this.sendRequest('getHolidays', {});
		return response.data.result;
	}

	/**
	 * Get the school's time grid.
	 *
	 * @return {Promise<Array>} Time grid
	 */
	async getTimegrid() {
		// Send request
		const response = await this.sendRequest('getTimegridUnits', {});
		return response.data.result;
	}

	/**
	 * Get status for displaying WebUntis data (e.g., colors)
	 *
	 * @return {Promise<Object>} Status data
	 */
	async getStatusData() {
		// Send request
		const response = await this.sendRequest('getStatusData', {});
		return response.data.result;
	}

	/**
	 * Get the current school year
	 *
	 * @return {Promise<Object>} School year information
	 */
	async getCurrentSchoolyear() {
		// Send request
		const response = await this.sendRequest('getCurrentSchoolyear', {});
		return response.data.result;
	}

	/**
	 * Get school years.
	 *
	 * @return {Promise<Array>} List of year information
	 */
	async getSchoolyears() {
		// Send request
		const response = await this.sendRequest('getSchoolyears', {});
		return response.data.result;
	}

	/**
	 * Get timetable for a class.
	 *
	 * @param {number} classId - Class ID
	 * @param {number} [startDate=0] - Start date
	 * @param {number} [endDate=0] - End date
	 *
	 * @return {Promise<Array>} List of timetable entries
	 */
	async getTimetableForClass(classId, startDate = 0, endDate = 0) {
		return this.getTimetableFor(EntityType.CLASS, classId, startDate, endDate);
	}

	/**
	 * Get timetable for a teacher.
	 *
	 * @param {number} teacherId - Teacher ID
	 * @param {number} [startDate=0] - Start date
	 * @param {number} [endDate=0] - End date
	 *
	 * @return {Promise<Array>} List of timetable entries
	 */
	async getTimetableForTeacher(teacherId, startDate = 0, endDate = 0) {
		return this.getTimetableFor(EntityType.TEACHER, teacherId, startDate, endDate);
	}

	/**
	 * Get timetable for a subject.
	 *
	 * @param {number} subjectId - Subject ID
	 * @param {number} [startDate=0] - Start date
	 * @param {number} [endDate=0] - End date
	 *
	 * @return {Promise<Array>} List of timetable entries
	 */
	async getTimetableForSubject(subjectId, startDate = 0, endDate = 0) {
		return this.getTimetableFor(EntityType.SUBJECT, subjectId, startDate, endDate);
	}

	/**
	 * Get timetable for a room.
	 *
	 * @param {number} roomId - Room ID
	 * @param {number} [startDate=0] - Start date
	 * @param {number} [endDate=0] - End date
	 *
	 * @return {Promise<Array>} List of timetable entries
	 */
	async getTimetableForRoom(roomId, startDate = 0, endDate = 0) {
		return this.getTimetableFor(EntityType.ROOM, roomId, startDate, endDate);
	}

	/**
	 * Get timetable for a student.
	 *
	 * @param {number} studentId - Student ID
	 * @param {number} [startDate=0] - Start date
	 * @param {number} [endDate=0] - End date
	 *
	 * @return {Promise<Array>} List of timetable entries
	 */
	async getTimetableForStudent(studentId, startDate = 0, endDate = 0) {
		return this.getTimetableFor(EntityType.STUDENT, studentId, startDate, endDate);
	}

	/**
	 * Get timetable for any entity.
	 *
	 * @param {EntityType} type - Type of entity
	 * @param {number} id - ID of entity
	 * @param {number} [startDate=0] - Start date
	 * @param {number} [endDate=0] - End date
	 *
	 * @return {Promise<Array>} List of timetable entries
	 */
	async getTimetableFor(type, id, startDate = 0, endDate = 0) {
		// Create parameters
		var params = {
			type: type,
			id: id
		};

		if (startDate != 0) {
			params.startDate = startDate;
		}

		if (endDate != 0) {
			params.endDate = endDate;
		}

		// [TODO] Check optional parameters, see 15) Request timetable for an element (customizable)

		// Send request
		const response = await this.sendRequest('getTimetable', params);
		return response.data.result;
	}

	/**
	 * Get time of last data import.
	 *
	 * @return {Promise<Object>} Time stamp
	 */
	async getLatestImportTime() {
		// Send request
		const response = await this.sendRequest('getLatestImportTime', {});
		return { date: response.data.result };
	}

	/**
	 * Search for teacher.
	 *
	 * @param {string} forename - First name
	 * @param {string} surname - Family name
	 * @param {number} [birthDate=0] - Birth date
	 *
	 * @return {Promise<Object>} Teacher information
	 */
	async searchForTeacher(forename, surname, birthDate = 0) {
		// [TODO] Could not be tested due to empty test data
		return this.searchFor(EntityType.TEACHER, forename, surname, birthDate);
	}

	/**
	 * Search for student.
	 *
	 * @param {string} forename - First name
	 * @param {string} surname - Family name
	 * @param {number} [birthDate=0] - Birth date
	 *
	 * @return {Promise<Object>} Student information
	 */
	async searchForStudent(forename, surname, birthDate = 0) {
		// [TODO] Could not be tested due to empty test data
		return this.searchFor(EntityType.STUDENT, forename, surname, birthDate);
	}

	/**
	 * Search for person (teacher or student).
	 *
	 * @param {EntityType} type - Type of entity
	 * @param {string} forename - First name
	 * @param {string} surname - Family name
	 * @param {number} [birthDate=0] - Birth date
	 *
	 * @return {Promise<Object>} Student or teacher information
	 */
	async searchFor(type, forename, surname, birthDate = 0) {
		// [TODO] Could not be tested due to empty test data

		// Create parameters
		var params = {
			type: type,
			sn: surname,
			fn: forename,
			dob: birthDate || 0,
			id: id
		};

		// Send request
		const response = await this.sendRequest('getPersonId', params);
		return response.data.result;
	}

	/**
	 * Get substitutions.
	 *
	 * @param {number} startDate - Start date
	 * @param {number} endDate - End date
	 * @param {number} [departmentId=0] - ID of department
	 *
	 * @return {Promise<Array>} List of substitutions
	 */
	async getSubstitutions(startDate, endDate, departmentId = 0) {
		// Create parameters
		var params = {
			startDate: startDate,
			endDate: endDate,
			departmentId: departmentId
		};

		// Send request
		const response = await this.sendRequest('getSubstitutions', params);
		return response.data.result;
	}

	/**
	 * Get remark categories.
	 *
	 * @return {Promise<Array>} List of remark categories
	 */
	async getRemarkCategories() {
		// [TODO] Returns empty data on current test account

		// Send request
		const response = await this.sendRequest('getClassregCategories', {});
		return response.data.result;
	}

	/**
	 * Get remark category groups.
	 *
	 * @return {Promise<Array>} List of remark category groups
	 */
	async getRemarkCategoryGroups() {
		// [TODO] Returns empty data on current test account

		// Send request
		const response = await this.sendRequest('getClassregCategoryGroups', {});
		return response.data.result;
	}

	/**
	 * Get remarks.
	 *
	 * @param {number} startDate - Start date
	 * @param {number} endDate - End date
	 *
	 * @return {Promise<Array>} List of remarks
	 */
	async getRemarks(startDate, endDate) {
		// [TODO] Returns empty data on current test account

		// Create parameters
		var params = {
			startDate: startDate,
			endDate: endDate
		};

		// Send request
		const response = await this.sendRequest('getClassregEvents', params);
		return response.data.result;
	}

	/**
	 * Get remarks for a class.
	 *
	 * @param {number} classId - Class ID
	 * @param {number} startDate - Start date
	 * @param {number} endDate - End date
	 *
	 * @return {Promise<Array>} List of remarks
	 */
	async getRemarksForClass(classId, startDate, endDate) {
		return this.getRemarksFor(EntityType.CLASS, classId, startDate, endDate);
	}

	/**
	 * Get remarks for a student.
	 *
	 * @param {number} studentId - Student ID
	 * @param {number} startDate - Start date
	 * @param {number} endDate - End date
	 *
	 * @return {Promise<Array>} List of remarks
	 */
	async getRemarksForStudent(studentId, startDate, endDate) {
		return this.getRemarksFor(EntityType.STUDENT, studentId, startDate, endDate);
	}

	/**
	 * Get remarks for any entity.
	 *
	 * @param {EntityType} type - Type of entity
	 * @param {number} id - ID of entity
	 * @param {number} startDate - Start date
	 * @param {number} endDate - End date
	 *
	 * @return {Promise<Array>} List of remarks
	 */
	async getRemarksFor(type, id, startDate, endDate) {
		// [TODO] Returns empty data on current test account

		// Create parameters
		var params = {
			startDate: startDate,
			endDate: endDate,
			element: {
				keyType: 'id',
				type: type,
				id: id
			}
		};

		// Send request
		const response = await this.sendRequest('getClassregEvents', params);
		return response.data.result;
	}

	/**
	 * Get exam types.
	 *
	 * @return {Promise<Array>} List of exam types
	 */
	async getExamTypes() {
		// [TODO] Returns empty data on current test account

		// Send request
		const response = await this.sendRequest('getExamTypes', {});
		return response.data.result;
	}

	/**
	 * Get exams.
	 *
	 * @param {number} startDate - Start date
	 * @param {number} endDate - End date
	 * @param {number} examType - Exam type
	 *
	 * @return {Promise<Array>} List of exams
	 */
	async getExams(startDate, endDate, examType) {
		// [TODO] Could not be tested due to empty test data

		// Create parameters
		var params = {
			startDate: startDate,
			endDate: endDate,
			examTypeId: examType
		};

		// Send request
		const response = await this.sendRequest('getExams', params);
		return response.data.result;
	}

	/**
	 * Get timetable with absence times.
	 *
	 * @param {number} startDate - Start date
	 * @param {number} endDate - End date
	 *
	 * @return {Promise<Array>} List of timetable entries
	 */
	async getTimetableWithAbsences(startDate, endDate) {
		// [TODO] Returns empty data on current test account

		// Create parameters
		var params = {
			startDate: startDate,
			endDate: endDate
		};

		// Send request
		const response = await this.sendRequest('getTimetableWithAbsences', params);
		return response.data.result;
	}

	/**
	 * Send request to WebUntis API.
	 *
	 * @param {string} method - Method name
	 * @param {Object} params - Parameters
	 *
	 * @return {Promise} Response from the API
	 */
	async sendRequest(method, params) {
		// Send request
		return this.rpc.post(`/WebUntis/jsonrpc.do?school=${this.school}`, {
			jsonrpc: '2.0',
			id: method,
			method: method,
			params: params
		});
	}
}

module.exports = WebUntisApi;
