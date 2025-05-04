import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ContainerService } from '../../container.service';

@Component({
  selector: 'app-group-list',
  templateUrl: './group-list.component.html',
  styleUrls: ['./group-list.component.css']
})
export class GroupListComponent implements OnInit {
  pages: any[] = []; // Original list of pages
  filteredPages: any[] = []; // Filtered list of pages
  searchQuery: string = ''; // Search input value

  constructor(
    private router: Router,
    private containerService: ContainerService
  ) {}

  ngOnInit(): void {
    // Fetch pages and initialize both pages and filteredPages
    this.fetchPages();
  }

  fetchPages(): void {
    // Fetch page info from the service
    if (this.containerService.pageInfo?.accounts?.data) {
      this.pages = this.containerService.pageInfo.accounts.data;
      this.filteredPages = [...this.pages];
    } else {
      console.warn('No page info available.');
    }
  }

  filterGroups(): void {
    const query = this.searchQuery.toLowerCase();
    this.filteredPages = this.pages.filter(page => page.name.toLowerCase().includes(query));
  }

  openGroupChat(groupId: any, token: any, pageName: string, pageImageUrl: any): void {
    this.containerService.fetchPageConversations(token, pageName, pageImageUrl)
      .then(() => {
        this.router.navigate(['chat/', groupId]);
      })
      .catch(error => {
        console.error('❌ Failed to fetch page conversations:', error);
      });
  }

  onLogout(): void {
    console.log('🔄 Logging out and refreshing the page...');
    location.reload(); // Refresh the page
  }
}
