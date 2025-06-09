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
  selectedContentType: string = ''; // Force selection each time
  bulkMessageText: string = ''; // Bind this to the input field
  isLoading: boolean = false; // Add a flag to control the loader
  originalConversations: any[] = []; // Store the original conversations
  searchQuery: string = ''; // Bind this to the search input field
  messageInput: string = '';
  recipientId: string = '';
  threadId: string = '';
  showContentTypeDialog: boolean = false; // New flag for showing dialog
  selectedFile: File | null = null;
  selectedFilePreview: string | null = null;

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
        conversation.snippet && conversation.snippet.toLowerCase().includes(query)
      );
    } else {
      this.conversations = [...this.originalConversations]; // Restore original conversations
    }
  }

  openContentTypeDialog(): void {
    if ((!this.messageInput.trim()) || this.selectedFile) return;
    this.showContentTypeDialog = true;
  }

  sendMessageWithContentType(): void {
    if (!this.selectedContentType) {
      alert("Please select a content type.");
      return;
    }
    this.isLoading = true;
    this.containerService.sendMessageUsingFB(this.recipientId, this.messageInput, this.selectedContentType)
      .then(() => {
        this.containerService.deductMessage();
        this.messageInput = '';
        this.selectedContentType = '';
        this.showContentTypeDialog = false;
      })
      .catch(error => {
        // ...handle error...
        this.showContentTypeDialog = false;
      })
      .finally(() => {
        this.containerService.fetchChatMessages(this.threadId)
          .then(() => {
            this.isLoading = false;
            this.chatMessages = this.containerService?.selectedChatMessages?.data?.slice().reverse() || [];
            this.scrollToBottom();
          })
          .catch(error => {});
      });
  }

  onLogout(): void {
    location.reload(); // Refresh the page
  }

  // onAttachClick(): void {
  //   const fileInput = document.querySelector('input[type="file"]') as HTMLElement;
  //   if (fileInput) fileInput.click();
  // }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedFilePreview = e.target.result;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  removeAttachment(): void {
    this.selectedFile = null;
    this.selectedFilePreview = null;
  }

  onSend(): void {
    if (this.isLoading || !this.chatSelected) return;
    if (this.selectedFile) {
      // If both file and text, send both
      if (this.messageInput.trim()) {
        this.sendAttachment(true); // Pass flag to send text after image
      } else {
        this.sendAttachment(false);
      }
    } else if (this.messageInput.trim()) {
      this.openContentTypeDialog();
    }
  }

  sendAttachment(sendTextAfter: boolean = false): void {
    if (!this.selectedFile || !this.chatSelected) return;

    this.isLoading = true;
    this.containerService.sendImageAttachmentUsingFB(this.recipientId, this.selectedFile)
      .then(() => {
        this.selectedFile = null;
        this.selectedFilePreview = null;
        if (sendTextAfter && this.messageInput.trim()) {
          // After image, open content type dialog for text
          this.isLoading = false; // Allow dialog interaction
          this.openContentTypeDialog();
          return;
        }
        return this.containerService.fetchChatMessages(this.threadId);
      })
      .then((res) => {
        // Only update messages if not sending text after
        if (!sendTextAfter) {
          this.isLoading = false;
          this.chatMessages = this.containerService?.selectedChatMessages?.data?.slice().reverse() || [];
          this.scrollToBottom();
        }
      })
      .catch(() => {
        this.isLoading = false;
        this.selectedFile = null;
        this.selectedFilePreview = null;
      });
  }
}
