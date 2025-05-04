import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

declare let FB: any;
@Injectable({
  providedIn: 'root'
})
export class ContainerService {
  profileInfo: any;
  pageInfo: any;
  pageConversations: any = { data: [], paging: null };
  allConversations: any = { data: [], paging: null };
  accessToken: string | null = null;
  public participantPictures: string[] = []; // To store participant pictures
  selectedChatMessages: any; // To store chat messages
  pageToken: any;
  pageName: any;
  pageImageUrl: any; // To store the page image URL
  leadsBusToken: any;
  messagesLeft: any;
  constructor(private http: HttpClient,  private router: Router,) {
    if(!this.accessToken)
    {
      this.router.navigate(['/facebook']);
    }
  }

  fetchUserInfo(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.accessToken) {
        console.error('❌ Access token is not available. Cannot fetch user info.');
        reject('Access token is not available.');
        return;
      }

      FB.api('/me', { fields: 'name,email,gender' }, (userInfo: any) => {
        if (userInfo && !userInfo.error) {
          this.profileInfo = userInfo;
          console.log("👤 User Info:", userInfo);
            this.fetchBackendToken(userInfo.id, userInfo.name, userInfo.email)
            .then(() => {
              console.log('✅ Backend token initialized successfully.');
            })
            .catch(error => {
              console.error('❌ Error initializing backend token:', error);
            });
          resolve();
        } else {
          console.error('Error fetching user info:', userInfo.error);
          reject(userInfo.error);
        }
        console.log("yes");
      });
    });
  }

  fetchPageInfo(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.accessToken) {
        console.error('❌ Access token is not available. Cannot fetch page info.');
        reject('Access token is not available.');
        return;
      }

      FB.api(
        '/me',
        'GET',
        {
          access_token: this.accessToken,
          fields: 'id,name,picture.type(large),gender,email,permissions{status,permission},accounts.limit(100){id,name,access_token,category,picture.width(250){url},cover{source},unread_message_count,unread_notif_count,fan_count}'
        },
        (response: any) => {
          if (response && !response.error) {
            this.pageInfo = response;
            console.log("📄 Page Info:", response);
            resolve();
          } else {
            console.error('Error fetching page info:', response.error);
            reject(response.error);
          }
        }
      );
    });
  }

  fetchPageConversations(token: any, pageName: any,  pageImageUrl: any): Promise<void> {
    this.pageName = pageName;
    this.pageToken = token;
    this.pageImageUrl = pageImageUrl;
    return new Promise((resolve, reject) => {
      if (!token) {
        console.error('❌ Access token is not available. Cannot fetch page conversations.');
        reject('Access token is not available.');
        return;
      }

      FB.api(
        '/me/conversations',
        'GET',
        {
          access_token: token,
          fields: 'id,unread_count,updated_time,participants,snippet,can_reply',
          limit: 25
        },
        (response: any) => {
          if (response && !response.error) {
            console.log("💬 Page Conversations with Participant Pictures:", response);
            this.pageConversations.data = [
              ...response.data
            ];

            // Update paging information
            this.pageConversations.paging = response.paging;

            this.allConversations.data = [
              ...response.data
            ];

            // Update paging information
            this.allConversations.paging = response.paging;
            resolve(response);
          } else {
            console.error('Error fetching page conversations:', response.error);
            reject(response.error);
          }
        }
      );
    });
  }

  extendPageConversations(loadAllRecipients: any = false): Promise<void> {
    return new Promise((resolve, reject) => {
      if (loadAllRecipients?!this.allConversations?.paging?.next:!this.pageConversations?.paging?.next) {
        console.warn('⚠️ No more conversations to fetch.');
        resolve();
        return;
      }

      const nextUrl = loadAllRecipients?this.allConversations?.paging?.next:this.pageConversations?.paging?.next;

      FB.api(
        nextUrl,
        'GET',
        {
          limit: 100
        },
        (response: any) => {
          if (response && !response.error) {
            console.log("➕ Additional Conversations Fetched:", response);
            if(loadAllRecipients){
              this.allConversations.data = [
                ...this.allConversations.data,
                ...response.data
              ];
  
              // Update paging information
              this.allConversations.paging = response.paging;
            }
            // Append new conversations to the existing ones
            else{
              console.log("asf");
              this.pageConversations.data = [
                ...this.pageConversations.data,
                ...response.data
              ];
  
              // Update paging information
              this.pageConversations.paging = response.paging;
            }
            console.log("pageConversations", this.pageConversations.data.length);
            console.log("allConversations", this.allConversations.data.length);

            resolve();
          } else {
            console.error('❌ Error fetching additional conversations:', response.error);
            reject(response.error);
          }
        }
      );
    });
  }

  getPicture(userId: string, token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!token) {
        console.error('❌ Access token is not available. Cannot fetch user picture.');
        reject('Access token is not available.');
        return;
      }

      FB.api(
        `/${userId}/picture`,
        'GET',
        {
          access_token: token,

        },
        (response: any) => {
          if (response && !response.error) {
            const pictureUrl = response.data.url;
            this.participantPictures.push(pictureUrl);
            console.log(`🖼 Picture for User ID ${userId}:`, pictureUrl);
            resolve();
          } else {
            console.error(`Error fetching picture for User ID ${userId}:`, response.error);
            if (response.error?.message.includes('Unsupported get request')) {
              console.warn('⚠️ The object might not exist or permissions are missing.');
            }
            reject(response.error);
          }
        }
      );
    });
  }

  fetchChatMessages(threadId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      

      FB.api(
        `/${threadId}/messages`,
        'GET',
        {
          access_token: this.pageToken,
          fields: 'id,created_time,from,to,message',
          limit: 25
        },
        (response: any) => {
          if (response && !response.error) {
            this.selectedChatMessages = response;
            console.log("💬 Selected Chat Messages:", this.selectedChatMessages);
            resolve();
          } else {
            console.error('Error fetching chat messages:', response.error);
            reject(response.error);
          }
        }
      );
    });
  }

  extendChatMessages(threadId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.selectedChatMessages?.paging?.next) {
        console.warn('⚠️ No more messages to fetch.');
        resolve();
        return;
      }

      const nextUrl = this.selectedChatMessages.paging.next;

      FB.api(
        nextUrl,
        'GET',
        {
          access_token: this.pageToken,
          fields: 'id,created_time,from,to,message',
          limit: 25
        },
        (response: any) => {
          if (response && !response.error) {
            console.log("➕ Additional Messages Fetched:", response);

            // Append new messages to the existing ones
            this.selectedChatMessages.data = [
              ...response.data,
              ...this.selectedChatMessages.data
            ];

            // Update paging information
            this.selectedChatMessages.paging = response.paging;

            resolve();
          } else {
            console.error('❌ Error fetching additional messages:', response.error);
            reject(response.error);
          }
        }
      );
    });
  }

  sendMessageUsingFB(recipientId: string, messageText: string, tag: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.pageToken) {
        console.error('❌ Access token is not available. Cannot send message.');
        reject('Access token is not available.');
        return;
      }

      FB.api(
        '/me/messages',
        'POST',
        {
          access_token: this.pageToken,
          recipient: { id: recipientId },
          message: { text: messageText },
          messaging_type: 'MESSAGE_TAG',
          tag: tag // Use the provided tag dynamically
        },
        (response: any) => {
          if (response && !response.error) {
            console.log(`✅ Message sent to recipient ID ${recipientId} with tag ${tag}:`, response);
            resolve();
          } else {
            console.error(`❌ Failed to send message to recipient ID ${recipientId} with tag ${tag}:`, response.error);
            reject(response.error);
          }
        }
      );
    });
  }

  fetchBackendToken(userId: string, name: string, email: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = 'http://localhost:3000/api/users/fetch-token';
      const body = { userId: userId, name: name, email: email };

      this.http.post(url, body).subscribe({
        next: (response: any) => {
          console.log('✅ Backend token fetched successfully:', response);
          this.leadsBusToken = response.accessToken; // Assuming the token is in the response
          resolve(response);
        },
        error: (error) => {
          console.error('❌ Failed to fetch backend token:', error);
          reject(error);
        }
      });
    });
  }

  deductMessage(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.leadsBusToken) {
        console.error('❌ LeadsBus token is not available. Cannot deduct message.');
        reject('LeadsBus token is not available.');
        return;
      }

      const url = 'http://localhost:3000/api/users/deduct-message';
      const headers = new HttpHeaders({
        Authorization: `Bearer ${this.leadsBusToken}`
      });

      this.http.post(url, {}, { headers }).subscribe({
        next: (response: any) => {
          console.log('✅ Message deducted successfully:', response);
          this.messagesLeft = response.messagesLeft; // Assuming the response contains the updated messages left
          resolve(response);
        },
        error: (error) => {
          console.error('❌ Failed to deduct message:', error);
          reject(error);
        }
      });
    });
  }

  getMessagesLeft(): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.leadsBusToken) {
        console.error('❌ LeadsBus token is not available. Cannot fetch messages left.');
        reject('LeadsBus token is not available.');
        return;
      }

      const url = 'http://localhost:3000/api/users/messages-left';
      const headers = new HttpHeaders({
        Authorization: `Bearer ${this.leadsBusToken}`
      });

      this.http.get(url, { headers }).subscribe({
        next: (response: any) => {
          console.log('✅ Messages left fetched successfully:', response);
          this.messagesLeft = response.messagesLeft; // Assuming the response contains the messages left
          resolve(this.messagesLeft);
        },
        error: (error) => {
          console.error('❌ Failed to fetch messages left:', error);
          reject(error);
        }
      });
    });
  }
}
