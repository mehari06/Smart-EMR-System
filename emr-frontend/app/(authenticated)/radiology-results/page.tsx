'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Image as ImageIcon, 
  Download, 
  CheckCircle2, 
  Clock, 
  ShieldCheck,
  ShieldAlert,
  FileText,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { clinicalApi } from '@/lib/api/clinical';
import { useAuthStore } from '@/store/useAuthStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  P: { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  S: { label: 'Sent to Radiology', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock },
  R: { label: 'Results Received', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  X: { label: 'Cancelled', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: Clock },
};

export default function RadiologyResultsPage() {
  const user = useAuthStore((s) => s.user);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['radiology-results', 'patient'],
    queryFn: () => clinicalApi.listRadiologyOrders({}),
    enabled: !!user?.id,
  });

  const results = data?.results ?? [];
  const completedResults = results.filter((r: any) => r.status === 'R');

  const handleDownload = async (orderId: number, testName: string) => {
    setDownloadingId(orderId);
    try {
      const blob = await clinicalApi.downloadRadiologyResult(orderId);
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
        <h1 className="text-2xl font-bold text-slate-900">My Radiology Results</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          View and download your imaging results
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 pt-4">
            <div className="flex size-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <ImageIcon className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{results.length}</p>
              <p className="text-xs font-medium text-slate-500">Total Imaging Studies</p>
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
              <p className="text-xs font-medium text-slate-500">Results Available</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results List */}
      <Card>
        <CardHeader>
          <CardTitle>Imaging Studies</CardTitle>
          <CardDescription>Your complete radiology history</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : isError ? (
            <p className="text-sm text-red-500">Unable to load radiology results.</p>
          ) : results.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-500">No imaging studies found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((result: any) => {
                const cfg = statusConfig[result.status] || statusConfig.P;
                const Icon = cfg.icon;
                const isExpanded = expandedId === result.id;
                const canViewResult = result.status === 'R' && !!result.result_text;

                return (
                  <div key={result.id} className="rounded-lg border border-slate-200 overflow-hidden">
                    {/* Header Row */}
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => canViewResult && setExpandedId(isExpanded ? null : result.id)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-purple-50">
                          <Icon className="size-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900">
                              {result.test?.name || 'Radiology Test'}
                            </p>
                            {result.test?.code && (
                              <span className="text-xs text-slate-400 font-mono">
                                ({result.test.code})
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Ordered: {new Date(result.ordered_at).toLocaleDateString('en-US', {
                              year: 'numeric', month: 'short', day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className={cfg.color}>{cfg.label}</Badge>
                        
                        {canViewResult && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(result.id, result.test?.name || 'radiology');
                            }}
                          >
                            <Download className="h-3.5 w-3.5" />
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

                    {/* Result Content */}
                    {isExpanded && canViewResult && result.result_text && (
                      <div className="border-t border-slate-100 bg-slate-50 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-semibold text-purple-700">
                            Radiology Report
                          </span>
                        </div>
                        <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono bg-white rounded-lg p-4 border border-slate-200">
                          {result.result_text}
                        </pre>
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