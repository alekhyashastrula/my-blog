---
title: "Why I Chose Next.js for My Blog"
date: "2026-03-05"
excerpt: "A quick look at why Next.js is a great choice for personal blogs — server components, file-based routing, and zero config."
---

# Why I Chose Next.js for My Blog

There are a lot of ways to build a personal blog. You could go with a CMS like WordPress, a static site generator like Hugo, or a fully custom setup. I chose **Next.js** — and here's why.

## File-Based Routing

Next.js uses a folder structure to define routes. Creating `/app/blog/[slug]/page.js` is all it takes to get dynamic post pages. No routing library needed, no config files.

## Server Components

With the App Router, components render on the server by default. That means:

- Fast initial page loads
- No client-side data fetching boilerplate
- Markdown is parsed once at request time (or build time)

## Tailwind CSS

Tailwind pairs perfectly with Next.js. Utility classes mean I can style things quickly without writing separate CSS files or worrying about naming conventions.

## The Developer Experience

Hot reload, TypeScript support (when needed), and a huge ecosystem make Next.js a joy to work with day-to-day.

If you're starting a blog from scratch, I'd recommend giving it a try.
