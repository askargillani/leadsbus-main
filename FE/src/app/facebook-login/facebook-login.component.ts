import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ContainerService } from '../container.service';
import { Router } from '@angular/router';
import { NgZone } from '@angular/core';
declare let FB: any;
@Component({
  selector: 'app-facebook-login',
  templateUrl: './facebook-login.component.html',
  styleUrls: ['./facebook-login.component.scss']
})
export class FacebookLoginComponent implements OnInit {
  constructor(
    private cdr: ChangeDetectorRef, 
    private containerService: ContainerService, 
    private router: Router,
    private ngZone: NgZone // Inject NgZone
  ) { }

  ngOnInit(): void {
    this.refreshOnFirstLoad();
    this.loadFacebookSDK();
  }

  refreshOnFirstLoad(): void {
    if (!localStorage.getItem('facebookPageRefreshed')) {
      localStorage.setItem('facebookPageRefreshed', 'true');
      location.reload();
    } else {
      localStorage.removeItem('facebookPageRefreshed');
    }
  }

  loadFacebookSDK(): void {
    // Check if already initialized
    if ((window as any).fbAsyncInit) return;

    (window as any).fbAsyncInit = () => {
      try {
        FB.init({
          appId: '9133049930120533',
          status: true,
          xfbml: true,
          version: 'v22.0'
        });
      } catch (error) {
        console.error('❌ Error initializing Facebook SDK:', error);
      }
    };

    // Load the SDK script manually if it's not already present
    const script = document.createElement('script');
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.onerror = () => console.error('❌ Error loading Facebook SDK script');
    document.body.appendChild(script);
  }

  loginWithFacebook(): void {
    FB.login((response: any) => {
      if (response.authResponse) {
        const accessToken = response.authResponse.accessToken;

        // Store accessToken in localStorage
        this.containerService.accessToken = accessToken;
        // Fetch user info and page info using the service
        this.containerService.fetchUserInfo()
          .then(() => this.containerService.fetchPageInfo())
          .then(() => {
            // Trigger navigation inside Angular's zone
            this.ngZone.run(() => {
              this.router.navigate(['/groups']);
            });
          })
          .catch(error => {
            location.reload();
            this.loginWithFacebook();
            console.error('Error during Facebook API calls:', error);
          });
      } else {
        location.reload();
        this.loginWithFacebook();
        console.warn("❌ Login cancelled or failed.");
      }
    }, {
      scope: 'email,public_profile,pages_show_list,pages_messaging,business_management'
    });
  }  
}
