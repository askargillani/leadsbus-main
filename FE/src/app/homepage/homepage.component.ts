import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss']
})
export class HomepageComponent implements OnInit {

  constructor(private router: Router) {}

  ngOnInit(): void {
  }

  moveToLaunchSoon(buttonType: string) {
    if (buttonType === 'contact') {
      window.location.href = 'mailto:askar@leadsbus.com';
    } else {
      window.location.href = '/launching-soon';
    }
  }

}
