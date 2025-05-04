import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-launching-soon',
  templateUrl: './launching-soon.component.html',
  styleUrls: ['./launching-soon.component.scss']
})
export class LaunchingSoonComponent implements OnInit {
  animationState: string = 'start'; // New property
  launchingSoonText: string = ''; // New property for typing animation

  constructor() { }

  ngOnInit(): void {
    const fullText = 'Launching Soon!';
    let index = 0;
    setInterval(() => {
      if (index < fullText.length) {
        this.launchingSoonText += fullText[index];
        index++;
      }
    }, 200); // Typing speed
  }
}
