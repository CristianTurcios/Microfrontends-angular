import { storiesOf } from '@storybook/angular';
import { action } from '@storybook/addon-actions';
import { withKnobs, object, text, select, array   } from '@storybook/addon-knobs';
import { CourseComponent } from '../app/course/course.component';
import { Button } from '@storybook/angular/demo';
import { withA11y } from '@storybook/addon-a11y';

export const actions = {
    goToClassroom: action('goToClassroom'),
    courseMaterials: action('courseMaterials'),
};

const label = 'Portal';
const options = {
  Walden: 'walden',
  UoL: 'uol'
};

const defaultValue = 'unified';
const groupId = 'GROUP-ID1';

storiesOf('Course Card', module)
    .addDecorator(withKnobs)
    .addDecorator(withA11y)
    .add('Simple Course Card', () => ({
        component: CourseComponent,
        props: {
          title: text('title', 'College Physics Residency'),
          endDate: text('endDate', '2018-12-15T00:00:00.000Z'),
          duration: text('duration', '6 weeks'),
          startDate: text('startDate', '2018-11-13T00:00:00.000Z'),
          courseCode: text('courseCode', 'PHY - 1030'),
          courseCredits: text('courseCredits', '0'),
          portal: text('coursportaleCredits', '0'),
          // tslint:disable-next-line:max-line-length
          // instructors: array('instructors', '[{'email': 'elder.godoy@dev.waldenu.edu', 'familyName': 'Godoy','givenName': 'Elder','identifier': 'USW1.A000999999.TEST','phone': null,'role': 'student','sms': null,'userId': 'elder.godoy@dev.waldenu.edu','username': 'elder.godoy@dev.waldenu.edu','__typename': 'teacher'}]'),
          // tslint:disable-next-line:max-line-length
          instructors: text('instructors', JSON.stringify([{'email': 'elder.godoy@dev.waldenu.edu', 'familyName': 'Godoy','givenName': 'Elder','identifier': 'USW1.A000999999.TEST','phone': null,'role': 'student','sms': null,'userId': 'elder.godoy@dev.waldenu.edu','username': 'elder.godoy@dev.waldenu.edu','__typename': 'teacher'}])),
          goToClassroom: actions.goToClassroom,
          courseMaterials: actions.courseMaterials,
        }
    }),
    {
        notes: `# Component A
        Some text to go here.`,
    })
    .add('with a button', () => ({
        component: Button,
        props: {
         text: select(label, options, defaultValue, groupId),
        },
      }));
