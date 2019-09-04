import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-course',
  templateUrl: './course.component.html',
  styleUrls: ['./course.component.scss']
})
export class CourseComponent implements OnInit {
  @Input() title: string;
  @Input() portal: string;
  @Input() endDate: string;
  @Input() duration: string;
  @Input() startDate: string;
  @Input() courseCode: string;
  @Input() courseCredits: string;
  @Input() instructors: string;

  teachers: Array<object> = [];

  @Output() goToClassroom: EventEmitter<any> = new EventEmitter();
  @Output() courseMaterials: EventEmitter<any> = new EventEmitter();

  constructor() { }

  ngOnInit() {
    console.log('dataaaa', this.instructors);
  }

  parseToJson(data) {
    console.log('data', data);
    try {
      this.teachers = JSON.parse(data);
      return JSON.parse(data);
    } catch (error) {
      console.log('error', error);
      return [];
    }
  }
}
