import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { ContainerService } from 'src/app/container.service';

@Component({
  selector: 'app-chat-panel',
  templateUrl: './chat-panel.component.html',
  styleUrls: ['./chat-panel.component.scss']
})
export class ChatPanelComponent implements OnInit {
  
  conversations: any;
  profilePictures: any;
  chatMessages: any;
  selectedChatName: string | undefined;
  chatSelected: any = null;
  selectedContentType: string = 'CONFIRMED_EVENT_UPDATE'; // Default value for the radio button
  bulkMessageText: string = ''; // Bind this to the input field
  isLoading: boolean = false; // Add a flag to control the loader
  originalConversations: any[] = []; // Store the original conversations
  searchQuery: string = ''; // Bind this to the search input field
  messageInput: string = ''; // Bind this to the input field for chat messages
  recipientId: string = '';
  threadId: string = '';

  constructor(private router: Router, public containerService: ContainerService, private ngZone: NgZone) {

   }

  ngOnInit(): void {
    this.conversations = this.containerService.pageConversations.data;
    this.profilePictures = this.containerService.participantPictures;
    this.originalConversations = [...this.conversations]; // Save the original conversations

    // Fetch available messages
    this.containerService.getMessagesLeft()
      .then(messagesLeft => {})
      .catch(error => {});

    // Add scroll event listener
    const messagePanel = document.querySelector('.message-panel');
    if (messagePanel) {
      messagePanel.addEventListener('scroll', () => this.onScroll(messagePanel));
    }
  }

  private scrollToBottom(): void {
    const messagePanel = document.querySelector('.message-panel');
    if (messagePanel) {
      setTimeout(() => {
        messagePanel.scrollTop = messagePanel.scrollHeight;
      }, 100); // Delay to ensure the DOM is updated
    }
  }

  onSvgClick(event: Event): void {
    const svgElement = event.target as HTMLElement;
    svgElement.classList.add('animate-svg');
    setTimeout(() => {
      svgElement.classList.remove('animate-svg');
    }, 1000); // Duration of the animation
  }

  onBackButtonClick(): void {
    this.ngZone.run(() => {
      this.router.navigate(['/groups']);
    });
  }

  selectChat(threadId: string, name: string, recipientId: string): void {
    this.selectedChatName = name;
    this.chatSelected = true;
    this.isLoading = true;
    this.recipientId = recipientId;
    this.threadId = threadId;
    this.containerService.fetchChatMessages(threadId)
      .then(() => {
        this.isLoading = false;

        // Reverse the order of messages to maintain consistency
        this.chatMessages = this.containerService?.selectedChatMessages?.data?.slice().reverse() || [];

        // Scroll to the bottom of the chat panel
        this.scrollToBottom();
      })
      .catch(error => {});
  }

  onScroll(messagePanel: Element): void {
    if (messagePanel.scrollTop + messagePanel.clientHeight >= messagePanel.scrollHeight) {
      this.containerService.extendPageConversations()
        .then(() => {
          this.conversations = this.containerService.pageConversations.data;
        })
        .catch(error => {});
    }
  }

  

  LoadMore(loadAllRecipients: any = false): Promise<void> {
    return new Promise((resolve, reject) => {
      const loadMoreButton = document.querySelector('.load-more-button');
      if (loadMoreButton) {
        loadMoreButton.setAttribute('disabled', 'true'); // Disable the button
      }

      this.containerService.extendPageConversations(loadAllRecipients)
        .then(() => {
          if (!loadAllRecipients) {
            this.conversations = this.containerService.pageConversations.data;
          }

          // Check if there are no more conversations
          if (!this.containerService.pageConversations.paging?.cursors?.after) {
            if (loadMoreButton) {
              loadMoreButton.classList.add('hidden');
            }
          }

          if (loadMoreButton) {
            loadMoreButton.removeAttribute('disabled'); // Re-enable the button
          }
          resolve();
        })
        .catch(error => {
          if (loadMoreButton) {
            loadMoreButton.removeAttribute('disabled'); // Re-enable the button even on failure
          }
          reject(error);
        });
    });
  }

  filterRecipients(): void {
    const query = this.searchQuery.toLowerCase();
    this.originalConversations = [...this.containerService.pageConversations.data];
      
    if (query) {
      this.conversations = this.originalConversations.filter(conversation =>
        conversation.participants.data[0].name.toLowerCase().includes(query)
      );
    } else {
      this.conversations = [...this.originalConversations]; // Restore original conversations
    }
  }

  async sendMessageToSelectedRecipient(): Promise<void> {
    try {
      this.isLoading = true; // Show the loader
      await this.containerService.sendMessageUsingFB(this.recipientId, this.messageInput, this.selectedContentType);
      this.containerService.deductMessage();
      this.messageInput = '';
    } catch (error) {}
    this.containerService.fetchChatMessages(this.threadId)
      .then(() => {
        this.isLoading = false;

        // Reverse the order of messages to maintain consistency
        this.chatMessages = this.containerService?.selectedChatMessages?.data?.slice().reverse() || [];

        // Scroll to the bottom of the chat panel
        this.scrollToBottom();
      })
      .catch(error => {});
  }

  onLogout(): void {
    location.reload(); // Refresh the page
  }

}
