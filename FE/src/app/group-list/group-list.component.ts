import { Component, OnInit } from '@angular/core';
import { FacebookSdkService } from '../facebook-sdk.service'; // Import the shared service

@Component({
  selector: 'app-group-list',
  templateUrl: './group-list.component.html',
  styleUrls: ['./group-list.component.scss']
})
export class GroupListComponent implements OnInit {
  constructor(private facebookSdkService: FacebookSdkService) { }

  ngOnInit(): void {
    this.facebookSdkService.loadFacebookSDK(); // Use the shared service
  }
}
