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
  permissionsAccepted: boolean = false;

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

        // Extend the short-lived token to a long-lived token
        FB.api('/oauth/access_token', {
          grant_type: 'fb_exchange_token',
          client_id: '9133049930120533',
          client_secret: '506dacacc08dae9ae0365822b09a5ea0', // Replace with your app secret
          fb_exchange_token: accessToken
        }, (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            this.containerService.accessToken = tokenResponse.access_token;
            // Fetch user info and page info using the service
            this.containerService.fetchUserInfo()
              .then(() => this.containerService.fetchPageInfo())
              .then(() => {
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
            // Fallback to short-lived token if extension fails
            this.containerService.accessToken = accessToken;
            this.containerService.fetchUserInfo()
              .then(() => this.containerService.fetchPageInfo())
              .then(() => {
                this.ngZone.run(() => {
                  this.router.navigate(['/groups']);
                });
              })
              .catch(error => {
                location.reload();
                this.loginWithFacebook();
                console.error('Error during Facebook API calls:', error);
              });
          }
        });
      } else {
        location.reload();
        this.loginWithFacebook();
        console.warn("❌ Login cancelled or failed.");
      }
    }, {
      scope: 'email,public_profile,pages_show_list,pages_messaging'
    });
  }  
}
