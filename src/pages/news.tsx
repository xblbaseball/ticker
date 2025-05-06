'use client'

import Link from 'next/link';
import { useRouter } from 'next/navigation'
import { useEffect } from 'react';

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    router.push("/");
  });

  return <>redirecting you to <Link href="/">/</Link></>;
}
