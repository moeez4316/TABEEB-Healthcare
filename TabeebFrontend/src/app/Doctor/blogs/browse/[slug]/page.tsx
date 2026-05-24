import type { ComponentProps } from 'react';
import BlogDetailPage from '@/app/blogs/[slug]/page';

type BlogDetailProps = ComponentProps<typeof BlogDetailPage>;

export default function DoctorBrowseBlogDetailPage(props: BlogDetailProps) {
  return <BlogDetailPage {...props} />;
}
