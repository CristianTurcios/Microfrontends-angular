import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-course',
  templateUrl: './course.component.html',
  styleUrls: ['./course.component.scss']
})
export class CourseComponent implements OnInit {
  @Input() title: string;
  @Input() endDate: string;
  @Input() duration: string;
  @Input() startDate: string;
  @Input() courseCode: string;
  @Input() courseCredits: string;

  @Output() goToClassroom: EventEmitter<any> = new EventEmitter();
  @Output() courseMaterials: EventEmitter<any> = new EventEmitter();

  constructor() { }

  ngOnInit() {
    console.log('title', this.title);
    console.log('endDate', this.endDate);
    console.log('duration', this.duration);
    console.log('startDate', this.startDate);
    console.log('courseCode', this.courseCode);
    console.log('courseCredits', this.courseCredits);
  }
}
