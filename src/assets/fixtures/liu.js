var institutionDirectives = [
	{
		name: 'customList',
		declaration: function() {
			return {
				template:
					'<list data="ctrl.list" configuration="ctrl.configuration" view="{{ctrl.view}}" service-name="{{ctrl.serviceName}}" modules="ctrl.modules" user="ctrl.user" name="{{ctrl.name}}" endpoint="{{ctrl.endpoint}}" loading="ctrl.loading" precomponents="ctrl.precomponents"></list>',
				scope: {
					id: '@',
					endpoint: '@',
					name: '@',
					view: '@',
					modules: '=',
					serviceName: '@',
					precomponents: '=?'
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
					unifiedPortalApi,
					dashboardData
				) {
					var ctrl = this;
					var universityAcronym = $cookies.get('university_acronym');
					var financialDateCheck;
					var financialAidFirstCheck = false;
					if (User.profileMetadata && User.profileMetadata.financialAid) {
						financialDateCheck = User.profileMetadata.financialAid.financialDateCheck;
					} else {
						financialAidFirstCheck = true;
					}
					if (
						(financialDateCheck &&
							Date.parse(new Date()) >
								Date.parse(financialDateCheck) + institutionSettings.dayToMilliseconds * institutionSettings.checkFinancialAidDays) ||
						financialAidFirstCheck
					) {
						// Checking if user has Financial Aid
						var financialAidEndpoint;
						if ($rootScope.environment === 'production') {
							financialAidEndpoint = 'https://api.exchange.laureate.net/up-pfaid-rs/api/financial-aid';
						} else {
							financialAidEndpoint = 'http://mdgiappdev02/up-pfaid-rs/api/financial-aid';
						}
						$http
							.get(financialAidEndpoint, {
								cache: true
							})
							.then(
								function(response) {
									if (false) {
										session
											.updateUserMetaDataInformation({
												institution: universityAcronym,
												metadata: {
													financialAid: {
														hasFinancialAid: response.data.hasFinancialAid,
														financialDateCheck: new Date()
													}
												}
											})
											.then(
												function(profileResponse) {
													return profileResponse;
												},
												function(error) {
													$logger.error('Failed updating user metadata information | user');
												}
											);
										User.hasFinancialAid = response.data.hasFinancialAid;
									}
								},
								function() {
									User.hasFinancialAid = true;
								}
							);
					}
					const nonStandardCourses = [
						{
							courseCode: 'WSRO - 1001U',
							daysAfter: 365
						},
						{
							courseCode: 'WSRO - 1001G',
							daysAfter: 365
						},
						{
							courseCode: 'WSRO - 1002U',
							daysAfter: 365
						}
					];

					const nonStandardCoursesCodes = ['wsro-1001u', 'wsro-1001g', 'wsro-1002u'];

					function getDaysAfter(courseCode) {
						for (var i = 0; i < nonStandardCourses.length; i++) {
							if (nonStandardCourses[i].courseCode === courseCode) {
								return nonStandardCourses[i].daysAfter;
							}
						}
						return -1;
					}

					function getCourses(data) {
						var validationCoursePart;
						var validationCourse = {};
						var listConfiguration = {
							enableBookStoreButton: false,
							list: []
						};
						if (data.length === 0) {
							User.showProgressCoach = true;
						}
						data = data.sort(sortCourses);
						validationCourse = getFirstNonSROCourse(data) || {};
						data.forEach(function(_course) {
							var configuration = {
								enableCourseButton: false,
								enableBookStoreButton: false
							};
							if (isSROCourse(_course)) {
								_course.showCurrent = true;
							}
							if (!isSROCourse(_course) && new Date(validationCourse.term.startDate).getTime() > new Date(_course.term.startDate).getTime()) {
								validationCourse = _course;
							}
							_course.validateCourseStatus = {
								startDate: _course.term.startDate,
								endDate: _course.term.endDate
							};
							if (_course.term.type.indexOf('part of term') > -1) {
								if (!validationCoursePart && !isSROCourse(_course)) {
									validationCoursePart = _course;
								}
								if (!isSROCourse(_course) && new Date(validationCoursePart.term.startDate).getTime() > new Date(_course.term.startDate).getTime()) {
									validationCoursePart = _course;
								}
								_course.validateCourseStatus = {
									startDate: _course.term.parent.startDate,
									endDate: _course.term.parent.endDate
								};
							}
							_course.enableCourseButton = validateCourse(_course);
							configuration.enableCourseButton = _course.enableCourseButton;
							_course.enableBookStoreButton = validateMaterials(_course);
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
						if ($cookies.get('showProgressCoach') === 'false') {
							User.showProgressCoach = false;
						} else {
							if (validationCoursePart && !User.oldStudent) {
								User.showProgressCoach = !validateProgressCoach(validationCoursePart);
							} else if (validationCourse.term && !User.oldStudent) {
								User.showProgressCoach = !validateProgressCoach(validationCourse);
							}
						}
						return listConfiguration;
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
						return nonStandardCoursesCodes.indexOf(course.course.courseCode.replace(/(\ )/g, '').toLowerCase()) > -1;
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

					var validateCourse = function(course) {
						var startDate = Date.parse(course.term.startDate);
						var endDate = Date.parse(course.term.endDate);
						var today = Date.parse(new Date());
						var dateCourses = angular.copy(dashboardData.fetchDataCourses().data) ? angular.copy(dashboardData.fetchDataCourses()) : [];
						var startDateBefore = getDaysBeforeByCourse(course, dateCourses);
						course.availableDate = startDateBefore;
						// Sixty days after the last day of the class to Standard Course
						var endDateAfter = endDate + 60 * institutionSettings.dayToMilliseconds;
						// For the non-standard courses
						var daysAfter = getDaysAfter(course.course.courseCode);
						if (daysAfter != -1) {
							startDateBefore = startDate - daysAfter * institutionSettings.dayToMilliseconds;
						}
						if ((today >= startDateBefore && today <= endDateAfter) || isSROCourse(course)) {
							return true;
						}
						return false;
					};

					var getDaysBeforeByCourse = function(course, datesArray) {
						//Getting day, month and year from course
						var startDate = Date.parse(course.term.startDate);
						var date = new Date(course.term.startDate);
						var clientTimezoneOffset = date.getTimezoneOffset() * 60000;
						var correctedDate = new Date(date.getTime() + clientTimezoneOffset);
						var startDateBefore;
						var termMonth = correctedDate.getMonth();
						var termDay = correctedDate.getDate();
						var termYear = correctedDate.getFullYear();
						//Using for instead of foreach to be able to break it.
						for (var i = 0; i < datesArray.length; i++) {
							var dateArrayMonth = datesArray[i].month || termMonth;
							var dateArrayDay = datesArray[i].day || termDay;
							var dateArrayYear = datesArray[i].year || termYear;
							//Checking if dates are matching
							if (dateArrayMonth === termMonth && dateArrayDay === termDay && dateArrayYear === termYear) {
								//Matching, then return the daysAfter
								return startDate - datesArray[i].daysBefore * institutionSettings.dayToMilliseconds;
							}
						}
						return startDate - institutionSettings.showFutureAsCurrentDays * institutionSettings.dayToMilliseconds;
					};

					var validateMaterials = function(course) {
						var isValid = course.ext_laur_fulfillment_type && course.ext_laur_fulfillment_type.toLowerCase() == 'fstu';
						var courseStatus = coursesListService.getCourseStatus(course);
						isValid = isValid ? courseStatus === 'upcoming' || courseStatus === 'current' : isValid;
						return isValid;
					};

					var url = this.endpoint;
					ctrl.loading = true;
					ctrl.list = {};
					User.checkVerified(function() {
						url = ctrl.endpoint.replace('{email}', User.viewAs.email);
						ctrl.user = User;
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
								serverErrorHandler.handler(err);
							}
						);
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
						if (angular.isArray(scope.customBookStore)) {
							url = scope.bookStoreBuilder.getStringAllCourses(scope.customBookStore);
						} else if (angular.isObject(scope.customBookStore)) {
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
						SERVER: 'http://bookstore.mbsdirect.net/vb_buy.php',
						SEPARATOR_CHAR: encodeURI('|'),
						REQUEST_STRING_SITECOURSES: '&SITECOURSES=',
						REQUEST_STRING_ACTION: '?ACTION=registrar&FVGRP=WOL',
						REQUEST_STRING_STRDATE: '&STRDATE='
					};

					function BookStoreURLBuilder() {
						var getStrigDateParameter = function(stringDate) {
							var myDate = new Date(stringDate);
							var day = myDate.getUTCDate().toString().length == 1 ? '0' + myDate.getUTCDate().toString() : myDate.getUTCDate().toString();
							var month = myDate.getUTCMonth().toString().length == 1 ? '0' + (myDate.getUTCMonth() + 1).toString() : (myDate.getUTCMonth() + 1).toString();
							return myDate.getUTCFullYear().toString() + month + day;
						};

						var getTermCourseIdParameter = function(courseCode, term) {
							var courseComponent = courseCode.split(' ');
							courseComponent = courseComponent.join('');
							var termSourcedId;
							if (term.type.toLowerCase().indexOf('part of term') > -1) {
								termSourcedId = term.parentSourcedId.split('.')[1];
							} else {
								termSourcedId = term.sourcedId.split('.')[1];
							}
							return termSourcedId + URL_PARTS.SEPARATOR_CHAR + courseComponent;
						};

						var getStringTermCourseIdRequest = function(courseCode, term) {
							return URL_PARTS.REQUEST_STRING_SITECOURSES + getTermCourseIdParameter(courseCode, term);
						};

						this.getStringBookStoreRequestBySingleCourse = function(courseCode, sourcedId, stringDate, term) {
							return (
								URL_PARTS.SERVER +
								URL_PARTS.REQUEST_STRING_ACTION +
								getStringTermCourseIdRequest(courseCode, term) +
								URL_PARTS.REQUEST_STRING_STRDATE +
								getStrigDateParameter(stringDate)
							);
						};

						this.getStringBookStoreRequestByArrayCourse = function(arrayCourse, stringDate) {
							var siteCoursesString = '';
							for (var i = 0; i < arrayCourse.length; i++) {
								siteCoursesString += getStringTermCourseIdRequest(arrayCourse[i][0], arrayCourse[i][1]);
							}
							return (
								URL_PARTS.SERVER +
								URL_PARTS.REQUEST_STRING_ACTION +
								siteCoursesString +
								URL_PARTS.REQUEST_STRING_STRDATE +
								getStrigDateParameter(stringDate)
							);
						};

						this.getFakeUrl = function() {
							return 'http://bookstore.mbsdirect.net/vb_buy2.php?CSID=AUKKJSAZM3MQWAMMC22AQCSAB&ACTION=registrar&FVGRP=WOL&SITECOURSES=201730%7CCRJS-3002&SITECOURSES=201730%7CCRJS-3001&STRDATE=20161128';
						};
					}

					function BookStoreBuilder(BookStoreURLBuilder) {
						var getArrayCourses = function(courses) {
							var newArray = courses
								.filter(function(_course) {
									return _course.enableBookStoreButton;
								})
								.map(function(_course) {
									var _tempArray = [];
									_tempArray.push(_course.course.courseCode);
									_tempArray.push(_course.term.sourcedId);
									_tempArray.push(_course.term.startDate);
									return _tempArray;
								});
							return newArray;
						};

						this.getStringAllCourses = function(courses) {
							var arrayCourses = getArrayCourses(courses);
							return BookStoreURLBuilder.getStringBookStoreRequestByArrayCourse(arrayCourses, arrayCourses[0][2]);
						};

						this.getStringSingleCourse = function(course) {
							var courseCode = course.course.courseCode;
							var sourceId = course.term.sourcedId;
							var stringDate = course.term.startDate;
							var term = course.term;
							return BookStoreURLBuilder.getStringBookStoreRequestBySingleCourse(courseCode, sourceId, stringDate, term);
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
								url = 'https://my.waldenu.edu/portal/Shared/SSODispatcher.aspx?ssoRequestType=BlackBoardSSORequestType&ssoAction=&partnerId=1';
							} else {
								url = 'https://id.waldenu.edu/legacy-sso/sso/1/blackboard/' + scope.customClassUrl.lmsClassId;
							}
						} else {
							if (!scope.customClassUrl.lmsClassId || scope.customClassUrl.lmsClassId.length === 0) {
								url = 'http://qa2-my.waldenu.edu.qual/portal/Shared/SSODispatcher.aspx?ssoRequestType=BlackBoardSSORequestType&ssoAction=&partnerId=1';
							} else {
								url = 'https://qual.elm.wal.laureate.net/legacy-sso/sso/1/blackboard/' + scope.customClassUrl.lmsClassId;
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
	},
	{
		name: 'customQuerySearch',
		declaration: function($window, $injector, $rootScope) {
			return {
				restrict: 'A',
				scope: {
					customQuerySearch: '='
				},
				link: function(scope, element, attrs) {
					element.on('submit', function(evt) {
						if (scope.customQuerySearch && scope.customQuerySearch.length > 0) {
							// var url = 'http://qanswers.waldenu.edu/?q=' + encodeURI(scope.customQuerySearch) + '&src=4&t=0';
							// $window.open(url);
							$injector.get('$analytics').eventTrack('Question Search', {
								category: 'Search Module',
								label: scope.customQuerySearch
							});
							$rootScope.searchBarIsFilled = false;
							$injector.get('$state').go('basicLayout.supportQA', {
								text: scope.customQuerySearch
							});
						}
					});
				}
			};
		}
	},
	{
		name: 'customProgresscoachFrame',
		declaration: function($window, $rootScope) {
			return {
				restrict: 'E',
				scope: {
					user: '='
				},
				template: '<iframe src="{{frameUrl}}" id="iframeCoach" frameborder="0" width="100%" height="700"></iframe>',
				controller: function($scope, $sce, $injector) {
					$scope.user.checkVerified(function() {
						var urlId = $scope.user.bannerId;
						var url;
						if ($rootScope.environment === 'production') {
							url = 'https://walden-progress-tracker.azurewebsites.net/?ID=' + urlId + '&login=true';
						} else {
							url = 'https://walden-progress-tracker-stage.azurewebsites.net/?ID=' + urlId + '&login=true';
						}
						$scope.frameUrl = $sce.trustAsResourceUrl(url);
						var $overlay = $injector.get('$overlay');
						var clickListener = addEventListener('blur', function() {
							if (document.activeElement === document.getElementById('iframeCoach')) {
								$overlay.closeAll();
							}
						});
					});
				}
			};
		}
	},
	{
		name: 'customProgressCoachDashboardFrame',
		declaration: function($window, $rootScope) {
			return {
				restrict: 'E',
				scope: {
					user: '='
				},
				template: '<iframe src="{{frameUrl}}" id="iframeDashboardCoach" frameborder="0" width="100%" height="700"></iframe>',
				controller: function($scope, $sce, User) {
					User.checkVerified(function() {
						var urlId = User.bannerId;
						var url;
						var locationUrl = encodeURIComponent(window.origin);
						locationUrl += '%2F%23%2Fprogress-coach';
						if ($rootScope.environment === 'production') {
							url = 'https://walden-progress-tracker.azurewebsites.net/?ID=' + urlId + '&summary=y&summary_target_url=' + locationUrl;
						} else {
							url = 'https://walden-progress-tracker.azurewebsites.net/?ID=' + urlId + '&summary=y&summary_target_url=' + locationUrl;
						}
						$scope.frameUrl = $sce.trustAsResourceUrl(url);
						var clickListener = addEventListener('blur', function() {
							if (document.activeElement === document.getElementById('iframeDashboardCoach')) {
								$overlay.closeAll();
							}
						});
					});
				}
			};
		}
	}
];

var institutionSettings = {
	progressCoachDaysAfter: 21,
	showFutureAsCurrentDays: 4,
	accountID: 12,
	profileID: 185,
	dayToMilliseconds: 1000 * 60 * 60 * 24,
	checkFinancialAidDays: 7,
	supportCenter: {
		endpoint: 'https://sstchatbot.blob.core.windows.net/sst/content.xml',
		monitorEnpoint: 'https://api.uptimerobot.com/v2/getMonitors',
		api_keys: {
			classroomSupport: 'm779489499-8d5f9fcd37c3a10a26047384',
			emailSupport: 'm779489499-8d5f9fcd37c3a10a26047384'
		}
	},
	production: {
		googleTagManagerID: 'GTM-MTSW6XP',
		salesforceEndpoint: 'https://d.la1-c1-ord.salesforceliveagent.com',
		salesforceIDs: ['5721N00000006SK', '00Do0000000aRRI', '5731N00000007gd']
	},
	qa: {
		googleTagManagerID: 'GTM-T9B8HVK',
		salesforceEndpoint: 'https://d.la1-c2cs-ord.salesforceliveagent.com',
		salesforceIDs: ['5721N00000006SK', '00D0n0000000TBz', '5731N00000007gd']
	},
	staging: {
		googleTagManagerID: 'GTM-MTSW6XP',
		salesforceEndpoint: 'https://d.la1-c1-ord.salesforceliveagent.com',
		salesforceIDs: ['5721N00000006SK', '00Do0000000aRRI', '5731N00000007gd']
	},
	development: {
		googleTagManagerID: 'GTM-WG9LTPW',
		salesforceEndpoint: 'https://d.la2-c2cs-dfw.salesforceliveagent.com',
		salesforceIDs: ['5726C000000Gmad', '00D6C0000000Xh8', '5736C000000Gmbg']
	}
};
