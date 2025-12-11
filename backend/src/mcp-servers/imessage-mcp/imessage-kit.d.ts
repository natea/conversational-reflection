// Type declarations for optional @photon-ai/imessage-kit package
// This allows TypeScript to compile when the package is not installed

declare module '@photon-ai/imessage-kit' {
  export class IMessageSDK {
    constructor();
    getMessagesFromContact(
      contact: string,
      options?: {
        limit?: number;
        since?: Date;
        unreadOnly?: boolean;
      }
    ): Promise<any[]>;
    getRecentMessages(options?: {
      limit?: number;
      since?: Date;
      unreadOnly?: boolean;
    }): Promise<any[]>;
    getChats(options?: { limit?: number }): Promise<any[]>;
    startWatching(config: {
      interval: number;
      contacts?: string[];
      onMessage: (message: any) => void;
    }): Promise<void>;
  }
}
