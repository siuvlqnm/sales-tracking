export type User = {
  id: string;
  role: 'salesperson' | 'manager';
  name: string;
  storeId: string;
  storeName: string;
};

const USER_KEY = 'sales_system_user';
const EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface StoredUser extends User {
  expiresAt: number;
}

export function saveUser(user: User): void {
  const storedUser: StoredUser = {
    ...user,
    expiresAt: Date.now() + EXPIRATION_TIME
  };
  localStorage.setItem(USER_KEY, JSON.stringify(storedUser));
}

export function getUser(): User | null {
  if (typeof window === 'undefined') {
    return null; // Return null on the server-side
  }

  const userString = localStorage.getItem(USER_KEY);
  if (!userString) return null;

  const storedUser: StoredUser = JSON.parse(userString);
  if (Date.now() > storedUser.expiresAt) {
    localStorage.removeItem(USER_KEY);
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { expiresAt, ...user } = storedUser;
  return user;
}

export function clearUser(): void {
  localStorage.removeItem(USER_KEY);
}

export function setUserFromParams(params: URLSearchParams): void {
  const userId = params.get('userId');
  const role = params.get('role');
  const name = params.get('name');
  const storeId = params.get('storeId');
  const storeName = params.get('storeName');
  if (userId && role) {
    saveUser({ id: userId, role: role as 'salesperson' | 'manager', name: name || '', storeId: storeId || '', storeName: storeName || '' });
  }
}

export function refreshUserExpiration(): void {
  const user = getUser();
  if (user) {
    saveUser(user);
  }
}
