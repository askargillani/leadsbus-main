import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  showSidenav = false;

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  toggleNav() {
    this.showSidenav = !this.showSidenav;
  }

  login() {
    this.router.navigate(['/facebook']);
  }

  navigateToPrivacy() {
    this.router.navigate(['/privacy-policy']);
  }

  contactViaWhatsApp() {
    window.open('https://wa.me/923086772000', '_blank');
  }
}
