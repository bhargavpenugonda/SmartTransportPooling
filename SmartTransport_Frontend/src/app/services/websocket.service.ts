import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { Subject, Observable } from 'rxjs';
import { environment } from '../environment';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private client: Client | null = null;
  private connected = false;

  connect(): void {
    if (this.connected) return;

    this.client = new Client({
      brokerURL: environment.wsUrl.replace('http', 'ws') + '/websocket',
      reconnectDelay: 5000,
      debug: () => {}
    });

    this.client.onConnect = () => {
      this.connected = true;
    };

    this.client.onDisconnect = () => {
      this.connected = false;
    };

    this.client.activate();
  }

  subscribeTo<T>(topic: string): Observable<T> {
    const subject = new Subject<T>();
    if (this.client && this.connected) {
      this.client.subscribe(topic, (msg: IMessage) => {
        subject.next(JSON.parse(msg.body));
      });
    } else {
      const checkInterval = setInterval(() => {
        if (this.client && this.connected) {
          clearInterval(checkInterval);
          this.client!.subscribe(topic, (msg: IMessage) => {
            subject.next(JSON.parse(msg.body));
          });
        }
      }, 500);
      setTimeout(() => clearInterval(checkInterval), 10000);
    }
    return subject.asObservable();
  }

  disconnect(): void {
    if (this.client) {
      this.client.deactivate();
      this.connected = false;
    }
  }
}

