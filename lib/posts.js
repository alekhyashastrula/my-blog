import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const postsDir = path.join(process.cwd(), 'posts');

export function getAllPosts() {
  const files = fs.readdirSync(postsDir).filter((f) => f.endsWith('.md'));

  const posts = files.map((filename) => {
    const slug = filename.replace(/\.md$/, '');
    const raw = fs.readFileSync(path.join(postsDir, filename), 'utf8');
    const { data } = matter(raw);
    return { slug, ...data };
  });

  return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function getPostBySlug(slug) {
  const filepath = path.join(postsDir, `${slug}.md`);
  const raw = fs.readFileSync(filepath, 'utf8');
  const { data, content } = matter(raw);
  return { slug, ...data, content };
}
