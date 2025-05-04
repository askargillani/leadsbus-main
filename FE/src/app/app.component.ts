import { ViewportScroller } from '@angular/common';
import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
declare let FB: any;
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'crypto-portfolio';
  showHeader = true;
  showFooter = true;

  constructor(private router: Router, private viewportScroller: ViewportScroller) {}
  ngOnInit() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.showHeader = !(this.router.url.includes('groups') || this.router.url.includes('chat') || this.router.url.includes('launching-soon') || this.router.url.includes('facebook'));
        this.showFooter = !(this.router.url.includes('groups') || this.router.url.includes('chat') || this.router.url.includes('facebook'))
      }
    });
  }
}
