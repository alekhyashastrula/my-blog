import Link from 'next/link';
import { marked } from 'marked';
import { getPostBySlug, getAllPosts } from '@/lib/posts';

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  return { title: post.title };
}

export default async function PostPage({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  const html = marked(post.content);

  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <Link href="/" className="text-sm text-blue-600 hover:underline">
        &larr; Back to all posts
      </Link>

      <article className="mt-8">
        <header className="mb-8">
          <p className="text-sm text-gray-400">
            {new Date(post.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900">{post.title}</h1>
        </header>

        <div
          className="prose prose-gray max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
    </main>
  );
}
