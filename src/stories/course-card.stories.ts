import { storiesOf, moduleMetadata } from '@storybook/angular';
import { action } from '@storybook/addon-actions';
// import markdownNotes from './notes/component-a.notes.md';
// import * as markdown from './notes/component-a.notes.md';
import { CourseComponent } from '../app/course/course.component';


storiesOf('Course Card', module)
    .addDecorator(
        moduleMetadata({
            // imports: [MyExampleModule],
            // providers: [MyExampleService]
        }),
    )
    .add('Simple Course Card', () => ({
        component: CourseComponent,
        props: {
            course: {
                term: {
                  dateLastModified: null,
                  endDate: '2018-12-15T00:00:00.000Z',
                  parentSourcedId: 'USW1.201850',
                  sourcedId: 'USW1.201504.PRUEBA',
                  startDate: '2018-11-15T00:00:00.000Z',
                  status: 'active',
                  title: 'PhD Residency 4 Henry Test',
                  type: 'vres',
                  parent: {
                    dateLastModified: '2017-01-14T12:16:27.000Z',
                    endDate: null,
                    parentSourcedId: 'USW1.1718',
                    sourcedId: 'USW1.201850',
                    startDate: '2018-11-13T00:00:00.000Z',
                    status: 'active',
                    title: '2018 Spring Qtr 02/26-05/20',
                    type: 'quarter',
                    __typename: 'ParentTerm'
                  },
                  __typename: 'Term'
                },
                school: {
                  boarding: 'false',
                  classification: 'private',
                  dateLastModified: '2009-07-10T15:18:50.000Z',
                  gender: 'mixed',
                  identifier: '125231',
                  name: 'Walden University(WAL)',
                  parentSourcedId: null,
                  sourcedId: 'USW1',
                  status: 'active',
                  type: 'online',
                  __typename: 'School'
                },
                course: {
                  courseCode: 'PHY - 1030',
                  dateLastModified: null,
                  description: null,
                  duration: '6 weeks',
                  grade: null,
                  orgSourcedId: 'USW1',
                  schoolYearId: 'USW1.1617',
                  sourcedId: 'USW1.PHY1030.PRUEBA',
                  status: 'active',
                  subjects: 'Physics',
                  title: 'College Physics Residency',
                  __typename: 'Course'
                },
                classCode: 'PHY - 1806 - 90',
                classType: 'vres',
                courseSourcedId: 'USW1.PHY1030.PRUEBA',
                dateLastModified: null,
                ext_laur_course_credits: null,
                ext_laur_fulfillment_type: 'fnom',
                grade: null,
                lmsClassId: '_5542_1',
                location: null,
                sourcedId: 'USW1.21711.201504.PRUEBA',
                status: 'active',
                subjects: 'English',
                termSourcedId: 'USW1.201504.PRUEBA',
                title: 'College Residency Physics',
                courseTitle: null,
                finalGrade: 'A+',
                teachers: [],
                __typename: 'UserClasses'
              },
            // myEvent: action('Hello Chris!')
        }
    }),
    {
        notes: `# Component A
        Some text to go here.`,
    });
