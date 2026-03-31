import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export const sendNotification = async (
  userId: string,
  title: string,
  message: string,
  type: NotificationType = 'info',
  link?: string
) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      message,
      type,
      link,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

export const notifyAdmins = async (
  title: string,
  message: string,
  type: NotificationType = 'info',
  link?: string
) => {
  try {
    const adminsQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
    const adminsSnap = await getDocs(adminsQuery);
    
    const notifications = adminsSnap.docs.map(adminDoc => 
      addDoc(collection(db, 'notifications'), {
        userId: adminDoc.id,
        title,
        message,
        type,
        link,
        read: false,
        createdAt: serverTimestamp(),
      })
    );
    
    await Promise.all(notifications);
  } catch (error) {
    console.error('Error notifying admins:', error);
  }
};
