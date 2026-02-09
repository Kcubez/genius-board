'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  Loader2,
  Shield,
  LogOut,
  Trash2,
  CheckCircle,
  Clock,
  Eye,
  Filter as FilterIcon,
  Reply,
  ChevronDown,
  HelpCircle,
  Lightbulb,
  Bug,
  User,
  Mail,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Feedback } from '@/types/feedback';

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
}

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, color: 'bg-yellow-500' },
  reviewed: { label: 'Reviewed', icon: Eye, color: 'bg-blue-500' },
  resolved: { label: 'Resolved', icon: CheckCircle, color: 'bg-green-500' },
};

const typeConfig = {
  feature_inquiry: { label: 'Feature Inquiry', icon: HelpCircle, color: 'text-blue-500' },
  feature_request: { label: 'Feature Request', icon: Lightbulb, color: 'text-amber-500' },
  bug_report: { label: 'Bug Report', icon: Bug, color: 'text-red-500' },
  general: { label: 'General', icon: MessageSquare, color: 'text-violet-500' },
};

export default function AdminFeedbackPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modal states
  const [replyModal, setReplyModal] = useState<{ open: boolean; feedback: Feedback | null }>({
    open: false,
    feedback: null,
  });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; feedback: Feedback | null }>({
    open: false,
    feedback: null,
  });
  const [replyText, setReplyText] = useState('');

  // Check admin session
  const checkSession = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/auth/me');
      const data = await response.json();

      if (data.success && data.user) {
        setAdminUser(data.user);
        return true;
      } else {
        router.push('/admin/login');
        return false;
      }
    } catch {
      router.push('/admin/login');
      return false;
    }
  }, [router]);

  // Fetch feedback
  const fetchFeedback = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (typeFilter !== 'all') params.set('type', typeFilter);

      const response = await fetch(`/api/admin/feedback?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setFeedbackList(data.feedback);
      } else if (response.status === 401) {
        router.push('/admin/login');
      } else {
        toast.error('Failed to fetch feedback');
      }
    } catch {
      toast.error('Failed to fetch feedback');
    } finally {
      setLoading(false);
    }
  }, [router, statusFilter, typeFilter]);

  useEffect(() => {
    checkSession().then(isValid => {
      if (isValid) {
        fetchFeedback();
      }
    });
  }, [checkSession, fetchFeedback]);

  // Logout
  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    toast.success('Logged out');
    router.push('/admin/login');
  };

  // Reply to feedback
  const handleReply = async () => {
    if (!replyModal.feedback || !replyText.trim()) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/feedback/${replyModal.feedback.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response: replyText.trim(),
          status: 'reviewed',
        }),
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Reply sent successfully');
        setReplyModal({ open: false, feedback: null });
        setReplyText('');
        fetchFeedback();
      } else {
        toast.error(data.error || 'Failed to send reply');
      }
    } catch {
      toast.error('Failed to send reply');
    } finally {
      setSaving(false);
    }
  };

  // Update status
  const handleStatusChange = async (feedback: Feedback, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/feedback/${feedback.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Status updated');
        fetchFeedback();
      } else {
        toast.error(data.error || 'Failed to update status');
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  // Delete feedback
  const handleDelete = async () => {
    if (!deleteModal.feedback) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/feedback/${deleteModal.feedback.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Feedback deleted');
        setDeleteModal({ open: false, feedback: null });
        fetchFeedback();
      } else {
        toast.error(data.error || 'Failed to delete');
      }
    } catch {
      toast.error('Failed to delete');
    } finally {
      setSaving(false);
    }
  };

  // Open reply modal
  const openReplyModal = (feedback: Feedback) => {
    setReplyText(feedback.response || '');
    setReplyModal({ open: true, feedback });
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-violet-600 flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Feedback Management</h1>
            <p className="text-sm text-slate-400">Logged in as {adminUser?.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/users')}
            className="gap-2 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
          >
            <Shield className="h-4 w-4" />
            Users
          </Button>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="gap-2 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <FilterIcon className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-400">Filters:</span>
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="appearance-none bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 pr-8 text-sm text-white cursor-pointer hover:bg-slate-700 transition-colors"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="resolved">Resolved</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Type Filter */}
        <div className="relative">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="appearance-none bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 pr-8 text-sm text-white cursor-pointer hover:bg-slate-700 transition-colors"
          >
            <option value="all">All Types</option>
            <option value="feature_inquiry">Feature Inquiry</option>
            <option value="feature_request">Feature Request</option>
            <option value="bug_report">Bug Report</option>
            <option value="general">General</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>

        <Badge className="bg-violet-600">{feedbackList.length} items</Badge>
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {feedbackList.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No feedback found</p>
            </CardContent>
          </Card>
        ) : (
          feedbackList.map(feedback => {
            const typeInfo =
              typeConfig[feedback.type as keyof typeof typeConfig] || typeConfig.general;
            const statusInfo =
              statusConfig[feedback.status as keyof typeof statusConfig] || statusConfig.pending;

            return (
              <Card key={feedback.id} className="bg-slate-800 border-slate-700 overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={cn('p-2 rounded-lg bg-slate-700')}>
                        <typeInfo.icon className={cn('h-5 w-5', typeInfo.color)} />
                      </div>
                      <div>
                        <CardTitle className="text-white text-base flex items-center gap-2">
                          {typeInfo.label}
                          <Badge className={cn('text-xs text-white', statusInfo.color)}>
                            {statusInfo.label}
                          </Badge>
                        </CardTitle>
                        <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                          {feedback.userEmail ? (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {feedback.userEmail}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Guest
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(feedback.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openReplyModal(feedback)}
                        className="gap-1 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                      >
                        <Reply className="h-3 w-3" />
                        Reply
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteModal({ open: true, feedback })}
                        className="gap-1 text-red-400 hover:text-red-300 hover:bg-red-900/50 border-red-800"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {/* User Message */}
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <p className="text-slate-200 whitespace-pre-wrap">{feedback.message}</p>
                  </div>

                  {/* Response */}
                  {feedback.response && (
                    <div className="bg-violet-900/30 border border-violet-700/30 rounded-lg p-4">
                      <p className="text-xs text-violet-400 mb-2 flex items-center gap-1">
                        <Reply className="h-3 w-3" />
                        Response
                      </p>
                      <p className="text-slate-200 whitespace-pre-wrap">{feedback.response}</p>
                    </div>
                  )}

                  {/* Status Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-xs text-slate-400">Change status:</span>
                    {(['pending', 'reviewed', 'resolved'] as const).map(status => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(feedback, status)}
                        className={cn(
                          'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                          feedback.status === status
                            ? `${statusConfig[status].color} text-white`
                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                        )}
                      >
                        {statusConfig[status].label}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Reply Modal */}
      <Dialog
        open={replyModal.open}
        onOpenChange={open => {
          setReplyModal({ ...replyModal, open });
          if (!open) setReplyText('');
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reply to Feedback</DialogTitle>
            <DialogDescription>
              Your response will be saved and can be viewed by the user.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* Original Message */}
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-2">Original message:</p>
              <p className="text-sm">{replyModal.feedback?.message}</p>
            </div>
            {/* Reply Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Response</label>
              <Textarea
                value={replyText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setReplyText(e.target.value)
                }
                placeholder="Type your response..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReplyModal({ open: false, feedback: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReply}
              disabled={saving || !replyText.trim()}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Send Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog
        open={deleteModal.open}
        onOpenChange={open => setDeleteModal({ ...deleteModal, open })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-2">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-center">Delete Feedback?</DialogTitle>
            <DialogDescription className="text-center">
              This action cannot be undone. The feedback will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-center mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ open: false, feedback: null })}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
