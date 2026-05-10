import { describe, it, expect } from 'vitest'
import { formatPost, formatPosts } from './posts'
import type { Post } from './posts'

const mockPost: Post = {
  id: 'c1000000-0000-0000-0000-000000000001',
  label: 'Upwork',
  description: 'Freelance marketplace',
  logo_url: 'https://upwork.com/favicon.ico',
  link: 'https://upwork.com',
  is_verified: true,
  is_global: true,
  category: { label: 'Freelancing' },
  post_tag_mapping: [
    { tag: { label: 'Global', category: 'Location' } },
    { tag: { label: 'Free to Join', category: 'Cost' } },
  ],
}

describe('formatPost', () => {
  it('maps fields correctly', () => {
    const result = formatPost(mockPost)
    expect(result.name).toBe('Upwork')
    expect(result.category).toBe('Freelancing')
    expect(result.isVerified).toBe(true)
    expect(result.isGlobal).toBe(true)
  })

  it('extracts tag labels into a flat array', () => {
    const result = formatPost(mockPost)
    expect(result.tags).toEqual(['Global', 'Free to Join'])
  })

  it('falls back to Uncategorised when category is null', () => {
    const result = formatPost({ ...mockPost, category: null })
    expect(result.category).toBe('Uncategorised')
  })

  it('falls back to empty string when description is null', () => {
    const result = formatPost({ ...mockPost, description: null as any })
    expect(result.description).toBe('')
  })
})

describe('formatPosts', () => {
  it('formats an array of posts', () => {
    const results = formatPosts([mockPost, mockPost])
    expect(results).toHaveLength(2)
    expect(results[0].name).toBe('Upwork')
  })

  it('returns empty array for empty input', () => {
    expect(formatPosts([])).toEqual([])
  })
})
