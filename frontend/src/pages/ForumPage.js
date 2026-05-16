import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageCircle, Eye, Plus, ArrowUp, ArrowDown, X, BookOpen, Search, Filter, CheckCircle, Star, TrendingUp, Loader, Wand2 } from 'lucide-react';

const PER_PAGE = 15;

export default function ForumPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [activeTag, setActiveTag] = useState(null);
  const [popularTags, setPopularTags] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Create post state
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [creating, setCreating] = useState(false);

  // Post detail state
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsSort, setCommentsSort] = useState('score');
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // AI states
  const [aiCheckingGrammar, setAiCheckingGrammar] = useState(false);
  const [grammarResult, setGrammarResult] = useState(null);
  const [aiEvaluatingComment, setAiEvaluatingComment] = useState(null);
  const [aiEvalLoading, setAiEvalLoading] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  // Load popular tags
  const loadTags = useCallback(async () => {
    try {
      const res = await fetch('/api/forum/tags', { headers });
      if (res.ok) {
        const data = await res.json();
        setPopularTags(data.data || []);
      }
    } catch {}
  }, []);

  // Load posts
  const fetchPosts = useCallback(async (resetPage = false) => {
    const currentPage = resetPage ? 0 : page;
    setLoading(true);
    try {
      let url = `/api/forum/posts?sort=${activeTab}&page=${currentPage}&size=${PER_PAGE}`;
      if (activeTag) url += `&tag=${encodeURIComponent(activeTag)}`;

      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        const fetched = data.data?.posts || [];
        if (resetPage || currentPage === 0) {
          setPosts(fetched);
        } else {
          setPosts(prev => [...prev, ...fetched]);
        }
        setHasMore(fetched.length === PER_PAGE);
      }
    } catch {}
    setLoading(false);
  }, [activeTab, activeTag, page]);

  // Search posts
  const searchPosts = useCallback(async (keyword) => {
    setLoading(true);
    setActiveTag(null);
    try {
      const res = await fetch(`/api/forum/posts/search?keyword=${encodeURIComponent(keyword)}&page=0&size=${PER_PAGE}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setPosts(data.data?.posts || []);
        setHasMore((data.data?.posts || []).length === PER_PAGE);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTags();
  }, []);

  useEffect(() => {
    setPage(0);
    if (searchQuery) {
      searchPosts(searchQuery);
    } else {
      fetchPosts(true);
    }
  }, [activeTab, activeTag]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    if (searchInput.trim()) {
      searchPosts(searchInput.trim());
    } else {
      fetchPosts(true);
    }
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setPage(0);
    fetchPosts(true);
  };

  const createPost = async () => {
    if (!title.trim() || !content.trim()) return;
    if (!token) {
      alert('Bạn cần đăng nhập để đăng câu hỏi.');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/forum/posts', {
        method: 'POST',
        headers,
        body: JSON.stringify({ title, content, tags }),
      });
      const data = await res.json();
      if (res.ok) {
        setTitle('');
        setContent('');
        setTags('');
        setShowCreate(false);
        setPage(0);
        fetchPosts(true);
      } else {
        alert(data.message || 'Không thể đăng câu hỏi. Vui lòng thử lại.');
      }
    } catch (err) {
      alert('Lỗi kết nối. Vui lòng thử lại.');
    }
    setCreating(false);
  };

  const fetchPostDetail = async (postId) => {
    try {
      const [postRes, commentsRes] = await Promise.all([
        fetch(`/api/forum/posts/${postId}`, { headers }),
        fetch(`/api/forum/posts/${postId}/comments?sort=${commentsSort}`, { headers }),
      ]);
      if (postRes.ok) {
        const pd = await postRes.json();
        setSelectedPost(pd.data);
      }
      if (commentsRes.ok) {
        const cd = await commentsRes.json();
        setComments(cd.data || []);
      }
    } catch {}
  };

  const votePost = async (postId, voteType) => {
    try {
      await fetch(`/api/forum/posts/${postId}/vote`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ voteType }),
      });
      if (selectedPost?.id === postId) fetchPostDetail(postId);
      else fetchPosts();
    } catch {}
  };

  const submitComment = async () => {
    if (!newComment.trim() || !selectedPost) return;
    setSubmittingComment(true);
    try {
      await fetch(`/api/forum/posts/${selectedPost.id}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: newComment }),
      });
      setNewComment('');
      fetchPostDetail(selectedPost.id);
      fetchPosts();
    } catch {}
    setSubmittingComment(false);
  };

  const voteComment = async (commentId, voteType) => {
    try {
      await fetch(`/api/forum/comments/${commentId}/vote`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ voteType }),
      });
      if (selectedPost) fetchPostDetail(selectedPost.id);
    } catch {}
  };

  const acceptAnswer = async (postId, commentId) => {
    try {
      await fetch(`/api/forum/posts/${postId}/accept/${commentId}`, {
        method: 'POST',
        headers,
      });
      if (selectedPost) fetchPostDetail(selectedPost.id);
    } catch {}
  };

  const checkGrammar = async (text, type) => {
    setAiCheckingGrammar(true);
    setGrammarResult(null);
    try {
      const res = await fetch('/api/forum/ai/check-grammar', {
        method: 'POST',
        headers,
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const data = await res.json();
        setGrammarResult({ ...data.data, type });
      }
    } catch {}
    setAiCheckingGrammar(false);
  };

  const evaluateAnswer = async (commentId, question, answer) => {
    setAiEvaluatingComment(commentId);
    setAiEvalLoading(true);
    try {
      const res = await fetch('/api/forum/ai/evaluate-answer', {
        method: 'POST',
        headers,
        body: JSON.stringify({ question, answer }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments(prev => prev.map(c =>
          c.id === commentId ? { ...c, aiEval: data.data } : c
        ));
      }
    } catch {}
    setAiEvalLoading(false);
    setAiEvaluatingComment(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const ReputationBadge = ({ rep }) => {
    if (!rep && rep !== 0) return null;
    const color = rep >= 100 ? '#f59e0b' : rep >= 50 ? '#8b5cf6' : rep >= 20 ? '#22C55E' : '#718096';
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 3,
        padding: '2px 7px', borderRadius: 20,
        background: `${color}18`, color, fontSize: '0.72rem', fontWeight: 700,
      }}>
        <Star size={10} fill={color} stroke={color} />
        {rep}
      </span>
    );
  };

  const VoteButtons = ({ count, upvoted, downvoted, onUpvote, onDownvote }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 36 }}>
      <button onClick={onUpvote} style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: 4,
        color: upvoted ? '#f59e0b' : '#cbd5e0', transition: 'color 0.2s',
      }}>
        <ArrowUp size={20} strokeWidth={2.5} />
      </button>
      <span style={{
        fontWeight: 900, fontSize: '0.88rem',
        color: upvoted ? '#f59e0b' : downvoted ? '#ef4444' : '#4a5568',
      }}>{count || 0}</span>
      <button onClick={onDownvote} style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: 4,
        color: downvoted ? '#ef4444' : '#cbd5e0', transition: 'color 0.2s',
      }}>
        <ArrowDown size={20} strokeWidth={2.5} />
      </button>
    </div>
  );

  const PostCard = ({ post }) => (
    <div className="clay-card" style={{ padding: 18, cursor: 'pointer', transition: 'all 0.2s' }}
      onClick={() => fetchPostDetail(post.id)}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div onClick={e => e.stopPropagation()}>
          <VoteButtons
            count={post.upvoteCount}
            upvoted={post.userUpvoted}
            downvoted={post.userDownvoted}
            onUpvote={() => votePost(post.id, 'up')}
            onDownvote={() => votePost(post.id, 'down')}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            {post.solved && (
              <span style={{
                background: '#22C55E22', color: '#22C55E', padding: '2px 7px',
                borderRadius: 6, fontSize: '0.7rem', fontWeight: 800, whiteSpace: 'nowrap',
              }}>
                <CheckCircle size={10} style={{ marginRight: 3 }} />Đã giải
              </span>
            )}
            <h3 style={{ fontWeight: 800, color: '#1a202c', fontSize: '0.98rem', lineHeight: 1.4 }}>
              {post.title}
            </h3>
          </div>
          <p style={{
            color: '#718096', fontSize: '0.83rem', marginBottom: 8,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {post.content}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '0.76rem', color: '#a0aec0', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600 }}>
              {post.authorAvatar
                ? <img src={post.authorAvatar} alt="" style={{ width: 18, height: 18, borderRadius: '50%', marginRight: 4, verticalAlign: 'middle' }} />
                : '👤'} {post.authorName || 'Ẩn danh'}
            </span>
            <ReputationBadge rep={post.authorReputation} />
            <span>{formatDate(post.createdAt)}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <ArrowUp size={12} /> {post.upvoteCount || 0}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <MessageCircle size={12} /> {post.commentCount || 0}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Eye size={12} /> {post.viewCount || 0}
            </span>
          </div>
          {post.tags && (
            <div style={{ marginTop: 8, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {post.tags.split(',').map((tag, i) => (
                <span key={i} onClick={(e) => { e.stopPropagation(); setActiveTag(tag.trim()); setSearchQuery(''); setSearchInput(''); }}
                  style={{
                    padding: '2px 7px', borderRadius: 6, fontSize: '0.7rem',
                    background: activeTag === tag.trim() ? '#3b82f633' : '#3b82f611',
                    color: '#3b82f6', fontWeight: 600, cursor: 'pointer',
                    border: activeTag === tag.trim() ? '1px solid #3b82f6' : '1px solid transparent',
                  }}>
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontWeight: 900, fontSize: '1.4rem', color: '#1a202c', marginBottom: 3 }}>
            Diễn đàn thảo luận
          </h1>
          <p style={{ color: '#718096', fontWeight: 600, fontSize: '0.85rem' }}>
            Đặt câu hỏi, chia sẻ kiến thức và giúp đỡ nhau học tiếng Anh
          </p>
        </div>
        {user && (
          <button className="clay-btn clay-btn-primary" onClick={() => setShowCreate(!showCreate)}>
            <Plus size={15} /> Đăng câu hỏi
          </button>
        )}
      </div>

      {/* Search + Tabs row */}
      {!selectedPost && (
        <>
          <form onSubmit={handleSearch} style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#a0aec0' }} />
              <input
                type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
                placeholder="Tìm kiếm bài viết..."
                style={{
                  width: '100%', paddingLeft: 36, paddingRight: searchInput ? 36 : 12,
                  paddingTop: 9, paddingBottom: 9, fontSize: '0.9rem',
                  borderRadius: 12, border: '2px solid rgba(0,0,0,0.08)',
                  outline: 'none', fontFamily: 'inherit', background: 'white',
                }}
              />
              {searchInput && (
                <button type="button" onClick={clearSearch}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0', padding: 2 }}>
                  <X size={14} />
                </button>
              )}
            </div>
            <button type="submit" className="clay-btn" style={{ background: '#4f46e5', color: 'white' }}>
              <Search size={15} />
            </button>
          </form>

          {/* Tabs + sort */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { id: 'newest', label: 'Mới nhất' },
              { id: 'popular', label: 'Phổ biến' },
            ].map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setPage(0); }}
                className="clay-btn"
                style={{
                  background: activeTab === tab.id ? 'linear-gradient(135deg, #4f46e5, #6366f1)' : 'white',
                  color: activeTab === tab.id ? 'white' : '#718096',
                }}>
                {tab.id === 'newest' ? '🕐' : '🔥'} {tab.label}
              </button>
            ))}
            {searchQuery && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#4f46e511', borderRadius: 10, color: '#4f46e5', fontWeight: 700, fontSize: '0.83rem' }}>
                <Search size={13} /> Kết quả: "{searchQuery}"
              </span>
            )}
          </div>

          {/* Popular tags */}
          {popularTags.length > 0 && !searchQuery && (
            <div style={{ marginBottom: 16, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <Filter size={13} color="#a0aec0" />
              <span style={{ fontSize: '0.78rem', color: '#a0aec0', fontWeight: 600 }}>Tags:</span>
              {popularTags.slice(0, 12).map(tag => (
                <button key={tag.name} onClick={() => {
                  if (activeTag === tag.name) { setActiveTag(null); } else { setActiveTag(tag.name); }
                }}
                  style={{
                    padding: '3px 9px', borderRadius: 20, fontSize: '0.75rem',
                    background: activeTag === tag.name ? '#4f46e533' : '#f1f5f9',
                    color: activeTag === tag.name ? '#4f46e5' : '#64748b',
                    fontWeight: 600, border: 'none', cursor: 'pointer',
                  }}>
                  {tag.name} ({tag.count})
                </button>
              ))}
              {activeTag && (
                <button onClick={() => setActiveTag(null)}
                  style={{ padding: '3px 8px', borderRadius: 20, fontSize: '0.72rem', background: '#fee2e2', color: '#ef4444', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                  <X size={10} /> Bỏ lọc
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Create Post Form */}
      {showCreate && (
        <div className="clay-card" style={{ padding: 24, marginBottom: 20, border: '2px solid #4f46e533' }}>
          <h3 style={{ fontWeight: 800, color: '#1a202c', marginBottom: 16 }}>Tạo câu hỏi mới</h3>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Tiêu đề câu hỏi (ngắn gọn, rõ ràng)..."
            className="clay-input"
            style={{ width: '100%', marginBottom: 10, padding: '9px 13px', fontSize: '0.93rem' }} />
          <textarea value={content} onChange={e => setContent(e.target.value)}
            placeholder="Nội dung chi tiết (mô tả vấn đề, ví dụ, ngữ cảnh)..."
            rows={4} style={{
              width: '100%', padding: '9px 13px', fontSize: '0.88rem',
              borderRadius: 12, border: '2px solid rgba(0,0,0,0.08)',
              resize: 'vertical', fontFamily: 'inherit', marginBottom: 10, outline: 'none',
            }} />
          <input type="text" value={tags} onChange={e => setTags(e.target.value)}
            placeholder="Tags (phân cách bằng dấu phẩy): grammar, vocabulary, speaking..."
            className="clay-input"
            style={{ width: '100%', marginBottom: 10, padding: '7px 13px', fontSize: '0.85rem' }} />

          {/* AI Grammar Check */}
          {content.trim().length > 10 && (
            <div style={{ marginBottom: 10 }}>
              <button
                onClick={() => checkGrammar(content, 'post')}
                disabled={aiCheckingGrammar}
                className="clay-btn"
                style={{ fontSize: '0.8rem', padding: '5px 12px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                {aiCheckingGrammar ? <><Loader size={12} className="spin" /> Đang kiểm tra...</> : <><Wand2 size={12} /> Kiểm tra ngữ pháp AI</>}
              </button>
              {grammarResult && grammarResult.type === 'post' && (
                <GrammarResultPanel result={grammarResult} onClose={() => setGrammarResult(null)} />
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="clay-btn clay-btn-primary" onClick={createPost} disabled={creating}>
              {creating ? <Loader size={14} className="spin" /> : null} Đăng câu hỏi
            </button>
            <button className="clay-btn" onClick={() => setShowCreate(false)}>Hủy</button>
          </div>
        </div>
      )}

      {/* Post list or detail */}
      {!selectedPost ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#718096' }}>
              <Loader size={24} className="spin" style={{ marginBottom: 8 }} />
              <div>Đang tải...</div>
            </div>
          ) : posts.length === 0 ? (
            <div className="clay-card" style={{ padding: 40, textAlign: 'center' }}>
              <BookOpen size={40} color="#a0aec0" style={{ marginBottom: 12 }} />
              <p style={{ color: '#718096', fontWeight: 600 }}>Không tìm thấy bài viết nào.</p>
            </div>
          ) : (
            <>
              {posts.map(post => <PostCard key={post.id} post={post} />)}
              {hasMore && (
                <button className="clay-btn" onClick={() => { setPage(p => p + 1); }}
                  style={{ alignSelf: 'center', marginTop: 8 }}>
                  Tải thêm...
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        /* Post Detail */
        <div>
          <button className="clay-btn" onClick={() => { setSelectedPost(null); fetchPosts(); }} style={{ marginBottom: 14 }}>
            ← Quay lại
          </button>

          <div className="clay-card" style={{ padding: 26, marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
              {selectedPost.solved && (
                <span style={{ background: '#22C55E22', color: '#22C55E', padding: '3px 10px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 800 }}>
                  <CheckCircle size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />Đã giải quyết
                </span>
              )}
              <h1 style={{ fontWeight: 900, fontSize: '1.25rem', color: '#1a202c' }}>{selectedPost.title}</h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '0.8rem', color: '#718096', marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700 }}>
                {selectedPost.authorAvatar
                  ? <img src={selectedPost.authorAvatar} alt="" style={{ width: 20, height: 20, borderRadius: '50%', marginRight: 5, verticalAlign: 'middle' }} />
                  : '👤'} {selectedPost.authorName || 'Ẩn danh'}
              </span>
              <ReputationBadge rep={selectedPost.authorReputation} />
              <span>{formatDate(selectedPost.createdAt)}</span>
              <span><Eye size={13} /> {selectedPost.viewCount}</span>
            </div>
            <div style={{ fontSize: '0.93rem', color: '#4a5568', lineHeight: 1.8, whiteSpace: 'pre-wrap', marginBottom: 14 }}>
              {selectedPost.content}
            </div>
            {selectedPost.tags && (
              <div style={{ marginBottom: 14, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {selectedPost.tags.split(',').map((tag, i) => (
                  <span key={i} style={{ padding: '3px 9px', borderRadius: 7, fontSize: '0.75rem', background: '#3b82f611', color: '#3b82f6', fontWeight: 600 }}>
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
            <div style={{ paddingTop: 14, borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', gap: 8 }}>
              <VoteButtons
                count={selectedPost.upvoteCount}
                upvoted={selectedPost.userUpvoted}
                downvoted={selectedPost.userDownvoted}
                onUpvote={() => votePost(selectedPost.id, 'up')}
                onDownvote={() => votePost(selectedPost.id, 'down')}
              />
            </div>
          </div>

          {/* Comments */}
          <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <h3 style={{ fontWeight: 800, color: '#1a202c', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <MessageCircle size={17} /> Bình luận ({comments.length})
            </h3>
            <select value={commentsSort} onChange={e => { setCommentsSort(e.target.value); fetchPostDetail(selectedPost.id); }}
              className="clay-input" style={{ fontSize: '0.82rem', padding: '4px 10px' }}>
              <option value="score">Theo điểm</option>
              <option value="newest">Mới nhất</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
            {comments.map(comment => (
              <div key={comment.id} className="clay-card" style={{
                padding: 14,
                borderLeft: comment.accepted ? '4px solid #22C55E' : '4px solid transparent',
                background: comment.accepted ? 'rgba(34,197,94,0.04)' : 'white',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: '#1a202c', fontSize: '0.86rem' }}>
                      {comment.authorAvatar
                        ? <img src={comment.authorAvatar} alt="" style={{ width: 18, height: 18, borderRadius: '50%', marginRight: 5, verticalAlign: 'middle' }} />
                        : '👤'} {comment.authorName || 'Ẩn danh'}
                    </span>
                    <ReputationBadge rep={comment.authorReputation} />
                    <span style={{ fontSize: '0.73rem', color: '#a0aec0' }}>{formatDate(comment.createdAt)}</span>
                    {comment.accepted && (
                      <span style={{ background: '#22C55E22', color: '#22C55E', padding: '2px 7px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800 }}>
                        ✓ Đáp án được chấp nhận
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {user?.userId === selectedPost.userId && !selectedPost.acceptedCommentId && (
                      <button onClick={() => acceptAnswer(selectedPost.id, comment.id)}
                        className="clay-btn"
                        style={{ fontSize: '0.73rem', padding: '3px 8px', background: '#22C55E22', color: '#22C55E' }}>
                        <CheckCircle size={11} /> Chấp nhận
                      </button>
                    )}
                    <button onClick={() => voteComment(comment.id, 'up')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, color: comment.userUpvoted ? '#f59e0b' : '#cbd5e0' }}>
                      <ArrowUp size={16} />
                    </button>
                    <span style={{ fontWeight: 800, fontSize: '0.8rem', color: comment.userUpvoted ? '#f59e0b' : '#4a5568' }}>
                      {comment.upvoteCount || 0}
                    </span>
                    <button onClick={() => voteComment(comment.id, 'down')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, color: comment.userDownvoted ? '#ef4444' : '#cbd5e0' }}>
                      <ArrowDown size={16} />
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: '0.88rem', color: '#4a5568', lineHeight: 1.7, marginBottom: 8 }}>
                  {comment.content}
                </div>
                {comment.aiEval && (
                  <AIResultPanel result={comment.aiEval} />
                )}
                {!comment.aiEval && (
                  <button onClick={() => evaluateAnswer(comment.id, selectedPost.title, comment.content)}
                    disabled={aiEvaluatingComment === comment.id}
                    style={{
                      fontSize: '0.73rem', padding: '3px 8px', background: 'none',
                      border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer',
                      color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                    {aiEvaluatingComment === comment.id
                      ? <><Loader size={10} className="spin" /> Đang đánh giá...</>
                      : <><Wand2 size={10} /> AI đánh giá</>}
                  </button>
                )}
              </div>
            ))}
            {comments.length === 0 && (
              <div style={{ textAlign: 'center', padding: 20, color: '#a0aec0', fontWeight: 600 }}>
                Chưa có bình luận nào.
              </div>
            )}
          </div>

          {user && (
            <div className="clay-card" style={{ padding: 18 }}>
              <h4 style={{ fontWeight: 700, color: '#1a202c', marginBottom: 8 }}>Viết bình luận</h4>
              <textarea value={newComment} onChange={e => setNewComment(e.target.value)}
                placeholder="Viết câu trả lời của bạn..."
                rows={3} style={{
                  width: '100%', padding: '9px 13px', fontSize: '0.88rem',
                  borderRadius: 12, border: '2px solid rgba(0,0,0,0.08)',
                  resize: 'vertical', fontFamily: 'inherit', outline: 'none', marginBottom: 10,
                }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="clay-btn clay-btn-primary" onClick={submitComment} disabled={submittingComment}>
                  {submittingComment ? <Loader size={14} className="spin" /> : null} Gửi bình luận
                </button>
                {newComment.trim().length > 10 && (
                  <button onClick={() => checkGrammar(newComment, 'comment')}
                    disabled={aiCheckingGrammar}
                    className="clay-btn"
                    style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', fontSize: '0.82rem' }}>
                    {aiCheckingGrammar ? <Loader size={12} className="spin" /> : <Wand2 size={12} />} Kiểm tra ngữ pháp
                  </button>
                )}
              </div>
              {grammarResult && grammarResult.type === 'comment' && (
                <GrammarResultPanel result={grammarResult} onClose={() => setGrammarResult(null)} />
              )}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
      `}</style>
    </div>
  );
}

function GrammarResultPanel({ result, onClose }) {
  const score = result.score;
  const color = score >= 8 ? '#22C55E' : score >= 6 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ marginTop: 10, padding: 12, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Wand2 size={13} color="#4f46e5" />
          <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#4f46e5' }}>Kết quả kiểm tra ngữ pháp</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0' }}><X size={14} /></button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontWeight: 900, fontSize: '1.4rem', color }}>{score}/10</span>
        <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 3 }}>
          <div style={{ width: `${score * 10}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.5s' }} />
        </div>
      </div>
      {result.feedback && (
        <p style={{ fontSize: '0.82rem', color: '#4a5568', marginBottom: result.details?.length ? 8 : 0 }}>{result.feedback}</p>
      )}
      {result.details?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {result.details.map((d, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
              <span style={{ color: '#718096', fontWeight: 600 }}>{d.criterion}:</span>
              <span style={{ color: d.score >= 7 ? '#22C55E' : d.score >= 5 ? '#f59e0b' : '#ef4444', fontWeight: 700 }}>
                {d.score}/10 — {d.comment}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AIResultPanel({ result }) {
  const score = result.score;
  const color = score >= 8 ? '#22C55E' : score >= 6 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ marginTop: 8, padding: 10, background: '#fef3c7', borderRadius: 8, border: '1px solid #fde68a' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <Wand2 size={12} color="#d97706" />
        <span style={{ fontWeight: 700, fontSize: '0.78rem', color: '#d97706' }}>AI đánh giá câu trả lời</span>
        <span style={{ fontWeight: 900, fontSize: '0.85rem', color }}>{score}/10</span>
      </div>
      {result.feedback && <p style={{ fontSize: '0.78rem', color: '#92400e', margin: 0 }}>{result.feedback}</p>}
      {result.details?.length > 0 && (
        <div style={{ marginTop: 5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {result.details.map((d, i) => (
            <div key={i} style={{ fontSize: '0.75rem', color: '#b45309' }}>
              <span style={{ fontWeight: 700 }}>{d.criterion}:</span> {d.comment}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
