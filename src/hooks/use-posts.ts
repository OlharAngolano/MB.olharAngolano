"use client";

import { useState, useEffect } from "react";

interface PostAuthor {
  id: string;
  name?: string;
  avatar?: string;
  isAdmin: boolean;
  isVerified: boolean;
  verificationType?: string;
}

interface Post {
  id: string;
  title?: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  createdAt: string;
  isHighlighted: boolean;
  isPinned: boolean;
  author: PostAuthor;
  channel?: {
    id: string;
    name: string;
    icon?: string;
    color?: string;
  };
  _count: {
    likes: number;
    comments: number;
    shares: number;
  };
}

interface PostsResponse {
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/posts?page=${pageNum}&limit=10`);
      
      if (!response.ok) {
        throw new Error("Erro ao carregar posts");
      }

      const data: PostsResponse = await response.json();
      
      if (pageNum === 1) {
        setPosts(data.posts);
      } else {
        setPosts(prev => [...prev, ...data.posts]);
      }

      setHasMore(pageNum < data.pagination.totalPages);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (postData: {
    content: string;
    title?: string;
    imageUrl?: string;
    videoUrl?: string;
    channelId?: string;
  }) => {
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao criar post");
      }

      const data = await response.json();
      setPosts(prev => [data.post, ...prev]);
      return { success: true, post: data.post };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : "Erro desconhecido" 
      };
    }
  };

  const toggleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Erro ao curtir post");
      }

      const data = await response.json();
      
      // Update the post in the local state
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            _count: {
              ...post._count,
              likes: data.liked ? post._count.likes + 1 : post._count.likes - 1
            }
          };
        }
        return post;
      }));

      return { success: true, liked: data.liked };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : "Erro desconhecido" 
      };
    }
  };

  const addComment = async (postId: string, content: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao adicionar comentário");
      }

      const data = await response.json();
      
      // Update the post comment count in local state
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            _count: {
              ...post._count,
              comments: post._count.comments + 1
            }
          };
        }
        return post;
      }));

      return { success: true, comment: data.comment };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : "Erro desconhecido" 
      };
    }
  };

  const sharePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/share`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao compartilhar post");
      }

      const data = await response.json();
      
      // Update the post share count in local state
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            _count: {
              ...post._count,
              shares: post._count.shares + 1
            }
          };
        }
        return post;
      }));

      // Add the new shared post to the feed
      if (data.newPost) {
        setPosts(prev => [data.newPost, ...prev]);
      }

      return { success: true, newPost: data.newPost };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : "Erro desconhecido" 
      };
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchPosts(page + 1);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return {
    posts,
    loading,
    error,
    hasMore,
    createPost,
    toggleLike,
    addComment,
    sharePost,
    loadMore,
    refreshPosts: () => fetchPosts(1)
  };
}