import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'guest' | 'admin' | 'donor' | 'ngo' | 'volunteer';

interface AppState {
  role: UserRole;
  setRole: (role: UserRole) => void;

  // Logged-in user's display name, populated from the session on dashboard load
  name: string;
  setName: (name: string) => void;

  // Profile avatar, shared between Settings and the sidebar profile menu
  avatar: string;
  setAvatar: (avatar: string) => void;

  // Unread notification badge, shared between the sidebar and the Notifications page
  notificationCount: number;
  setNotificationCount: (count: number) => void;

  // Global Impact Stats
  stats: {
    mealsSaved: number;
    foodRescuedKg: number;
    co2PreventedKg: number;
    activeDeliveries: number;
    successRate: number;
  };
  incrementStats: (meals: number, weight: number, co2: number) => void;

  // Recent Activity Feed
  activities: any[];
  addActivity: (activity: any) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
  role: 'guest',
  setRole: (role) => set({ role }),

  name: 'Nitin Kannan',
  setName: (name) => set({ name }),

  avatar: 'https://github.com/shadcn.png',
  setAvatar: (avatar) => set({ avatar }),

  notificationCount: 0,
  setNotificationCount: (notificationCount) => set({ notificationCount }),

  stats: {
    mealsSaved: 3842,
    foodRescuedKg: 1245,
    co2PreventedKg: 2456,
    activeDeliveries: 12,
    successRate: 98.4,
  },
  incrementStats: (meals, weight, co2) => set((state) => ({
    stats: {
      ...state.stats,
      mealsSaved: state.stats.mealsSaved + meals,
      foodRescuedKg: state.stats.foodRescuedKg + weight,
      co2PreventedKg: state.stats.co2PreventedKg + co2,
    }
  })),

  activities: [
    { id: 1, type: 'Donation Created', message: 'Hotel Green Park listed 30 servings of Veg Biryani', time: '2 mins ago' },
    { id: 2, type: 'Matched', message: 'Spice Route matched with Hope Shelter', time: '15 mins ago' },
    { id: 3, type: 'Picked Up', message: 'Volunteer Alex picked up from Urban Bites', time: '1 hr ago' },
  ],
  addActivity: (activity) => set((state) => ({
    activities: [activity, ...state.activities]
  })),
    }),
    {
      name: 'foodbridge-app-store',
      partialize: (state) => ({ avatar: state.avatar }),
    }
  )
);
