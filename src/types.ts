export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  createdAt?: string;
  category: string;
  color: string; // Hex color or styling identifier
  userId?: string;
  pinned?: boolean;
}

export enum ActiveScreen {
  HOME = 'HOME',
  NOTE_EDITOR = 'NOTE_EDITOR',
  SHOP = 'SHOP',
  SETTINGS = 'SETTINGS',
}

export enum ThemeMode {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
}

export interface UserAccount {
  name: string;
  avatarUrl: string;
  premiumCoins: number;
  phone?: string;
  email?: string;
  country?: string;
  idCode?: string;
  role?: string;
  createdAt?: string;
}

export interface DeviceSession {
  id: string;
  name: string;
  type: 'mobile' | 'desktop' | 'tablet';
  status: 'online' | 'offline';
  loginTime: string;
  logoutTime?: string;
  location: string;
}

export interface FlutterCodePreset {
  primaryColorHex: string;
  accentColorHex: string;
  darkBgColorHex: string;
  lightBgColorHex: string;
}
