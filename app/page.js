import Link from 'next/link';
import { getAllPosts } from '@/lib/posts';

export default function Home() {
  const posts = getAllPosts();

  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <header className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">My Blog</h1>
        <p className="mt-2 text-gray-500">Thoughts on code, projects, and everything in between.</p>
      </header>

      <ul className="space-y-8">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={`/blog/${post.slug}`} className="group">
              <p className="text-sm text-gray-400">
                {new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {post.title}
              </h2>
              {post.excerpt && (
                <p className="mt-1 text-gray-600 text-sm leading-relaxed">{post.excerpt}</p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
