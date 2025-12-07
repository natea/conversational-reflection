/**
 * Type declarations for @photon-ai/imessage-kit
 *
 * This package provides iMessage SDK functionality on macOS.
 * Install from: npm install @photon-ai/imessage-kit better-sqlite3
 */

declare module '@photon-ai/imessage-kit' {
  export interface IMessageSDKOptions {
    debug?: boolean
    maxConcurrent?: number
    watcher?: {
      pollInterval?: number
      unreadOnly?: boolean
      excludeOwnMessages?: boolean
    }
  }

  export interface Message {
    id: number
    chatId: string
    sender?: string
    text?: string
    timestamp: string | Date
    isFromMe?: boolean
    isRead?: boolean
  }

  export interface Chat {
    chatId: string
    displayName?: string
    isGroup?: boolean
    participants?: string[]
    unreadCount?: number
    lastMessage?: string
    lastMessageDate?: string | Date
  }

  export interface GetMessagesOptions {
    sender?: string
    chatId?: string
    since?: Date
    until?: Date
    limit?: number
    unreadOnly?: boolean
    search?: string
    excludeOwnMessages?: boolean
  }

  export interface GetMessagesResult {
    messages: Message[]
    total: number
  }

  export interface ListChatsOptions {
    type?: 'direct' | 'group'
    hasUnread?: boolean
    search?: string
    limit?: number
    sortBy?: 'name' | 'lastMessage'
  }

  export interface UnreadMessagesResult {
    total: number
    senderCount: number
    messages: Message[]
  }

  export interface WatchOptions {
    onDirectMessage?: (message: Message) => void | Promise<void>
    onGroupMessage?: (message: Message) => void | Promise<void>
    onError?: (error: Error) => void
  }

  export interface SendContent {
    text?: string
    images?: string[]
    files?: string[]
  }

  export interface BatchSendItem {
    to: string
    content: string | SendContent
  }

  export class IMessageSDK {
    constructor(options?: IMessageSDKOptions)

    getMessages(options?: GetMessagesOptions): Promise<GetMessagesResult>
    listChats(options?: ListChatsOptions): Promise<Chat[]>
    getUnreadMessages(): Promise<UnreadMessagesResult>

    send(to: string, content: string | SendContent): Promise<void>
    sendFile(to: string, filePath: string): Promise<void>
    sendFiles(to: string, filePaths: string[], text?: string): Promise<void>
    sendBatch(items: BatchSendItem[]): Promise<void>

    message(msg: Message): MessageChain
    startWatching(options: WatchOptions): Promise<void>
    stopWatching(): void

    close(): Promise<void>
  }

  export interface MessageChain {
    matchText(pattern: RegExp): MessageChain
    ifUnread(): MessageChain
    ifGroupChat(): MessageChain
    when(predicate: (msg: Message) => boolean): MessageChain
    replyText(text: string): MessageChain
    execute(): Promise<void>
  }
}
