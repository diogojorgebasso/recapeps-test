import {
    Box,
    Heading,
    Text,
    VStack,
    HStack,
    Button,
    EmptyState
} from '@chakra-ui/react';
import {
    collection,
    query,
    orderBy,
    getDocs,
    doc,
    updateDoc,
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase/clientApp';
import { IoIosNotificationsOff } from "react-icons/io";
import { Notification } from '@/types/Notification';
import { headers } from 'next/headers';

// Server Action to mark a notification as read
async function markAsRead(notificationId: string) {
    'use server';
    const userId = (await headers()).get('X-User-ID'); // Get the specific header value

    if (!userId) {
        throw new Error('User ID is required to mark a notification as read.');
    }
    const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
    await updateDoc(notificationRef, { isRead: true });
    revalidatePath('/notifications');
}

// Fetch notifications on the server
async function getNotifications(userId: string): Promise<Notification[]> {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(notificationsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<Notification, 'id'>),
    }));
}

export default async function NotificationsPage() {
    const userId = (await headers()).get('X-User-ID');

    if (!userId) {
        return (
            <Box p={4}>
                <Text>Please log in to see your notifications.</Text>
            </Box>
        );
    }

    const notifications = await getNotifications(userId);

    return (
        <Box maxW="container.lg" mx="auto" p={4}>
            <Heading mb={4}>Notifications</Heading>

            {notifications.length === 0 ? (
                <EmptyState.Root>
                    <EmptyState.Content>
                        <EmptyState.Indicator >
                            <IoIosNotificationsOff />
                        </EmptyState.Indicator>
                        <EmptyState.Title> Aucune notification</EmptyState.Title>
                        <EmptyState.Description />
                    </EmptyState.Content>
                </EmptyState.Root>
            ) : (
                <VStack gap={4} align="stretch">
                    {notifications.map(({ id, isRead, title, body, createdAt }) => (
                        <Box
                            key={id}
                            p={4}
                            borderWidth="1px"
                            borderRadius="md"
                            bg={isRead ? 'gray.50' : 'white'}
                            borderColor={isRead ? 'gray.200' : 'blue.200'}
                        >
                            <HStack justify="space-between" mb={2}>
                                <Heading size="md">{title}</Heading>
                            </HStack>
                            <Text fontSize="sm" color="gray.600">
                                {body}
                            </Text>
                            <Text fontSize="xs" color="gray.500" mt={2}>
                                Received: {createdAt.toDate().toLocaleString()}
                            </Text>

                            {!isRead && (
                                <form action={markAsRead.bind(null, id)}>
                                    <Button
                                        size="sm"
                                        mt={3}
                                        colorScheme="blue"
                                        type="submit"
                                    >
                                        Marquer comme lu
                                    </Button>
                                </form>
                            )}
                        </Box>
                    ))}
                </VStack>
            )}
        </Box>
    );
}

// Page metadata
export const metadata = {
    title: 'Notifications',
};
