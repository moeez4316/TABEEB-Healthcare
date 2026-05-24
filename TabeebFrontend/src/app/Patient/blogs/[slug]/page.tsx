import type { ComponentProps } from 'react';
import BlogDetailPage from '@/app/blogs/[slug]/page';

type BlogDetailProps = ComponentProps<typeof BlogDetailPage>;

export default function PatientBlogDetailPage(props: BlogDetailProps) {
  return <BlogDetailPage {...props} />;
}
