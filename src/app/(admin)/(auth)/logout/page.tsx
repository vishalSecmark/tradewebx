'use client';
import { useEffect } from 'react';
import { logout } from '@/utils/auth';

export default function LogoutPage() {
  useEffect(() => {
    // Execute logout on component mount
    logout();
  }, []);

  // Return null since this is just a functional page that handles logout
  return null;
}