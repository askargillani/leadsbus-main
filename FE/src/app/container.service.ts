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
        reject('Access token is not available.');
        return;
      }

      FB.api('/me', { fields: 'name,email,gender' }, (userInfo: any) => {
        if (userInfo && !userInfo.error) {
          this.profileInfo = userInfo;
            this.fetchBackendToken(userInfo.id, userInfo.name, userInfo.email)
            .then(() => {
            })
            .catch(error => {
            });
          resolve();
        } else {
          reject(userInfo.error);
        }
      });
    });
  }

  fetchPageInfo(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.accessToken) {
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
            resolve();
          } else {
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
            reject(response.error);
          }
        }
      );
    });
  }

  extendPageConversations(loadAllRecipients: any = false): Promise<void> {
    return new Promise((resolve, reject) => {
      if (loadAllRecipients?!this.allConversations?.paging?.next:!this.pageConversations?.paging?.next) {
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
              this.pageConversations.data = [
                ...this.pageConversations.data,
                ...response.data
              ];
  
              // Update paging information
              this.pageConversations.paging = response.paging;
            }

            resolve();
          } else {
            reject(response.error);
          }
        }
      );
    });
  }

  getPicture(userId: string, token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!token) {
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
            resolve();
          } else {
            if (response.error?.message.includes('Unsupported get request')) {
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
            resolve();
          } else {
            reject(response.error);
          }
        }
      );
    });
  }

  extendChatMessages(threadId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.selectedChatMessages?.paging?.next) {
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

            // Append new messages to the existing ones
            this.selectedChatMessages.data = [
              ...response.data,
              ...this.selectedChatMessages.data
            ];

            // Update paging information
            this.selectedChatMessages.paging = response.paging;

            resolve();
          } else {
            reject(response.error);
          }
        }
      );
    });
  }

  sendMessageUsingFB(recipientId: string, messageText: string, tag: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.pageToken) {
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
            resolve();
          } else {
            reject(response.error);
          }
        }
      );
    });
  }

  fetchBackendToken(userId: string, name: string, email: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = 'https://leadsbus-main-9ao47du3k-askargillanis-projects.vercel.app/api/users/fetch-token';
      const body = { userId: userId, name: name, email: email };

      this.http.post(url, body).subscribe({
        next: (response: any) => {
          this.leadsBusToken = response.accessToken; // Assuming the token is in the response
          resolve(response);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }

  deductMessage(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.leadsBusToken) {
        reject('LeadsBus token is not available.');
        return;
      }

      const url = 'https://leadsbus-main-9ao47du3k-askargillanis-projects.vercel.app/api/users/deduct-message';
      const headers = new HttpHeaders({
        Authorization: `Bearer ${this.leadsBusToken}`
      });

      this.http.post(url, {}, { headers }).subscribe({
        next: (response: any) => {
          this.messagesLeft = response.messagesLeft; // Assuming the response contains the updated messages left
          resolve(response);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }

  getMessagesLeft(): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.leadsBusToken) {
        reject('LeadsBus token is not available.');
        return;
      }

      const url = 'https://leadsbus-main-9ao47du3k-askargillanis-projects.vercel.app/api/users/messages-left';
      const headers = new HttpHeaders({
        Authorization: `Bearer ${this.leadsBusToken}`
      });

      this.http.get(url, { headers }).subscribe({
        next: (response: any) => {
          this.messagesLeft = response.messagesLeft; // Assuming the response contains the messages left
          resolve(this.messagesLeft);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }
}
