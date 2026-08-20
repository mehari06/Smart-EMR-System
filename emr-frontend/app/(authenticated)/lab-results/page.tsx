'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FlaskConical, 
  Download, 
  CheckCircle2, 
  Clock, 
  XCircle,
  FileText,
  Loader2,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ShieldAlert,
  Eye,
} from 'lucide-react';
import { labApi } from '@/lib/api/lab';
import { useAuthStore } from '@/store/useAuthStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

// ── Status Config ───────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  P: { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  S: { label: 'Sent to Lab', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock },
  R: { label: 'Results Received', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  X: { label: 'Cancelled', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: XCircle },
};

export default function LabResultsPage() {
  const user = useAuthStore((s) => s.user);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [sortColumn, setSortColumn] = useState('ordered_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');


    const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('asc');
    }
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['lab-results', 'patient', sortColumn, sortOrder],
    queryFn: () => labApi.listOrders({ ordering: `${sortOrder === 'desc' ? '-' : ''}${sortColumn}` }),
    enabled: !!user?.id,
  });

  const results = data?.results ?? [];
  const completedResults = results.filter((r: any) => r.status === 'R');
  const verifiedResults = results.filter((r: any) => r.is_verified);
  const pendingResults = results.filter((r: any) => r.status === 'P' || r.status === 'S');

  const handleDownload = async (orderId: number, testName: string) => {
    setDownloadingId(orderId);
    try {
      const blob = await labApi.downloadResult(orderId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${testName.replace(/\s+/g, '_')}_result.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Report downloaded');
    } catch {
      toast.error('Failed to download report');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Lab Results</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          View and download your laboratory test results
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-4">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FlaskConical className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{results.length}</p>
              <p className="text-xs font-medium text-slate-500">Total Tests</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-4">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{completedResults.length}</p>
              <p className="text-xs font-medium text-slate-500">Results Received</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-4">
            <div className="flex size-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{verifiedResults.length}</p>
              <p className="text-xs font-medium text-slate-500">Verified</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-4">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{pendingResults.length}</p>
              <p className="text-xs font-medium text-slate-500">Pending</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results List */}
            {/* Results List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Laboratory Tests</CardTitle>
            <CardDescription>Your complete lab test history</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={sortColumn === 'ordered_at' ? 'default' : 'outline'}
              onClick={() => handleSort('ordered_at')}
              className="gap-1"
            >
              Date
              {sortColumn === 'ordered_at' && (
                <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
              )}
            </Button>
            <Button
              size="sm"
              variant={sortColumn === 'status' ? 'default' : 'outline'}
              onClick={() => handleSort('status')}
              className="gap-1"
            >
              Status
              {sortColumn === 'status' && (
                <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
              )}
            </Button>
            <Button
              size="sm"
              variant={sortColumn === 'test__name' ? 'default' : 'outline'}
              onClick={() => handleSort('test__name')}
              className="gap-1"
            >
              Test Name
              {sortColumn === 'test__name' && (
                <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : isError ? (
            <p className="text-sm text-red-500">Unable to load lab results.</p>
          ) : results.length === 0 ? (
            <div className="text-center py-12">
              <FlaskConical className="h-12 w-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-500">No lab tests found</p>
              <p className="text-xs text-slate-400 mt-1">
                Your lab results will appear here once tests are ordered.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((result: any) => {
                const cfg = statusConfig[result.status] || statusConfig.P;
                const Icon = cfg.icon;
                const isExpanded = expandedId === result.id;
                const isVerified = result.is_verified;
                const canViewResult = result.status === 'R' && isVerified;
                const canDownload = canViewResult;

                return (
                  <div
                    key={result.id}
                    className="rounded-lg border border-slate-200 overflow-hidden"
                  >
                    {/* Header Row */}
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => canViewResult && setExpandedId(isExpanded ? null : result.id)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-slate-100">
                          <Icon className="size-5 text-slate-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-slate-900">
                              {result.test?.name || 'Lab Test'}
                            </p>
                            {result.test?.code && (
                              <span className="text-xs text-slate-400 font-mono">
                                ({result.test.code})
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Ordered: {new Date(result.ordered_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className={cfg.color}>{cfg.label}</Badge>
                        
                        {/* Verification Badge - only show for received results */}
                        {result.status === 'R' && (
                          isVerified ? (
                            <Badge className="bg-green-50 text-green-700 border-green-200">
                              <ShieldCheck className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge className="bg-orange-50 text-orange-700 border-orange-200">
                              <ShieldAlert className="h-3 w-3 mr-1" />
                              Awaiting Review
                            </Badge>
                          )
                        )}
                        
                        {canDownload && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(result.id, result.test?.name || 'lab_test');
                            }}
                            disabled={downloadingId === result.id}
                          >
                            {downloadingId === result.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Download className="h-3.5 w-3.5" />
                            )}
                            PDF
                          </Button>
                        )}
                        
                        {canViewResult && (
                          isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          )
                        )}
                      </div>
                    </div>

                    {/* UNVERIFIED Message */}
                    {result.status === 'R' && !isVerified && (
                      <div className="border-t border-slate-100 bg-orange-50 p-4">
                        <div className="flex items-center gap-3">
                          <ShieldAlert className="h-5 w-5 text-orange-500 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-orange-700">
                              Results Received - Awaiting Physician Review
                            </p>
                            <p className="text-xs text-orange-500 mt-1">
                              Your results have arrived but are pending review by your physician.
                              You'll be able to view them once they've been verified.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* VERIFIED - Show Result Content */}
                    {isExpanded && canViewResult && result.result_text && (
                      <div className="border-t border-slate-100 bg-slate-50 p-4">
                        {/* Verified Info */}
                        <div className="flex items-center gap-2 mb-3">
                          <ShieldCheck className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-semibold text-green-700">
                            Verified by {result.verified_by_name || 'Physician'}
                            {result.verified_at && ` on ${new Date(result.verified_at).toLocaleDateString()}`}
                          </span>
                        </div>
                        
                        {/* Result Text */}
                        <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono bg-white rounded-lg p-4 border border-slate-200">
                          {result.result_text}
                        </pre>
                        
                        {/* Download Button */}
                        <div className="mt-3 flex justify-end">
                          <Button
                            size="sm"
                            variant="default"
                            className="gap-1.5"
                            onClick={() => handleDownload(result.id, result.test?.name || 'lab_test')}
                            disabled={downloadingId === result.id}
                          >
                            {downloadingId === result.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Download className="h-3.5 w-3.5" />
                            )}
                            Download Full Report
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}