import { usePathname } from 'next/navigation';

export const useBasePath = () => {
  const pathname = usePathname();
  if (!pathname) return '/blogs';
  if (pathname.startsWith('/Patient/blogs')) return '/Patient/blogs';
  if (pathname.startsWith('/Doctor/blogs/browse')) return '/Doctor/blogs/browse';
  if (pathname.startsWith('/Doctor/blogs')) return '/Doctor/blogs';
  return '/blogs';
};
