import React from 'react';
import TabBarParent from './TabBarParent';
import TabBarDriver from './TabBarDriver';

export type TabBarType = 'parent' | 'driver';

interface TabBarSelectorProps {
  userType: TabBarType;
}

export default function TabBarSelector({ userType }: TabBarSelectorProps) {
  switch (userType) {
    case 'parent':
      return <TabBarParent />;
    case 'driver':
      return <TabBarDriver />;
    default:
      return <TabBarParent />; // Default fallback
  }
}
