import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomepageComponent } from './homepage/homepage.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { TermsAndConditionsComponent } from './terms-and-conditions/terms-and-conditions.component';
import { GroupListComponent } from './chat/group-list/group-list.component';
import { ChatPanelComponent } from './chat/chat-panel/chat-panel.component';
import { LaunchingSoonComponent } from './launching-soon/launching-soon.component';
import { FacebookLoginComponent } from './facebook-login/facebook-login.component';

const routes: Routes = [
  {
    path: 'home',
    component: HomepageComponent
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home'
  },
  {
    path: 'privacy-policy',
    component: PrivacyPolicyComponent
  },
  {
    path: 'terms-and-conditions',
    component: TermsAndConditionsComponent
  },
  {
    path: 'groups',
    component: GroupListComponent
  },
  {
    path: 'chat/:groupId',
    component: ChatPanelComponent
  },
  {
    path: 'launching-soon',
    component: LaunchingSoonComponent
  },
  {
    path: 'facebook',
    component: FacebookLoginComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
