import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MessagingService } from '../firebase/messaging.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  constructor(
    private messagingService: MessagingService
  ) {}
  
  ngOnInit(): void {
    this.messagingService.initializeMessaging();
  }
  
  protected readonly title = signal('bus-booking-frontend');
}
