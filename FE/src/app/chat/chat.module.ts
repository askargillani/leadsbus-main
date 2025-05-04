import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupListComponent } from './group-list/group-list.component';
import { ChatPanelComponent } from './chat-panel/chat-panel.component';

@NgModule({
  declarations: [
    GroupListComponent,
    ChatPanelComponent,
  ],
  imports: [
    CommonModule,
  ]
})
export class ChatModule { }
