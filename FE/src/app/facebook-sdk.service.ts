import { Injectable } from '@angular/core';
declare let FB: any;
@Injectable({
  providedIn: 'root'
})
export class FacebookSdkService {
  private isSdkLoaded = false;

  loadFacebookSDK(): void {
    if (this.isSdkLoaded) return; // Prevent multiple loads

    (window as any).fbAsyncInit = () => {
      try {
        FB.init({
          appId: '9133049930120533',
          status: true,
          xfbml: true,
          version: 'v22.0'
        });
        console.log('✅ Facebook SDK Initialized');
      } catch (error) {
        console.error('❌ Error initializing Facebook SDK:', error);
      }
    };

    const script = document.createElement('script');
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('✅ Facebook SDK script loaded');
      this.isSdkLoaded = true;
    };
    script.onerror = () => console.error('❌ Error loading Facebook SDK script');
    document.body.appendChild(script);
  }
}
