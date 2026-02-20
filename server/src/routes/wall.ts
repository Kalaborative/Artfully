import { Router, Response } from 'express';
import { databases, DATABASE_ID, COLLECTIONS, Query } from '../lib/appwrite.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { ID } from 'node-appwrite';

const router = Router();

function mapMessage(doc: any) {
  return {
    id: doc.$id,
    profileUserId: doc.profileUserId,
    authorUserId: doc.authorUserId,
    authorUsername: doc.authorUsername,
    authorDisplayName: doc.authorDisplayName,
    authorAvatarUrl: doc.authorAvatarUrl || undefined,
    content: doc.content,
    parentId: doc.parentId || undefined,
    createdAt: doc.createdAt,
  };
}

// GET /:userId — Get wall messages for a user (top-level + replies nested)
router.get('/:userId', async (req, res: Response) => {
  try {
    const { userId } = req.params;

    // Fetch top-level messages
    const topLevel = await databases.listDocuments(DATABASE_ID, COLLECTIONS.WALL_MESSAGES, [
      Query.equal('profileUserId', userId),
      Query.isNull('parentId'),
      Query.orderDesc('createdAt'),
      Query.limit(50),
    ]);

    const topMessages = topLevel.documents.map(mapMessage);

    if (topMessages.length === 0) {
      res.json({ messages: [] });
      return;
    }

    // Fetch all replies for these top-level messages
    const topIds = topMessages.map(m => m.id);
    const replies = await databases.listDocuments(DATABASE_ID, COLLECTIONS.WALL_MESSAGES, [
      Query.equal('parentId', topIds),
      Query.orderAsc('createdAt'),
      Query.limit(500),
    ]);

    const replyMap = new Map<string, any[]>();
    for (const doc of replies.documents) {
      const reply = mapMessage(doc);
      const arr = replyMap.get(reply.parentId!) || [];
      arr.push(reply);
      replyMap.set(reply.parentId!, arr);
    }

    const messagesWithReplies = topMessages.map(m => ({
      ...m,
      replies: replyMap.get(m.id) || [],
    }));

    res.json({ messages: messagesWithReplies });
  } catch (error) {
    console.error('Error fetching wall messages:', error);
    res.status(500).json({ error: 'Failed to fetch wall messages' });
  }
});

// POST /:userId — Post a message on someone's wall
router.post('/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId: profileUserId } = req.params;
    const authorUserId = req.userId!;
    const { content } = req.body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      res.status(400).json({ error: 'Message content is required' });
      return;
    }
    if (content.length > 500) {
      res.status(400).json({ error: 'Message must be 500 characters or less' });
      return;
    }

    // Look up author profile
    const authorProfiles = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES, [
      Query.equal('userId', authorUserId),
    ]);
    if (authorProfiles.documents.length === 0) {
      res.status(400).json({ error: 'Author profile not found' });
      return;
    }
    const authorProfile = authorProfiles.documents[0] as any;

    const doc = await databases.createDocument(
      DATABASE_ID, COLLECTIONS.WALL_MESSAGES, ID.unique(),
      {
        profileUserId,
        authorUserId,
        authorUsername: authorProfile.username,
        authorDisplayName: authorProfile.displayName,
        authorAvatarUrl: authorProfile.avatarUrl || null,
        content: content.trim(),
        parentId: null,
        createdAt: new Date().toISOString(),
      }
    );

    // Create notification for the wall owner (if not posting on own wall)
    if (profileUserId !== authorUserId) {
      try {
        await databases.createDocument(
          DATABASE_ID, COLLECTIONS.NOTIFICATIONS, ID.unique(),
          {
            userId: profileUserId,
            type: 'wall_message',
            fromUserId: authorUserId,
            fromUsername: authorProfile.username,
            fromDisplayName: authorProfile.displayName,
            referenceId: doc.$id,
            message: content.trim().substring(0, 200),
            isRead: false,
            createdAt: new Date().toISOString(),
          }
        );
      } catch (e) {
        console.error('Failed to create notification:', e);
      }
    }

    res.status(201).json(mapMessage(doc));
  } catch (error) {
    console.error('Error posting wall message:', error);
    res.status(500).json({ error: 'Failed to post message' });
  }
});

// POST /:userId/reply/:messageId — Reply to a wall message
router.post('/:userId/reply/:messageId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId: profileUserId, messageId } = req.params;
    const authorUserId = req.userId!;
    const { content } = req.body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      res.status(400).json({ error: 'Reply content is required' });
      return;
    }
    if (content.length > 500) {
      res.status(400).json({ error: 'Reply must be 500 characters or less' });
      return;
    }

    // Verify parent message exists and belongs to this wall
    let parentMessage: any;
    try {
      parentMessage = await databases.getDocument(DATABASE_ID, COLLECTIONS.WALL_MESSAGES, messageId);
    } catch {
      res.status(404).json({ error: 'Parent message not found' });
      return;
    }

    if (parentMessage.profileUserId !== profileUserId) {
      res.status(400).json({ error: 'Parent message does not belong to this wall' });
      return;
    }

    // Look up author profile
    const authorProfiles = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES, [
      Query.equal('userId', authorUserId),
    ]);
    if (authorProfiles.documents.length === 0) {
      res.status(400).json({ error: 'Author profile not found' });
      return;
    }
    const authorProfile = authorProfiles.documents[0] as any;

    const doc = await databases.createDocument(
      DATABASE_ID, COLLECTIONS.WALL_MESSAGES, ID.unique(),
      {
        profileUserId,
        authorUserId,
        authorUsername: authorProfile.username,
        authorDisplayName: authorProfile.displayName,
        authorAvatarUrl: authorProfile.avatarUrl || null,
        content: content.trim(),
        parentId: messageId,
        createdAt: new Date().toISOString(),
      }
    );

    // Notify parent message author (if different from reply author)
    const notifiedUsers = new Set<string>();
    if (parentMessage.authorUserId !== authorUserId) {
      notifiedUsers.add(parentMessage.authorUserId);
      try {
        await databases.createDocument(
          DATABASE_ID, COLLECTIONS.NOTIFICATIONS, ID.unique(),
          {
            userId: parentMessage.authorUserId,
            type: 'wall_reply',
            fromUserId: authorUserId,
            fromUsername: authorProfile.username,
            fromDisplayName: authorProfile.displayName,
            referenceId: doc.$id,
            message: content.trim().substring(0, 200),
            isRead: false,
            createdAt: new Date().toISOString(),
          }
        );
      } catch (e) {
        console.error('Failed to create reply notification:', e);
      }
    }

    // Notify wall owner (if different from both reply author and parent author)
    if (profileUserId !== authorUserId && !notifiedUsers.has(profileUserId)) {
      try {
        await databases.createDocument(
          DATABASE_ID, COLLECTIONS.NOTIFICATIONS, ID.unique(),
          {
            userId: profileUserId,
            type: 'wall_reply',
            fromUserId: authorUserId,
            fromUsername: authorProfile.username,
            fromDisplayName: authorProfile.displayName,
            referenceId: doc.$id,
            message: content.trim().substring(0, 200),
            isRead: false,
            createdAt: new Date().toISOString(),
          }
        );
      } catch (e) {
        console.error('Failed to create wall owner notification:', e);
      }
    }

    res.status(201).json(mapMessage(doc));
  } catch (error) {
    console.error('Error posting reply:', error);
    res.status(500).json({ error: 'Failed to post reply' });
  }
});

// DELETE /:messageId — Delete own message or any message on own wall
router.delete('/:messageId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId!;

    let message: any;
    try {
      message = await databases.getDocument(DATABASE_ID, COLLECTIONS.WALL_MESSAGES, messageId);
    } catch {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    // Must be the author or the wall owner
    if (message.authorUserId !== userId && message.profileUserId !== userId) {
      res.status(403).json({ error: 'Not authorized to delete this message' });
      return;
    }

    // If top-level message, also delete all replies
    if (!message.parentId) {
      const replies = await databases.listDocuments(DATABASE_ID, COLLECTIONS.WALL_MESSAGES, [
        Query.equal('parentId', messageId),
        Query.limit(500),
      ]);
      for (const reply of replies.documents) {
        await databases.deleteDocument(DATABASE_ID, COLLECTIONS.WALL_MESSAGES, reply.$id);
      }
    }

    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.WALL_MESSAGES, messageId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting wall message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

export default router;
