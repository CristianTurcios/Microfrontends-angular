import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-course',
  templateUrl: './course.component.html',
  styleUrls: ['./course.component.scss']
})
export class CourseComponent implements OnInit {
  @Input() course: object;
  @Output() goToClassroom: EventEmitter<any> = new EventEmitter();
  @Output() courseMaterials: EventEmitter<any> = new EventEmitter();


  constructor() { }

  ngOnInit() {
    console.log('course 1', this.course);
  }

  // goToClassroom() {
  //   console.log('hello');
  // }

  // courseMaterials() {
  //   console.log('hello 2');
  // }
}
