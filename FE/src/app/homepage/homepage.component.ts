import { Component, OnInit, Renderer2, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss']
})
export class HomepageComponent implements OnInit {
  @ViewChild('footerSection', { static: false }) footerSection!: ElementRef;

  constructor(private router: Router, private renderer: Renderer2) {}

  ngOnInit(): void {
  }

  moveToLaunchSoon(buttonType: string) {
    if (buttonType === 'contact') {
      window.location.href = 'mailto:askar@leadsbus.com';
    } else {
      window.location.href = '/launching-soon';
    }
  }

  scrollToFooterAndAnimate(event: Event, plan: string) {
    event.preventDefault();
    const footer = document.getElementById('footer-section');
    if (footer) {
      footer.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

