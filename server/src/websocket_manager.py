"""WebSocket connection manager for real-time updates."""

from fastapi import WebSocket
from typing import Dict, Set
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manage WebSocket connections for real-time collaborative updates."""

    def __init__(self):
        """Initialize connection manager."""
        self.active_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        """Accept and register a new WebSocket connection.

        Args:
            websocket: WebSocket connection instance
            user_id: ID of the authenticated user
        """
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        logger.info(f"User {user_id} connected via WebSocket")

        # Broadcast user joined event
        await self.broadcast(
            {
                "type": "user:joined",
                "data": {"userId": user_id},
            },
            exclude_user=user_id,
        )

    def disconnect(self, websocket: WebSocket, user_id: int):
        """Unregister a WebSocket connection.

        Args:
            websocket: WebSocket connection instance
            user_id: ID of the user
        """
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(f"User {user_id} disconnected from WebSocket")

    async def broadcast(self, message: dict, exclude_user: int | None = None):
        """Broadcast a message to all connected users.

        Args:
            message: Message dictionary to broadcast
            exclude_user: Optional user ID to exclude from broadcast
        """
        disconnected = []

        for user_id, connections in self.active_connections.items():
            if user_id == exclude_user:
                continue

            for connection in connections.copy():
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending message to user {user_id}: {e}")
                    disconnected.append((connection, user_id))

        # Clean up disconnected connections
        for connection, user_id in disconnected:
            self.disconnect(connection, user_id)

    async def send_to_user(self, user_id: int, message: dict):
        """Send a message to a specific user's connections.

        Args:
            user_id: ID of the user
            message: Message dictionary to send
        """
        if user_id not in self.active_connections:
            return

        disconnected = []
        for connection in self.active_connections[user_id].copy():
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error sending message to user {user_id}: {e}")
                disconnected.append(connection)

        # Clean up disconnected connections
        for connection in disconnected:
            self.disconnect(connection, user_id)

    def get_active_user_count(self) -> int:
        """Get count of active users.

        Returns:
            Number of users with active connections
        """
        return len(self.active_connections)


# Global connection manager instance
manager = ConnectionManager()
