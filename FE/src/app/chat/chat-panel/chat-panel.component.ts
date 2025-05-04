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
      .then(messagesLeft => {
        console.log('✅ Messages left:', messagesLeft);
      })
      .catch(error => {
        console.error('❌ Failed to fetch messages left:', error);
      });

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
    console.log("threadId", threadId);
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
        console.log("💬 Chat Messages (Reversed):", this.chatMessages);

        // Scroll to the bottom of the chat panel
        this.scrollToBottom();
      })
      .catch(error => {
        console.error('❌ Failed to fetch chat messages:', error);
      });
  }

  onScroll(messagePanel: Element): void {
    if (messagePanel.scrollTop + messagePanel.clientHeight >= messagePanel.scrollHeight) {
      console.log('🔄 Scroll reached the bottom. Loading more conversations...');
      this.containerService.extendPageConversations()
        .then(() => {
          this.conversations = this.containerService.pageConversations.data;
          console.log('✅ Conversations extended:', this.conversations);
        })
        .catch(error => {
          console.error('❌ Failed to load more conversations:', error);
        });
    }
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

    try {
      const sendMessages = async () => {
        for (const conversation of this.containerService.allConversations.data) {
          if (this.containerService.messagesLeft <= 0) {
            console.warn('⚠️ No messages left to send.');
            break;
          }
          const recipientId = conversation.participants.data[0].id; // Assuming `id` is the recipient ID
          try {
            await this.containerService.sendMessageUsingFB(recipientId, this.bulkMessageText, this.selectedContentType);
            console.log(`✅ Message sent to conversation ID ${recipientId}`);
            this.containerService.deductMessage();
          } catch (error) {
            console.error(`❌ Failed to send message to conversation ID ${recipientId}:`, error);
          }
        }
        console.log('✅ Bulk messaging completed.');
      };

      // Start sending messages and loading recipients concurrently
      await Promise.all([sendMessages(), this.LoadAllRecepients()]);
    } catch (error) {
      console.error('❌ Error during bulk messaging:', error);
    } finally {
      this.isLoading = false; // Hide the loader
    }
  }

  LoadMore(loadAllRecipients: any = false): Promise<void> {
    return new Promise((resolve, reject) => {
      const loadMoreButton = document.querySelector('.load-more-button');
      if (loadMoreButton) {
        loadMoreButton.setAttribute('disabled', 'true'); // Disable the button
      }

      console.log('🔄 User list scrolled to the end. Loading more users...');
      this.containerService.extendPageConversations(loadAllRecipients)
        .then(() => {
          if (!loadAllRecipients) {
            this.conversations = this.containerService.pageConversations.data;
          }
          console.log('✅ User list extended:', this.conversations);

          // Check if there are no more conversations
          if (!this.containerService.pageConversations.paging?.cursors?.after) {
            console.log('🚫 No more conversations to load.');
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
      console.log('🔄 No search query. Restoring original conversations.');
      this.conversations = [...this.originalConversations]; // Restore original conversations
    }
  }

  async sendMessageToSelectedRecipient(): Promise<void> {
    try {
      this.isLoading = true; // Show the loader
      await this.containerService.sendMessageUsingFB(this.recipientId, this.messageInput, this.selectedContentType);
      console.log(`✅ Message sent to conversation ID ${this.recipientId}`);
      this.containerService.deductMessage();
      this.messageInput = '';
    } catch (error) {
      console.error(`❌ Failed to send message to conversation ID ${this.recipientId}:`, error);
    }
    this.containerService.fetchChatMessages(this.threadId)
      .then(() => {
        this.isLoading = false;

        // Reverse the order of messages to maintain consistency
        this.chatMessages = this.containerService?.selectedChatMessages?.data?.slice().reverse() || [];
        console.log("💬 Chat Messages (Reversed):", this.chatMessages);

        // Scroll to the bottom of the chat panel
        this.scrollToBottom();
      })
      .catch(error => {
        console.error('❌ Failed to fetch chat messages:', error);
      });
  }

  onLogout(): void {
    console.log('🔄 Logging out and refreshing the page...');
    location.reload(); // Refresh the page
  }

}
