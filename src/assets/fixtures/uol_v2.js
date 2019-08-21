var institutionDirectives = [
	{
		name: 'courseCard',
		declaration: function() {
			return {
				templateUrl: 'app/components/dashboard/courses/courseCard/uol.html',
				scope: {
					courses: '='
				},
				replace: true
			};
		}
	},
	{
		name: 'customList',
		declaration: function() {
			return {
				template:
					'<list data="ctrl.list" configuration="ctrl.configuration" view="{{ctrl.view}}" service-name="{{ctrl.serviceName}}" modules="ctrl.modules" user="ctrl.user" name="{{ctrl.name}}" endpoint="{{ctrl.endpoint}}" loading="ctrl.loading" precomponents="ctrl.precomponents" component="ctrl.component"></list>',
				scope: {
					id: '@',
					endpoint: '@',
					name: '@',
					view: '@',
					modules: '=',
					serviceName: '@',
					precomponents: '=?',
					component: '=?'
				},
				controllerAs: 'ctrl',
				bindToController: true,
				controller: function(
					session,
					$http,
					$location,
					$cookies,
					coursesListService,
					serverErrorHandler,
					Modules,
					User,
					$rootScope,
					teacherEndpoint,
					dashboardData
				) {
					var ctrl = this;
					var universityAcronym = $cookies.get('university_acronym');

					function getCourses(data) {
						var listConfiguration = {
							enableBookStoreButton: false,
							list: []
						};
						data = data.sort(sortCourses);
						var filteredOutCourseTypes = ['blt'];
						data = data.filter(function(course) {
							var typeClass = course.classType ? course.classType.toLowerCase() : '';
							return filteredOutCourseTypes.indexOf(typeClass) <= -1;
						});
						data.forEach(function(_course) {
							var configuration = {
								enableCourseButton: false,
								enableBookStoreButton: false
							};
							if (isSROCourse(_course)) {
								_course.showCurrent = false;
							}
							//Adding an extra day to keep the course as current.
							var validationEndDate = addDaysToDate(_course.term.endDate, institutionSettings.keepAsCurrentDays);
							_course.validateCourseStatus = {
								startDate: _course.term.startDate,
								endDate: validationEndDate
							};
							_course.enableCourseButton = validateCourse(_course);
							configuration.enableCourseButton = _course.enableCourseButton;
							_course.enableBookStoreButton = false;
							configuration.enableBookStoreButton = _course.enableBookStoreButton;
							configuration.validateCourseStatus = _course.validateCourseStatus;
							_course.hasTeacher = !isSROCourse(_course);
							_course.hasDuration = !isSROCourse(_course);
							_course.percentageOfCompletion = coursesListService.getPercentageOfCompletion(_course.term.startDate, _course.term.endDate);
							if (coursesListService.getCourseStatus(_course) == 'past') {
								User.oldStudent = true;
							}

							listConfiguration.list.push(configuration);
						});

						return {
							data: data,
							listConfiguration: listConfiguration
						};
					}

					function validateProgressCoach(course) {
						var daysAfter = 1000 * 60 * 60 * 24 * institutionSettings.progressCoachDaysAfter;
						var currentDate = new Date();
						return Date.parse(course.term.startDate) + daysAfter <= Date.parse(currentDate);
					}

					function getGeneric(data) {
						var configuration = {};
						return configuration;
					}

					function isSROCourse(course) {
						return course.classType.toLowerCase() === 'sro';
					}

					function getFirstNonSROCourse(allCourses) {
						for (var i = 0; i < allCourses.length; i++) {
							if (!isSROCourse(allCourses[i])) {
								return allCourses[i];
							}
						}
					}

					var sortCourses = function(a, b) {
						//If is SRO.
						if (isSROCourse(a) && !isSROCourse(b)) {
							return -1;
						}
						if (isSROCourse(b) && !isSROCourse(a)) {
							return 1;
						}
						if (isSROCourse(a) && isSROCourse(b)) {
							return a.title > b.title;
						}
						//If a.date is greater than b.date
						var dateA = new Date(a.term.startDate);
						var dateB = new Date(b.term.startDate);
						if (dateA.getTime() === dateB.getTime()) {
							return a.title > b.title;
						} else {
							return dateA - dateB;
						}
					};

					function addDaysToDate(currentDate, daysToSum) {
						var date = new Date(currentDate);
						date.setDate(date.getDate() + daysToSum);
						return date;
					}

					var validateCourse = function(course) {
						// The number of milliseconds in one day
						var startDate = Date.parse(course.term.startDate);
						var endDate = Date.parse(course.term.endDate);
						var today = Date.parse(new Date());
						var userRole = $cookies.get('user_role');
						if (userRole.toLowerCase() == 'student') {
							//1 day before
							var startDateBefore = startDate - institutionSettings.showFutureAsCurrentDaysStudent * institutionSettings.dayToMilliseconds;
						} else if (userRole.toLowerCase() == 'vendor') {
							//15 days before
							var startDateBefore = startDate - institutionSettings.showFutureAsCurrentDaysFaculty * institutionSettings.dayToMilliseconds;
						}
						// Days before to Standard Course
						course.availableDate = startDateBefore;
						if (course.courseTitle) {
							course.title = course.courseTitle;
						}
						// One Year after the last day of the class to Standard Course
						var endDateAfter = endDate + 365 * institutionSettings.dayToMilliseconds;
						if (today >= startDateBefore && today <= endDateAfter) {
							return false;
						}
						return false;
					};

					var url = this.endpoint;
					ctrl.loading = true;
					ctrl.list = {};
					User.checkVerified(function() {
						url = ctrl.endpoint.replace('{email}', User.viewAs.email);
						ctrl.user = User;
						if (ctrl.view == 'courses') {
							let courseData = angular.copy(dashboardData.fetchUserCourses());
							let courseConfigurationResults = getCourses(courseData.classes);
							ctrl.configuration = courseConfigurationResults.listConfiguration;
							ctrl.list = {
								classes: courseConfigurationResults.data
							};
							ctrl.loading = false;
						} else {
							$http.get(url).then(
								function(response) {
									if (ctrl.view == 'courses') {
										ctrl.configuration = getCourses(response.data.classes);
									}
									if (ctrl.view == 'generic') {
										ctrl.configuration = getGeneric(response.data.data);
									}
									ctrl.list = response.data;
									ctrl.loading = false;
								},
								function(err) {
									ctrl.loading = false;
									ctrl.requestError = true;
									serverErrorHandler.handler(err);
								}
							);
						}
					});
				}
			};
		}
	},
	{
		name: 'customBookStore',
		declaration: function($window) {
			return {
				restrict: 'A',
				scope: {
					customBookStore: '='
				},
				link: function(scope, element, attrs) {
					var getUrl = function() {
						var url;
						if (angular.isObject(scope.customBookStore)) {
							url = scope.bookStoreBuilder.getStringSingleCourse(scope.customBookStore);
						}
						if (!scope.customBookStore || !url) {
							return '';
						}
						return url;
					};
					element[0].setAttribute('href', getUrl());
					element.on('click', function(evt) {
						evt.preventDefault();
						var url = getUrl();
						$window.open(url);
					});
				},
				controller: function($scope) {
					const URL_PARTS = {
						SERVER: 'http://success.liverpool-online.com',
						MATERIAL_ROUTE: '/materials/'
					};

					function BookStoreURLBuilder() {
						var removeSpacesCode = function(code) {
							return code.replace(/(-|\ )/g, '');
						};

						this.getStringBookStoreRequestBySingleCourse = function(courseCode) {
							return URL_PARTS.SERVER + URL_PARTS.MATERIAL_ROUTE + removeSpacesCode(courseCode);
						};
					}

					function BookStoreBuilder(BookStoreURLBuilder) {
						this.getStringSingleCourse = function(course) {
							var courseCode = course.course.courseCode;
							return BookStoreURLBuilder.getStringBookStoreRequestBySingleCourse(courseCode);
						};
					}

					$scope.bookStoreURLBuilder = new BookStoreURLBuilder();
					$scope.bookStoreBuilder = new BookStoreBuilder($scope.bookStoreURLBuilder);
				}
			};
		}
	},
	{
		name: 'customClassUrl',
		declaration: function($window, $rootScope) {
			return {
				restrict: 'A',
				scope: {
					customClassUrl: '='
				},
				link: function(scope, element, attrs) {
					var getUrl = function() {
						var url;
						if ($rootScope.environment === 'production') {
							if (!scope.customClassUrl.lmsClassId || scope.customClassUrl.lmsClassId.length === 0) {
								url =
									'https://elearning.uol.ohecampus.com/auth-saml/saml/login?apId=_175_1&redirectUrl=https%3A%2F%2Felearning.uol.ohecampus.com%2Fwebapps%2Fportal%2Fexecute%2FdefaultTab';
							} else {
								url =
									'https://elearning.uol.ohecampus.com/auth-saml/saml/login?apId=_175_1&redirectUrl=https%3A%2F%2Felearning.uol.ohecampus.com%2Fwebapps%2Fblackboard%2Fexecute%2Flauncher%3Ftype%3DCourse%26id%3D' +
									scope.customClassUrl.lmsClassId;
							}
						} else {
							if (!scope.customClassUrl.lmsClassId || scope.customClassUrl.lmsClassId.length === 0) {
								url =
									'https://qa01-01.blackboard.laureate.net/auth-saml/saml/login?apId=_137_1&redirectUrl=https%3A%2F%2Fqa01-01.blackboard.laureate.net%2Fwebapps%2Fportal%2Fexecute%2FdefaultTab';
							} else {
								url =
									'https://qa01-01.blackboard.laureate.net/auth-saml/saml/login?apId=_137_1&redirectUrl=https%3A%2F%2Fqa01-01.blackboard.laureate.net%2Fwebapps%2Fblackboard%2Fexecute%2Flauncher%3Ftype%3DCourse%26id%3D' +
									scope.customClassUrl.lmsClassId;
							}
						}

						return url;
					};
					element[0].setAttribute('href', getUrl());
					element.on('click', function(evt) {
						var url = getUrl();
						evt.preventDefault();
						$window.open(url);
					});
				}
			};
		}
	}
];

var institutionSettings = {
	progressCoachDaysAfter: 21,
	showFutureAsCurrentDaysStudent: 1,
	keepAsCurrentDays: 1,
	showFutureAsCurrentDaysFaculty: 14,
	dayToMilliseconds: 1000 * 60 * 60 * 24,
	checkFinancialAidDays: 7,
	loaderType: 'ripple',
	closeIconModal: '<icon-rendered icon="icon-close"></icon-rendered>',
	supportCenter: {
		endpoint: 'https://sstchatbot.blob.core.windows.net/sst/content.xml',
		monitorEnpoint: 'https://api.uptimerobot.com/v2/getMonitors',
		api_keys: {
			classroomSupport: 'm779489499-8d5f9fcd37c3a10a26047384',
			emailSupport: 'm779489499-8d5f9fcd37c3a10a26047384'
		}
	},
	production: {
		googleTagManager: {
			id: 'GTM-KBFCRNQ',
			env: 2,
			auth: 'Cc7mRx47RizvroI1U-hYaQ'
		},
		salesforceEndpoint: 'https://d.la1-c1-ord.salesforceliveagent.com',
		salesforceIDs: ['5721N00000006SK', '00Do0000000aRRI', '5731N00000007gd'],
		accountID: 1450,
		profileID: 1445
	},
	staging: {
		googleTagManager: {
			id: 'GTM-KBFCRNQ',
			env: 8,
			auth: 'pGVysZi_D5vtgNlBtqEe4A'
		},
		salesforceEndpoint: 'https://d.la1-c1-ord.salesforceliveagent.com',
		salesforceIDs: ['5721N00000006SK', '00Do0000000aRRI', '5731N00000007gd'],
		accountID: 1309,
		profileID: 1310
	},
	qa: {
		googleTagManager: {
			id: 'GTM-KBFCRNQ',
			env: 5,
			auth: 'lxlX_G8pRHt-jZDxoCgYoA'
		},
		salesforceEndpoint: 'https://d.la2-c2cs-dfw.salesforceliveagent.com',
		salesforceIDs: ['5726C000000Gmad', '00D6C0000000Xh8', '5736C000000Gmbg'],
		accountID: 1406,
		profileID: 1405
	},
	development: {
		googleTagManager: {
			id: 'GTM-KBFCRNQ',
			env: 6,
			auth: 'WiYplrHNAgldbCNvqYKuIQ'
		},
		salesforceEndpoint: 'https://d.la2-c2cs-dfw.salesforceliveagent.com',
		salesforceIDs: ['5726C000000Gmad', '00D6C0000000Xh8', '5736C000000Gmbg'],
		accountID: 1395,
		profileID: 1394
	}
};
