import { Component, OnInit, NgZone, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ContainerService } from 'src/app/container.service';

@Component({
  selector: 'app-chat-panel',
  templateUrl: './chat-panel.component.html',
  styleUrls: ['./chat-panel.component.scss']
})
export class ChatPanelComponent implements OnInit, OnDestroy {
  
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
  private refreshInterval: any; // For polling
  isBulkSending: boolean = false;
  bulkSentCount: number = 0;
  bulkTotalCount: number = 0;
  isConfettiVisible: boolean = false; // Add a flag for confetti animation
  showBulkSentDialog: boolean = false; // New flag for showing bulk sent dialog

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

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
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
    if ((!this.messageInput.trim()) && !this.selectedFile) return;
    this.showContentTypeDialog = true;
  }

  sendMessageWithContentType(): void {
    if (!this.selectedContentType) {
      alert("Please select a content type.");
      return;
    }
    this.isLoading = true;
    if(this.selectedFile)
      this.sendAttachment().then(() => {
    this.showContentTypeDialog = false;
      this.containerService.sendMessageUsingFB(this.recipientId, this.messageInput, this.selectedContentType)
        .then(() => {
          this.containerService.deductMessage();
          this.messageInput = '';
          this.selectedContentType = '';
          this.showContentTypeDialog = false;
        }).catch(error => {
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
    }).catch(error => {
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
        }); // Send attachment if selected
    else
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

    async LoadAllRecepients(): Promise<void> {
    console.log('📤 Starting recipient loading in the background...');
    this.isLoading = true; // Show the loader
    this.chatSelected = false; // Hide chat messages
    try {
      // Load all conversations in the background
      while (this.containerService.allConversations.paging?.next) {
        console.log('🔄 Fetching next page of conversations...');
        await this.LoadMore(true); // Load more conversations without updating UI immediately
        console.log(`✅ Recipients loaded so far: ${this.containerService.allConversations?.data?.length || 0}`);
      }
      console.log('✅ All recipients loaded.');
    } catch (error) {
      console.error('❌ Error while loading recipients:', error);
    } finally {
      this.isLoading = false; // Hide the loader
    }
  }

  async SendMessageToAll(): Promise<void> {
    if (!this.bulkMessageText.trim()) {
      console.error('❌ Message text is empty. Cannot send messages.');
      return;
    }

    console.log('📤 Sending bulk messages...');
    this.isLoading = true; // Show the loader

    // Setup bulk sending state
    this.isBulkSending = true;
    this.bulkSentCount = 0;
    this.bulkTotalCount = this.containerService.allConversations?.data?.length || 0;

    try {
      const sendMessages = async () => {
        this.isLoading = true;
        let sent = 0;
        for (const conversation of this.containerService.allConversations.data) {
          if (this.containerService.messagesLeft <= 0) {
            console.warn('⚠️ No messages left to send.');
            break;
          }
          const recipientId = conversation.participants.data[0].id;
          try {
            await this.containerService.sendMessageUsingFB(recipientId, this.bulkMessageText, this.selectedContentType);
            sent++;
            this.bulkSentCount = sent;
            this.containerService.deductMessage();
          } catch (error) {
            console.error(`❌ Failed to send message to conversation ID ${recipientId}:`, error);
          }
        }
        this.containerService.fetchPageConversations(this.containerService.pageToken, this.containerService.pageName,  this.containerService.pageImageUrl).then(()=>{
          this.conversations = this.containerService.pageConversations.data
        });
        this.isLoading = false;
      };

      await Promise.all([sendMessages(), this.LoadAllRecepients()]);
    } catch (error) {
      console.error('❌ Error during bulk messaging:', error);
    } finally {
      this.isLoading = false;
      setTimeout(() => {
        this.isBulkSending = false;
        this.bulkSentCount = 0;
        this.bulkTotalCount = 0;
        // Show confetti animation
        this.isConfettiVisible = true;
        setTimeout(() => {
          this.isConfettiVisible = false;
          this.showBulkSentDialog = true;
          // Removed auto-close timeout
        }, 2500);
      }, 2000); // Show overlay for 2s after completion
    }
  }

  onSend(): void {
    if (this.isLoading || !this.chatSelected) return;
    if (this.messageInput.trim() || this.selectedFile) {
      this.openContentTypeDialog();
    }
  }

  async sendAttachment(): Promise<void> {
    if (!this.selectedFile || !this.chatSelected) return;
    this.isLoading = true;
    this.containerService.sendImageAttachmentUsingFB(this.recipientId, this.selectedFile, this.selectedContentType)
      .then(() => {
        this.isLoading = false;
        this.selectedFile = null;
        this.selectedFilePreview = null;
        return this.containerService.fetchChatMessages(this.threadId);
      })
      .then((res) => {
        // Only update messages if not sending text afte
      })
      .catch(() => {
        this.isLoading = false;
        this.selectedFile = null;
        this.selectedFilePreview = null;
      });
  }

  onPaySubscription(): void {
    this.router.navigate(['/']).then(() => {
      setTimeout(() => {
        const plansSection = document.querySelector('h1 b');
        if (plansSection) {
          plansSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    });
  }

  closeBulkSentDialog(): void {
    this.showBulkSentDialog = false;
  }
}

