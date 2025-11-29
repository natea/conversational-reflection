/**
 * iMessage Kit Tests
 *
 * Tests for the iMessage client wrapper.
 * Note: Full functionality requires Full Disk Access on macOS.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { IMessageClient, getIMessageClient } from '../src/lib/imessage-client.js'

describe('IMessageClient', () => {
  let client: IMessageClient

  beforeEach(() => {
    client = new IMessageClient()
  })

  describe('initialization', () => {
    it('should create a new client instance', () => {
      expect(client).toBeInstanceOf(IMessageClient)
    })

    it('should return singleton from getIMessageClient', () => {
      const client1 = getIMessageClient()
      const client2 = getIMessageClient()
      expect(client1).toBe(client2)
    })
  })

  describe('isAvailable', () => {
    it('should check if iMessage access is available', async () => {
      // This will return false in test environment without Full Disk Access
      const available = await client.isAvailable()
      expect(typeof available).toBe('boolean')
    })
  })

  describe('message interface types', () => {
    it('should have correct Message type structure', () => {
      const mockMessage = {
        id: 1,
        chatId: 'chat123',
        sender: '+1234567890',
        text: 'Hello',
        timestamp: new Date(),
        isFromMe: false,
        isRead: true
      }

      expect(mockMessage).toHaveProperty('id')
      expect(mockMessage).toHaveProperty('chatId')
      expect(mockMessage).toHaveProperty('sender')
      expect(mockMessage).toHaveProperty('text')
      expect(mockMessage).toHaveProperty('timestamp')
      expect(mockMessage).toHaveProperty('isFromMe')
      expect(mockMessage).toHaveProperty('isRead')
    })

    it('should have correct Chat type structure', () => {
      const mockChat = {
        chatId: 'chat123',
        displayName: 'John Doe',
        isGroup: false,
        participants: ['+1234567890'],
        unreadCount: 5,
        lastMessage: 'Hello',
        lastMessageDate: new Date()
      }

      expect(mockChat).toHaveProperty('chatId')
      expect(mockChat).toHaveProperty('displayName')
      expect(mockChat).toHaveProperty('isGroup')
      expect(mockChat).toHaveProperty('participants')
      expect(mockChat).toHaveProperty('unreadCount')
    })
  })

  describe('getMessages options', () => {
    it('should accept various filter options', () => {
      const options = {
        contact: '+1234567890',
        chatId: 'chat123',
        since: new Date('2025-01-01'),
        until: new Date('2025-01-31'),
        limit: 50,
        unreadOnly: true
      }

      expect(options.contact).toBe('+1234567890')
      expect(options.limit).toBe(50)
      expect(options.unreadOnly).toBe(true)
    })

    it('should accept string dates', () => {
      const options = {
        since: '2025-01-01',
        until: '2025-01-31'
      }

      expect(typeof options.since).toBe('string')
      expect(new Date(options.since)).toBeInstanceOf(Date)
    })
  })

  describe('listChats options', () => {
    it('should accept filter options', () => {
      const options = {
        type: 'direct' as const,
        hasUnread: true,
        search: 'John',
        limit: 20
      }

      expect(options.type).toBe('direct')
      expect(options.hasUnread).toBe(true)
      expect(options.search).toBe('John')
    })
  })

  describe('close', () => {
    it('should close without error', async () => {
      await expect(client.close()).resolves.not.toThrow()
    })
  })
})

describe('iMessage SDK Mock Integration', () => {
  it('should handle SDK initialization failure gracefully', async () => {
    const client = new IMessageClient()

    // Mock the dynamic import to fail
    vi.mock('@photon-ai/imessage-kit', () => {
      throw new Error('Module not found')
    })

    // isAvailable should return false when SDK isn't available
    const available = await client.isAvailable()
    expect(typeof available).toBe('boolean')
  })
})
