import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ViewportScroller } from '@angular/common';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {

  constructor(private router: Router,
    private viewportScroller: ViewportScroller
  ) { }

  ngOnInit(): void {
  }

  navigateToTermsAndConditions() {
    this.router.navigate(['terms-and-conditions']);
  }

  contactUsWithWhatsapp() {
    window.open('https://wa.me/923086772000', '_blank');
  }

  openMessenger() {
    window.open('https://m.me/651433154724566', '_blank');
  }
}
