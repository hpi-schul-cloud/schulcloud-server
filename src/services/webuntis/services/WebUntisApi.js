const axios = require('axios');
const cookie = require('cookie');

class WebUntisApi {
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

	async getTeachers() {
		// [TODO] Returns empty data on current test account

		// Send request
		const response = await this.sendRequest('getTeachers', {});
		return response.data.result;
	}

	async getStudents() {
		// [TODO] Returns empty data on current test account

		// Send request
		const response = await this.sendRequest('getStudents', {});
		return response.data.result;
	}

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

	async getSubjects() {
		// Send request
		const response = await this.sendRequest('getSubjects', {});
		return response.data.result;
	}

	async getRooms() {
		// Send request
		const response = await this.sendRequest('getRooms', {});
		return response.data.result;
	}

	async getDepartments() {
		// Send request
		const response = await this.sendRequest('getDepartments', {});
		return response.data.result;
	}

	async getHolidays() {
		// Send request
		const response = await this.sendRequest('getHolidays', {});
		return response.data.result;
	}

	async getTimegrid() {
		// Send request
		const response = await this.sendRequest('getTimegridUnits', {});
		return response.data.result;
	}

	async getStatusData() {
		// Send request
		const response = await this.sendRequest('getStatusData', {});
		return response.data.result;
	}

	async getCurrentSchoolyear() {
		// Send request
		const response = await this.sendRequest('getCurrentSchoolyear', {});
		return response.data.result;
	}

	async getSchoolyears() {
		// Send request
		const response = await this.sendRequest('getSchoolyears', {});
		return response.data.result;
	}

	async getTimetableForClass(classId, startDate = '', endDate = '') {
		return this.getTimetableFor(1, classId, startDate, endDate);
	}

	async getTimetableForTeacher(teacherId, startDate = '', endDate = '') {
		return this.getTimetableFor(2, teacherId, startDate, endDate);
	}

	async getTimetableForSubject(subjectId, startDate = '', endDate = '') {
		return this.getTimetableFor(3, subjectId, startDate, endDate);
	}

	async getTimetableForRoom(roomId, startDate = '', endDate = '') {
		return this.getTimetableFor(4, roomId, startDate, endDate);
	}

	async getTimetableForStudent(studentId, startDate = '', endDate = '') {
		return this.getTimetableFor(5, studentId, startDate, endDate);
	}

	async getTimetableFor(type, id, startDate = '', endDate = '') {
		// Create parameters
		var params = {
			type: type,
			id: id
		};

		if (startDate != '') {
			params.startDate = startDate;
		}

		if (endDate != '') {
			params.endDate = endDate;
		}

		// [TODO] Check optional parameters, see 15) Request timetable for an element (customizable)

		// Send request
		const response = await this.sendRequest('getTimetable', params);
		return response.data.result;
	}

	async getLatestImportTime() {
		// Send request
		const response = await this.sendRequest('getLatestImportTime', {});
		return response.data;
	}

	async searchForTeacher(forename, surname, birthDate = null) {
		// [TODO] Could not be tested due to empty test data
		return this.searchFor(2, forename, surname, birthDate);
	}

	async searchForStudent(forename, surname, birthDate = null) {
		// [TODO] Could not be tested due to empty test data
		return this.searchFor(5, forename, surname, birthDate);
	}

	async searchFor(type, forename, surname, birthDate = null) {
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

	async getRemarkCategories() {
		// [TODO] Returns empty data on current test account

		// Send request
		const response = await this.sendRequest('getClassregCategories', {});
		return response.data.result;
	}

	async getRemarkCategoryGroups() {
		// [TODO] Returns empty data on current test account

		// Send request
		const response = await this.sendRequest('getClassregCategoryGroups', {});
		return response.data.result;
	}

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

	async getRemarksForClass(classId, startDate, endDate) {
		return this.getRemarksFor(1, classId, startDate, endDate);
	}

	async getRemarksForStudent(studentId, startDate, endDate) {
		return this.getRemarksFor(5, studentId, startDate, endDate);
	}

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

	async getExamTypes() {
		// [TODO] Returns empty data on current test account

		// Send request
		const response = await this.sendRequest('getExamTypes', {});
		return response.data.result;
	}

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
