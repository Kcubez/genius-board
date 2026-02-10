'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ClipboardList,
  Loader2,
  Shield,
  LogOut,
  Trash2,
  Clock,
  Eye,
  CheckCircle,
  ChevronDown,
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SurveyResponse {
  id: string;
  userId: string | null;
  userEmail: string | null;
  type: string;
  message: string;
  response: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
}

const statusConfig = {
  pending: { label: 'New', icon: Clock, color: 'bg-yellow-500' },
  reviewed: { label: 'Reviewed', icon: Eye, color: 'bg-blue-500' },
  resolved: { label: 'Completed', icon: CheckCircle, color: 'bg-green-500' },
};

export default function AdminFeedbackPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filter
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Delete modal
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; item: SurveyResponse | null }>({
    open: false,
    item: null,
  });

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

  // Fetch survey responses
  const fetchResponses = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      params.set('type', 'survey');

      const response = await fetch(`/api/admin/feedback?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setResponses(data.feedback);
      } else if (response.status === 401) {
        router.push('/admin/login');
      } else {
        toast.error('Failed to fetch survey responses');
      }
    } catch {
      toast.error('Failed to fetch survey responses');
    } finally {
      setLoading(false);
    }
  }, [router, statusFilter]);

  useEffect(() => {
    checkSession().then(isValid => {
      if (isValid) {
        fetchResponses();
      }
    });
  }, [checkSession, fetchResponses]);

  // Logout
  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    toast.success('Logged out');
    router.push('/admin/login');
  };

  // Update status
  const handleStatusChange = async (item: SurveyResponse, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/feedback/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Status updated');
        fetchResponses();
      } else {
        toast.error(data.error || 'Failed to update status');
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  // Delete response
  const handleDelete = async () => {
    if (!deleteModal.item) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/feedback/${deleteModal.item.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Response deleted');
        setDeleteModal({ open: false, item: null });
        fetchResponses();
      } else {
        toast.error(data.error || 'Failed to delete');
      }
    } catch {
      toast.error('Failed to delete');
    } finally {
      setSaving(false);
    }
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
            <ClipboardList className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Survey Responses</h1>
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

      {/* Survey Question */}
      <Card className="bg-violet-900/20 border-violet-700/30">
        <CardContent className="py-4">
          <p className="text-violet-300 text-sm font-medium">📋 Survey Question:</p>
          <p className="text-white font-semibold mt-1">
            &quot;What kind of data types do you need for the report?&quot;
          </p>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
            className="appearance-none bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 pr-8 text-sm text-white cursor-pointer hover:bg-slate-700 transition-colors"
          >
            <option value="all">All Status</option>
            <option value="pending">New</option>
            <option value="reviewed">Reviewed</option>
            <option value="resolved">Completed</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>

        <Badge className="bg-violet-600">{responses.length} responses</Badge>
      </div>

      {/* Responses List */}
      <div className="space-y-3">
        {responses.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="py-12 text-center">
              <ClipboardList className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No survey responses yet</p>
            </CardContent>
          </Card>
        ) : (
          responses.map(item => {
            const statusInfo =
              statusConfig[item.status as keyof typeof statusConfig] || statusConfig.pending;

            return (
              <Card key={item.id} className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-white text-base flex items-center gap-2">
                          <Badge className={cn('text-xs text-white', statusInfo.color)}>
                            {statusInfo.label}
                          </Badge>
                        </CardTitle>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          {item.userEmail ? (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {item.userEmail}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Guest
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(item.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteModal({ open: true, item })}
                      className="gap-1 text-red-400 hover:text-red-300 hover:bg-red-900/50 border-red-800"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {/* User Answer */}
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <p className="text-slate-200 whitespace-pre-wrap">{item.message}</p>
                  </div>

                  {/* Status Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-slate-400">Mark as:</span>
                    {(['pending', 'reviewed', 'resolved'] as const).map(status => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(item, status)}
                        className={cn(
                          'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                          item.status === status
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
            <DialogTitle className="text-center">Delete Response?</DialogTitle>
            <DialogDescription className="text-center">
              This action cannot be undone. The response will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-center mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ open: false, item: null })}
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
